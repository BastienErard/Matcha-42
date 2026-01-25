import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { emitMessage } from '../socket/emitter';
import { createNotification } from './notifications.service';

interface Conversation {
	id: number;
	otherUser: {
		id: number;
		username: string;
		firstName: string;
		profilePhoto: string | null;
		isOnline: boolean;
		lastLogin: Date | null;
	};
	lastMessage: {
		content: string;
		senderId: number;
		createdAt: Date;
		isRead: boolean;
	} | null;
	unreadCount: number;
	updatedAt: Date;
}

interface Message {
	id: number;
	conversationId: number;
	senderId: number | null;
	senderUsername: string | null;
	content: string;
	isRead: boolean;
	createdAt: Date;
}

// Vérifie si deux utilisateurs sont connectés (match mutuel)
export const areUsersConnected = async (userId1: number, userId2: number): Promise<boolean> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		`SELECT 1 FROM likes l1
		 INNER JOIN likes l2 ON l1.from_user_id = l2.to_user_id AND l1.to_user_id = l2.from_user_id
		 WHERE l1.from_user_id = ? AND l1.to_user_id = ?`,
		[userId1, userId2]
	);
	return rows.length > 0;
};

// Vérifie si un utilisateur est bloqué
export const isBlocked = async (blockerId: number, blockedId: number): Promise<boolean> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		'SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_user_id = ?',
		[blockerId, blockedId]
	);
	return rows.length > 0;
};

// Récupère ou crée une conversation entre deux utilisateurs
export const getOrCreateConversation = async (
	userId1: number,
	userId2: number
): Promise<number> => {
	// Ordonne les IDs pour garantir l'unicité
	const [smallerId, largerId] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

	// Cherche une conversation existante
	const [existing] = await pool.query<RowDataPacket[]>(
		'SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ?',
		[smallerId, largerId]
	);

	if (existing.length > 0) {
		return existing[0].id;
	}

	// Crée une nouvelle conversation
	const [result] = await pool.query<ResultSetHeader>(
		'INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)',
		[smallerId, largerId]
	);

	return result.insertId;
};

// Récupère toutes les conversations d'un utilisateur
export const getConversations = async (userId: number): Promise<Conversation[]> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		`SELECT
			c.id,
			c.updated_at,
			CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END as other_user_id,
			u.username,
			u.first_name,
			u.is_online,
			u.last_login,
			(SELECT filename FROM photos WHERE user_id = u.id AND is_profile_picture = TRUE LIMIT 1) as profile_photo,
			(SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_content,
			(SELECT sender_id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_sender_id,
			(SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_created_at,
			(SELECT is_read FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_is_read,
			(SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = FALSE) as unread_count
		FROM conversations c
		JOIN users u ON u.id = CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END
		WHERE c.user1_id = ? OR c.user2_id = ?
		ORDER BY c.updated_at DESC`,
		[userId, userId, userId, userId, userId]
	);

	return rows.map((row) => ({
		id: row.id,
		otherUser: {
			id: row.other_user_id,
			username: row.username,
			firstName: row.first_name,
			profilePhoto: row.profile_photo,
			isOnline: Boolean(row.is_online),
			lastLogin: row.last_login,
		},
		lastMessage: row.last_message_content
			? {
					content: row.last_message_content,
					senderId: row.last_message_sender_id,
					createdAt: row.last_message_created_at,
					isRead: Boolean(row.last_message_is_read),
				}
			: null,
		unreadCount: row.unread_count,
		updatedAt: row.updated_at,
	}));
};

