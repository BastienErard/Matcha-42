import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import { calculateAge } from '../utils/date';
import * as notificationsService from './notifications.service';

interface PublicProfile {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	age: number | null;
	gender: string | null;
	sexualPreference: string | null;
	biography: string | null;
	city: string | null;
	country: string | null;
	latitude: number | null;
	longitude: number | null;
	fameRating: number;
	isOnline: boolean;
	lastLogin: Date | null;
	photos: Photo[];
	tags: string[];
}

interface Photo {
	id: number;
	filename: string;
	isProfilePicture: boolean;
}

interface ProfileInteractionStatus {
	hasLiked: boolean;
	hasLikedMe: boolean;
	isConnected: boolean;
	hasBlocked: boolean;
	isBlockedBy: boolean;
}

// Récupère le profil public d'un utilisateur
export const getPublicProfile = async (userId: number): Promise<PublicProfile | null> => {
	const [users] = await pool.query<RowDataPacket[]>(
		`SELECT
			u.id,
			u.username,
			u.first_name,
			u.last_name,
			u.is_online,
			u.last_login,
			p.gender,
			p.sexual_preference,
			p.biography,
			p.birth_date,
			p.city,
			p.country,
			p.latitude,
			p.longitude,
			p.fame_rating
		FROM users u
		LEFT JOIN profiles p ON u.id = p.user_id
		WHERE u.id = ? AND u.is_verified = TRUE`,
		[userId]
	);

	if (users.length === 0) {
		return null;
	}

	const user = users[0];

	// Récupère les photos
	const [photos] = await pool.query<RowDataPacket[]>(
		`SELECT id, filename, is_profile_picture
		FROM photos
		WHERE user_id = ?
		ORDER BY is_profile_picture DESC, upload_order ASC`,
		[userId]
	);

	// Récupère les tags
	const [tags] = await pool.query<RowDataPacket[]>(
		`SELECT t.name
		FROM user_tags ut
		JOIN tags t ON ut.tag_id = t.id
		WHERE ut.user_id = ?`,
		[userId]
	);

	return {
		id: user.id,
		username: user.username,
		firstName: user.first_name,
		lastName: user.last_name,
		age: calculateAge(user.birth_date),
		gender: user.gender,
		sexualPreference: user.sexual_preference,
		biography: user.biography,
		city: user.city,
		country: user.country,
		latitude: user.latitude,
		longitude: user.longitude,
		fameRating: user.fame_rating || 50,
		isOnline: Boolean(user.is_online),
		lastLogin: user.last_login,
		photos: photos.map((p) => ({
			id: p.id,
			filename: p.filename,
			isProfilePicture: Boolean(p.is_profile_picture),
		})),
		tags: tags.map((t) => t.name),
	};
};

// Récupère le statut d'interaction entre deux utilisateurs
export const getInteractionStatus = async (
	currentUserId: number,
	targetUserId: number
): Promise<ProfileInteractionStatus> => {
	// Vérifie si je l'ai liké
	const [likedRows] = await pool.query<RowDataPacket[]>(
		'SELECT 1 FROM likes WHERE from_user_id = ? AND to_user_id = ?',
		[currentUserId, targetUserId]
	);

	// Vérifie s'il m'a liké
	const [likedMeRows] = await pool.query<RowDataPacket[]>(
		'SELECT 1 FROM likes WHERE from_user_id = ? AND to_user_id = ?',
		[targetUserId, currentUserId]
	);

	// Vérifie si je l'ai bloqué
	const [blockedRows] = await pool.query<RowDataPacket[]>(
		'SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_user_id = ?',
		[currentUserId, targetUserId]
	);

	// Vérifie s'il m'a bloqué
	const [blockedByRows] = await pool.query<RowDataPacket[]>(
		'SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_user_id = ?',
		[targetUserId, currentUserId]
	);

	const hasLiked = likedRows.length > 0;
	const hasLikedMe = likedMeRows.length > 0;

	return {
		hasLiked,
		hasLikedMe,
		isConnected: hasLiked && hasLikedMe,
		hasBlocked: blockedRows.length > 0,
		isBlockedBy: blockedByRows.length > 0,
	};
};

// Enregistre une visite de profil - retourne true si c'est une nouvelle visite
export const recordVisit = async (visitorId: number, visitedId: number): Promise<boolean> => {
	// Ne pas enregistrer si c'est son propre profil
	if (visitorId === visitedId) {
		return false;
	}

	// Vérifie si une visite existe déjà aujourd'hui
	const [existing] = await pool.query<RowDataPacket[]>(
		`SELECT id, DATE(visited_at) as visit_date FROM visits
		 WHERE visitor_id = ? AND visited_user_id = ?`,
		[visitorId, visitedId]
	);

	const today = new Date().toISOString().split('T')[0];

	if (existing.length > 0) {
		const lastVisitDate = existing[0].visit_date;
		const isToday = lastVisitDate && lastVisitDate.toISOString().split('T')[0] === today;

		// Met à jour le timestamp
		await pool.query(
			`UPDATE visits SET visited_at = NOW() WHERE visitor_id = ? AND visited_user_id = ?`,
			[visitorId, visitedId]
		);

		// Si déjà visité aujourd'hui, pas une "nouvelle" visite
		return !isToday;
	}

	// Première visite
	await pool.query(
		`INSERT INTO visits (visitor_id, visited_user_id, visited_at) VALUES (?, ?, NOW())`,
		[visitorId, visitedId]
	);
	return true;
};

// Vérifie si un utilisateur existe et est vérifié
export const userExists = async (userId: number): Promise<boolean> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		'SELECT 1 FROM users WHERE id = ? AND is_verified = TRUE',
		[userId]
	);
	return rows.length > 0;
};

// Crée une notification de visite
export const createVisitNotification = async (
	visitorId: number,
	visitedUserId: number
): Promise<void> => {
	// Supprime les anciennes notifications de visite du même visiteur (anti-spam)
	await pool.query(
		`DELETE FROM notifications
		 WHERE user_id = ? AND from_user_id = ? AND type = 'visit'`,
		[visitedUserId, visitorId]
	);

	// Crée la nouvelle notification
	await notificationsService.createNotification(visitedUserId, 'visit', visitorId);
};
