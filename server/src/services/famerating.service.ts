import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

const BASE_RATING = 50;
const POINTS_PER_LIKE = 2;
const POINTS_PER_MATCH = 3;
const POINTS_PER_VISIT = 0.5;
const POINTS_PER_REPORT = -10;
const POINTS_PER_BLOCK = -5;

// Recalcule le fame rating d'un utilisateur basé sur toutes ses interactions
export const recalculateFameRating = async (userId: number): Promise<number> => {
	// Compte les likes reçus
	const [likesRows] = await pool.query<RowDataPacket[]>(
		'SELECT COUNT(*) as count FROM likes WHERE to_user_id = ?',
		[userId]
	);
	const likesReceived = likesRows[0].count;

	// Compte les matchs (likes mutuels)
	const [matchesRows] = await pool.query<RowDataPacket[]>(
		`SELECT COUNT(*) as count
		 FROM likes l1
		 INNER JOIN likes l2 ON l1.from_user_id = l2.to_user_id AND l1.to_user_id = l2.from_user_id
		 WHERE l1.to_user_id = ?`,
		[userId]
	);
	const matches = matchesRows[0].count;

	// Compte les visites reçues
	const [visitsRows] = await pool.query<RowDataPacket[]>(
		'SELECT COUNT(*) as count FROM visits WHERE visited_user_id = ?',
		[userId]
	);
	const visitsReceived = visitsRows[0].count;

	// Compte les signalements reçus
	const [reportsRows] = await pool.query<RowDataPacket[]>(
		'SELECT COUNT(*) as count FROM reports WHERE reported_user_id = ?',
		[userId]
	);
	const reportsReceived = reportsRows[0].count;

	// Compte les blocks reçus
	const [blocksRows] = await pool.query<RowDataPacket[]>(
		'SELECT COUNT(*) as count FROM blocks WHERE blocked_user_id = ?',
		[userId]
	);
	const blocksReceived = blocksRows[0].count;

	// Calcule le score
	const rawScore =
		BASE_RATING +
		likesReceived * POINTS_PER_LIKE +
		matches * POINTS_PER_MATCH +
		visitsReceived * POINTS_PER_VISIT +
		reportsReceived * POINTS_PER_REPORT +
		blocksReceived * POINTS_PER_BLOCK;

	// Limite entre 0 et 100
	const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

	// Met à jour en base
	await pool.query('UPDATE profiles SET fame_rating = ? WHERE user_id = ?', [finalScore, userId]);

	return finalScore;
};
