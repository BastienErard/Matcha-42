import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import { recalculateFameRating } from './famerating.service';

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

	// Si c'est un match, recalcule aussi pour celui qui vient de liker
	if (isMatch) {
		await recalculateFameRating(fromUserId);
		// Notification match pour les deux utilisateurs
		await createNotification(fromUserId, 'match', toUserId);
		await createNotification(toUserId, 'match', fromUserId);
	} else {
		// Notification like pour l'utilisateur liké
		await createNotification(toUserId, 'like', fromUserId);
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

	// Si c'était un match, recalcule aussi pour celui qui unlike et notifie
	if (wasMatch) {
		await recalculateFameRating(fromUserId);
		// Notification unlike
		await createNotification(toUserId, 'unlike', fromUserId);
	}

	return { success: true, isMatch: false };
};

// Crée une notification
const createNotification = async (
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
