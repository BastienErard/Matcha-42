import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface Notification {
	id: number;
	type: 'like' | 'unlike' | 'visit' | 'message' | 'match';
	isRead: boolean;
	createdAt: Date;
	fromUser: {
		id: number;
		username: string;
		firstName: string;
		profilePhoto: string | null;
	} | null;
}

// Récupère les notifications d'un utilisateur
export const getNotifications = async (
	userId: number,
	limit: number = 50,
	offset: number = 0
): Promise<Notification[]> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		`SELECT
			n.id,
			n.type,
			n.is_read,
			n.created_at,
			n.from_user_id,
			u.username,
			u.first_name,
			(SELECT filename FROM photos WHERE user_id = u.id AND is_profile_picture = TRUE LIMIT 1) as profile_photo
		FROM notifications n
		LEFT JOIN users u ON n.from_user_id = u.id
		WHERE n.user_id = ?
		ORDER BY n.created_at DESC
		LIMIT ? OFFSET ?`,
		[userId, limit, offset]
	);

	return rows.map((row) => ({
		id: row.id,
		type: row.type,
		isRead: Boolean(row.is_read),
		createdAt: row.created_at,
		fromUser: row.from_user_id
			? {
					id: row.from_user_id,
					username: row.username,
					firstName: row.first_name,
					profilePhoto: row.profile_photo,
				}
			: null,
	}));
};

// Compte les notifications non lues
export const getUnreadCount = async (userId: number): Promise<number> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
		[userId]
	);
	return rows[0].count;
};

// Marque une notification comme lue
export const markAsRead = async (notificationId: number, userId: number): Promise<boolean> => {
	const [result] = await pool.query<ResultSetHeader>(
		'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
		[notificationId, userId]
	);
	return result.affectedRows > 0;
};

// Marque toutes les notifications comme lues
export const markAllAsRead = async (userId: number): Promise<number> => {
	const [result] = await pool.query<ResultSetHeader>(
		'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
		[userId]
	);
	return result.affectedRows;
};

// Crée une notification (utilisé par les autres services)
export const createNotification = async (
	userId: number,
	type: 'like' | 'unlike' | 'visit' | 'message' | 'match',
	fromUserId: number
): Promise<void> => {
	await pool.query('INSERT INTO notifications (user_id, type, from_user_id) VALUES (?, ?, ?)', [
		userId,
		type,
		fromUserId,
	]);
};
