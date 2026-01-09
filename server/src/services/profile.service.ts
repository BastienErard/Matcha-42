import pool from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface Profile extends RowDataPacket {
	user_id: number;
	gender: 'male' | 'female' | 'other';
	sexual_preference: 'male' | 'female' | 'both';
	biography: string;
	birth_date: Date;
	latitude: number;
	longitude: number;
	city: string;
	country: string;
	fame_rating: number;
	profile_picture_id: number;
}

interface UserWithProfile extends RowDataPacket {
	id: number;
	email: string;
	username: string;
	first_name: string;
	last_name: string;
	is_online: boolean;
	last_login: Date;
	gender: string;
	sexual_preference: string;
	biography: string;
	birth_date: Date;
	latitude: number;
	longitude: number;
	city: string;
	country: string;
	fame_rating: number;
}

interface ProfileData {
	gender: 'male' | 'female' | 'other';
	sexualPreference: 'male' | 'female' | 'both';
	biography: string;
	birthDate: string;
	latitude?: number;
	longitude?: number;
	city?: string;
	country?: string;
}

interface UserUpdateData {
	firstName?: string;
	lastName?: string;
	email?: string;
}

// Récupère le profil complet d'un utilisateur
export const getProfile = async (userId: number): Promise<UserWithProfile | null> => {
	const [rows] = await pool.query<UserWithProfile[]>(
		`SELECT
			u.id, u.email, u.username, u.first_name, u.last_name,
			u.is_online, u.last_login,
			p.gender, p.sexual_preference, p.biography, p.birth_date,
			p.latitude, p.longitude, p.city, p.country, p.fame_rating
		FROM users u
		LEFT JOIN profiles p ON u.id = p.user_id
		WHERE u.id = ?`,
		[userId]
	);

	return rows.length > 0 ? rows[0] : null;
};

// Vérifie si un profil existe
export const profileExists = async (userId: number): Promise<boolean> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		'SELECT user_id FROM profiles WHERE user_id = ?',
		[userId]
	);
	return rows.length > 0;
};

// Crée ou met à jour le profil
export const upsertProfile = async (userId: number, data: ProfileData): Promise<void> => {
	const exists = await profileExists(userId);

	if (exists) {
		await pool.query(
			`UPDATE profiles SET
				gender = ?, sexual_preference = ?, biography = ?, birth_date = ?,
				latitude = ?, longitude = ?, city = ?, country = ?,
				location_updated_at = IF(? IS NOT NULL, NOW(), location_updated_at)
			WHERE user_id = ?`,
			[
				data.gender,
				data.sexualPreference,
				data.biography,
				data.birthDate,
				data.latitude || null,
				data.longitude || null,
				data.city || null,
				data.country || null,
				data.latitude,
				userId,
			]
		);
	} else {
		await pool.query(
			`INSERT INTO profiles
				(user_id, gender, sexual_preference, biography, birth_date, latitude, longitude, city, country, location_updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, IF(? IS NOT NULL, NOW(), NULL))`,
			[
				userId,
				data.gender,
				data.sexualPreference,
				data.biography,
				data.birthDate,
				data.latitude || null,
				data.longitude || null,
				data.city || null,
				data.country || null,
				data.latitude,
			]
		);
	}
};

// Met à jour les informations utilisateur (nom, prénom, email)
export const updateUser = async (userId: number, data: UserUpdateData): Promise<void> => {
	const fields: string[] = [];
	const values: (string | number)[] = [];

	if (data.firstName) {
		fields.push('first_name = ?');
		values.push(data.firstName);
	}
	if (data.lastName) {
		fields.push('last_name = ?');
		values.push(data.lastName);
	}
	if (data.email) {
		fields.push('email = ?');
		values.push(data.email);
	}

	if (fields.length === 0) return;

	values.push(userId);
	await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
};

// Récupère les tags d'un utilisateur
export const getUserTags = async (userId: number): Promise<string[]> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		`SELECT t.name FROM tags t
		JOIN user_tags ut ON t.id = ut.tag_id
		WHERE ut.user_id = ?`,
		[userId]
	);
	return rows.map((row) => row.name);
};

// Met à jour les tags d'un utilisateur
export const updateUserTags = async (userId: number, tagNames: string[]): Promise<void> => {
	// Supprime les anciens tags
	await pool.query('DELETE FROM user_tags WHERE user_id = ?', [userId]);

	if (tagNames.length === 0) return;

	// Récupère les IDs des tags existants
	const [existingTags] = await pool.query<RowDataPacket[]>(
		'SELECT id, name FROM tags WHERE name IN (?)',
		[tagNames]
	);

	const existingTagNames = existingTags.map((t) => t.name);
	const newTags = tagNames.filter((name) => !existingTagNames.includes(name));

	// Crée les nouveaux tags
	for (const name of newTags) {
		await pool.query('INSERT INTO tags (name) VALUES (?)', [name]);
	}

	// Récupère tous les IDs (existants + nouveaux)
	const [allTags] = await pool.query<RowDataPacket[]>('SELECT id FROM tags WHERE name IN (?)', [
		tagNames,
	]);

	// Associe les tags à l'utilisateur
	const userTagValues = allTags.map((t) => [userId, t.id]);
	await pool.query('INSERT INTO user_tags (user_id, tag_id) VALUES ?', [userTagValues]);
};

// Récupère les utilisateurs qui ont visité le profil
export const getProfileVisitors = async (userId: number): Promise<RowDataPacket[]> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		`SELECT DISTINCT u.id, u.username, u.first_name, u.last_name,
			p.gender, p.fame_rating, v.visited_at
		FROM visits v
		JOIN users u ON v.visitor_id = u.id
		LEFT JOIN profiles p ON u.id = p.user_id
		WHERE v.visited_user_id = ?
		ORDER BY v.visited_at DESC
		LIMIT 50`,
		[userId]
	);
	return rows;
};

// Récupère les utilisateurs qui ont liké le profil
export const getProfileLikers = async (userId: number): Promise<RowDataPacket[]> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		`SELECT u.id, u.username, u.first_name, u.last_name,
			p.gender, p.fame_rating, l.created_at
		FROM likes l
		JOIN users u ON l.from_user_id = u.id
		LEFT JOIN profiles p ON u.id = p.user_id
		WHERE l.to_user_id = ?
		ORDER BY l.created_at DESC
		LIMIT 50`,
		[userId]
	);
	return rows;
};
