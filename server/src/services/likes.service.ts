import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import { recalculateFameRating } from './famerating.service';
import * as notificationsService from './notifications.service';
import { getOrCreateConversation, deleteConversationIfEmpty } from './chat.service';

interface LikeResult {
	success: boolean;
	isMatch: boolean;
	code?: string;
}

// Vérifie si un like existe déjà
export const likeExists = async (fromUserId: number, toUserId: number): Promise<boolean> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		'SELECT 1 FROM likes WHERE from_user_id = ? AND to_user_id = ?',
		[fromUserId, toUserId]
	);
	return rows.length > 0;
};

// Vérifie si l'utilisateur est bloqué
export const isBlocked = async (blockerId: number, blockedId: number): Promise<boolean> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		'SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_user_id = ?',
		[blockerId, blockedId]
	);
	return rows.length > 0;
};

// Crée un like
export const createLike = async (fromUserId: number, toUserId: number): Promise<LikeResult> => {
	// Vérifie qu'on ne se like pas soi-même
	if (fromUserId === toUserId) {
		return { success: false, isMatch: false, code: 'CANNOT_LIKE_YOURSELF' };
	}

	// Vérifie que l'utilisateur a une photo de profil
	if (!(await hasProfilePicture(fromUserId))) {
		return { success: false, isMatch: false, code: 'PROFILE_PICTURE_REQUIRED' };
	}

	// Vérifie qu'on n'est pas bloqué par l'utilisateur cible
	if (await isBlocked(toUserId, fromUserId)) {
		return { success: false, isMatch: false, code: 'USER_NOT_FOUND' };
	}

	// Vérifie si le like existe déjà
	if (await likeExists(fromUserId, toUserId)) {
		return { success: false, isMatch: false, code: 'ALREADY_LIKED' };
	}

	// Crée le like
	await pool.query('INSERT INTO likes (from_user_id, to_user_id) VALUES (?, ?)', [
		fromUserId,
		toUserId,
	]);

	// Vérifie si c'est un match (like mutuel)
	const isMatch = await likeExists(toUserId, fromUserId);

	// Recalcule le fame rating de l'utilisateur liké
	await recalculateFameRating(toUserId);

	// Supprime les anciennes notifications like/unlike de ce même utilisateur
	await pool.query(
		`DELETE FROM notifications
		 WHERE user_id = ? AND from_user_id = ? AND type IN ('like', 'unlike')`,
		[toUserId, fromUserId]
	);

	if (isMatch) {
		// Recalcule aussi pour celui qui vient de liker
		await recalculateFameRating(fromUserId);

		// Supprime les anciennes notifications like de l'autre côté aussi
		await pool.query(
			`DELETE FROM notifications
			 WHERE user_id = ? AND from_user_id = ? AND type = 'like'`,
			[fromUserId, toUserId]
		);

		// Crée la conversation pour le match
		await getOrCreateConversation(fromUserId, toUserId);

		// Notification match pour les deux utilisateurs
		await notificationsService.createNotification(fromUserId, 'match', toUserId);
		await notificationsService.createNotification(toUserId, 'match', fromUserId);
	} else {
		// Notification like pour l'utilisateur liké
		await notificationsService.createNotification(toUserId, 'like', fromUserId);
	}

	return { success: true, isMatch };
};

// Supprime un like
export const removeLike = async (fromUserId: number, toUserId: number): Promise<LikeResult> => {
	// Vérifie si le like existe
	if (!(await likeExists(fromUserId, toUserId))) {
		return { success: false, isMatch: false, code: 'LIKE_NOT_FOUND' };
	}

	// Vérifie si c'était un match avant de supprimer
	const wasMatch = await likeExists(toUserId, fromUserId);

	// Supprime le like
	await pool.query('DELETE FROM likes WHERE from_user_id = ? AND to_user_id = ?', [
		fromUserId,
		toUserId,
	]);

	// Recalcule le fame rating de l'utilisateur unliké
	await recalculateFameRating(toUserId);

	// Supprime les notifications like/match liées à cette relation
	await pool.query(
		`DELETE FROM notifications
		 WHERE user_id = ? AND from_user_id = ? AND type IN ('like', 'match')`,
		[toUserId, fromUserId]
	);

	if (wasMatch) {
		// Recalcule aussi pour celui qui unlike
		await recalculateFameRating(fromUserId);

		// Supprime la notification de match chez l'autre utilisateur
		await pool.query(
			`DELETE FROM notifications
			 WHERE user_id = ? AND from_user_id = ? AND type = 'match'`,
			[fromUserId, toUserId]
		);

		// Supprime la conversation si elle est vide
		await deleteConversationIfEmpty(fromUserId, toUserId);

		// Notification unlike seulement si c'était un match
		await notificationsService.createNotification(toUserId, 'unlike', fromUserId);
	}

	return { success: true, isMatch: false };
};

// Vérifie si un utilisateur a une photo de profil
const hasProfilePicture = async (userId: number): Promise<boolean> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		'SELECT 1 FROM photos WHERE user_id = ? AND is_profile_picture = TRUE LIMIT 1',
		[userId]
	);
	return rows.length > 0;
};
