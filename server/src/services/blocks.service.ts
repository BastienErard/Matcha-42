import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import { recalculateFameRating } from './famerating.service';
import { calculateAge } from '../utils/date';
import { emitBlockStatus } from '../socket/emitter';

interface BlockResult {
	success: boolean;
	code?: string;
}

// Vérifie si un blocage existe déjà
export const blockExists = async (blockerId: number, blockedId: number): Promise<boolean> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		'SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_user_id = ?',
		[blockerId, blockedId]
	);
	return rows.length > 0;
};

// Crée un blocage
export const createBlock = async (blockerId: number, blockedId: number): Promise<BlockResult> => {
	// Vérifie qu'on ne se bloque pas soi-même
	if (blockerId === blockedId) {
		return { success: false, code: 'CANNOT_BLOCK_YOURSELF' };
	}

	// Vérifie si le blocage existe déjà
	if (await blockExists(blockerId, blockedId)) {
		return { success: false, code: 'ALREADY_BLOCKED' };
	}

	// Crée le blocage
	await pool.query('INSERT INTO blocks (blocker_id, blocked_user_id) VALUES (?, ?)', [
		blockerId,
		blockedId,
	]);

	// Supprime les likes mutuels s'ils existent
	await pool.query(
		'DELETE FROM likes WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)',
		[blockerId, blockedId, blockedId, blockerId]
	);

	// Recalcule le fame rating de l'utilisateur bloqué
	await recalculateFameRating(blockedId);

	// Notifie l'utilisateur bloqué pour masquer le statut en ligne du bloqueur
	emitBlockStatus(blockedId, blockerId, true);

	return { success: true };
};

// Supprime un blocage
export const removeBlock = async (blockerId: number, blockedId: number): Promise<BlockResult> => {
	// Vérifie si le blocage existe
	if (!(await blockExists(blockerId, blockedId))) {
		return { success: false, code: 'BLOCK_NOT_FOUND' };
	}

	// Supprime le blocage
	await pool.query('DELETE FROM blocks WHERE blocker_id = ? AND blocked_user_id = ?', [
		blockerId,
		blockedId,
	]);

	// Recalcule le fame rating de l'utilisateur débloqué
	await recalculateFameRating(blockedId);

	// Notifie l'utilisateur débloqué pour réafficher le statut en ligne
	emitBlockStatus(blockedId, blockerId, false);

	return { success: true };
};

// Récupère la liste des utilisateurs bloqués par un utilisateur
export const getBlockedUsers = async (userId: number): Promise<any[]> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		`SELECT
			u.id,
			u.username,
			u.first_name,
			u.last_name,
			p.fame_rating,
			p.birth_date,
			p.city,
			(SELECT filename FROM photos WHERE user_id = u.id AND is_profile_picture = TRUE LIMIT 1) as profile_photo,
			b.created_at as blocked_at
		FROM blocks b
		JOIN users u ON b.blocked_user_id = u.id
		LEFT JOIN profiles p ON u.id = p.user_id
		WHERE b.blocker_id = ?
		ORDER BY b.created_at DESC`,
		[userId]
	);

	return rows.map((row) => ({
		id: row.id,
		username: row.username,
		firstName: row.first_name,
		lastName: row.last_name,
		fameRating: row.fame_rating || 50,
		age: calculateAge(row.birth_date),
		city: row.city,
		profilePhoto: row.profile_photo,
		blockedAt: row.blocked_at,
	}));
};

// Vérifie si un signalement existe déjà
export const reportExists = async (reporterId: number, reportedId: number): Promise<boolean> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		'SELECT 1 FROM reports WHERE reporter_id = ? AND reported_user_id = ?',
		[reporterId, reportedId]
	);
	return rows.length > 0;
};

// Crée un signalement
export const createReport = async (
	reporterId: number,
	reportedId: number,
	reason?: string
): Promise<BlockResult> => {
	// Vérifie qu'on ne se signale pas soi-même
	if (reporterId === reportedId) {
		return { success: false, code: 'CANNOT_REPORT_YOURSELF' };
	}

	// Vérifie si le signalement existe déjà
	if (await reportExists(reporterId, reportedId)) {
		return { success: false, code: 'ALREADY_REPORTED' };
	}

	// Crée le signalement
	await pool.query(
		'INSERT INTO reports (reporter_id, reported_user_id, reason) VALUES (?, ?, ?)',
		[reporterId, reportedId, reason || null]
	);

	// Recalcule le fame rating de l'utilisateur signalé
	await recalculateFameRating(reportedId);

	return { success: true };
};