// Récupère les messages d'une conversation
export const getMessages = async (
	conversationId: number,
	userId: number,
	limit: number = 50,
	offset: number = 0
): Promise<Message[]> => {
	// Vérifie que l'utilisateur fait partie de la conversation
	const [convCheck] = await pool.query<RowDataPacket[]>(
		'SELECT 1 FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
		[conversationId, userId, userId]
	);

	if (convCheck.length === 0) {
		throw new Error('CONVERSATION_NOT_FOUND');
	}

	const [rows] = await pool.query<RowDataPacket[]>(
		`SELECT
			m.id,
			m.conversation_id,
			m.sender_id,
			u.username as sender_username,
			m.content,
			m.is_read,
			m.created_at
		FROM messages m
		LEFT JOIN users u ON m.sender_id = u.id
		WHERE m.conversation_id = ?
		ORDER BY m.created_at DESC
		LIMIT ? OFFSET ?`,
		[conversationId, limit, offset]
	);

	return rows.map((row) => ({
		id: row.id,
		conversationId: row.conversation_id,
		senderId: row.sender_id,
		senderUsername: row.sender_username,
		content: row.content,
		isRead: Boolean(row.is_read),
		createdAt: row.created_at,
	}));
};

// Envoie un message
export const sendMessage = async (
	senderId: number,
	receiverId: number,
	content: string
): Promise<Message> => {
	// Vérifie que les utilisateurs sont connectés (match mutuel)
	const connected = await areUsersConnected(senderId, receiverId);
	if (!connected) {
		throw new Error('USERS_NOT_CONNECTED');
	}

	// Vérifie les blocages dans les deux sens
	const senderBlocked = await isBlocked(receiverId, senderId);
	if (senderBlocked) {
		throw new Error('YOU_ARE_BLOCKED');
	}

	const receiverBlocked = await isBlocked(senderId, receiverId);
	if (receiverBlocked) {
		throw new Error('USER_BLOCKED');
	}

	// Récupère ou crée la conversation
	const conversationId = await getOrCreateConversation(senderId, receiverId);

	// Insère le message
	const [result] = await pool.query<ResultSetHeader>(
		'INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)',
		[conversationId, senderId, content]
	);

	// Met à jour le timestamp de la conversation
	await pool.query('UPDATE conversations SET updated_at = NOW() WHERE id = ?', [conversationId]);

	// Récupère le username de l'expéditeur
	const [senderRows] = await pool.query<RowDataPacket[]>(
		'SELECT username FROM users WHERE id = ?',
		[senderId]
	);
	const senderUsername = senderRows[0]?.username || null;

	const message: Message = {
		id: result.insertId,
		conversationId,
		senderId,
		senderUsername,
		content,
		isRead: false,
		createdAt: new Date(),
	};

	// Émet le message en temps réel au destinataire
	emitMessage(receiverId, {
		id: message.id,
		conversationId: message.conversationId,
		senderId: message.senderId!,
		senderUsername: message.senderUsername!,
		content: message.content,
		createdAt: message.createdAt,
	});

	// Crée une notification pour le destinataire
	await createNotification(receiverId, 'message', senderId);

	return message;
};

// Marque les messages d'une conversation comme lus
export const markMessagesAsRead = async (
	conversationId: number,
	userId: number
): Promise<number> => {
	// Vérifie que l'utilisateur fait partie de la conversation
	const [convCheck] = await pool.query<RowDataPacket[]>(
		'SELECT 1 FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
		[conversationId, userId, userId]
	);

	if (convCheck.length === 0) {
		throw new Error('CONVERSATION_NOT_FOUND');
	}

	// Marque comme lus uniquement les messages reçus (pas envoyés par l'utilisateur)
	const [result] = await pool.query<ResultSetHeader>(
		'UPDATE messages SET is_read = TRUE WHERE conversation_id = ? AND sender_id != ? AND is_read = FALSE',
		[conversationId, userId]
	);

	return result.affectedRows;
};

// Compte le nombre total de messages non lus pour un utilisateur
export const getTotalUnreadCount = async (userId: number): Promise<number> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		`SELECT COUNT(*) as count
		 FROM messages m
		 JOIN conversations c ON m.conversation_id = c.id
		 WHERE (c.user1_id = ? OR c.user2_id = ?)
		 AND m.sender_id != ?
		 AND m.is_read = FALSE`,
		[userId, userId, userId]
	);
	return rows[0].count;
};
