import pool from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { calculateAge } from '../utils/date';

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
export const upsertProfile = async (userId: number, data: Partial<ProfileData>): Promise<void> => {
	const exists = await profileExists(userId);

	if (exists) {
		// Construit la requête dynamiquement avec seulement les champs fournis
		const fields: string[] = [];
		const values: any[] = [];

		if (data.gender !== undefined) {
			fields.push('gender = ?');
			values.push(data.gender);
		}
		if (data.sexualPreference !== undefined) {
			fields.push('sexual_preference = ?');
			values.push(data.sexualPreference);
		}
		if (data.biography !== undefined) {
			fields.push('biography = ?');
			values.push(data.biography);
		}
		if (data.birthDate !== undefined) {
			fields.push('birth_date = ?');
			values.push(data.birthDate);
		}
		if (data.latitude !== undefined) {
			fields.push('latitude = ?');
			values.push(data.latitude);
		}
		if (data.longitude !== undefined) {
			fields.push('longitude = ?');
			values.push(data.longitude);
		}
		if (data.city !== undefined) {
			fields.push('city = ?');
			values.push(data.city);
		}
		if (data.country !== undefined) {
			fields.push('country = ?');
			values.push(data.country);
		}

		if (fields.length > 0) {
			values.push(userId);
			await pool.query(`UPDATE profiles SET ${fields.join(', ')} WHERE user_id = ?`, values);
		}
	} else {
		// Création : on insère avec les valeurs fournies (les autres seront NULL)
		await pool.query(
			`INSERT INTO profiles
				(user_id, gender, sexual_preference, biography, birth_date, latitude, longitude, city, country)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				userId,
				data.gender || null,
				data.sexualPreference || null,
				data.biography || null,
				data.birthDate || null,
				data.latitude || null,
				data.longitude || null,
				data.city || null,
				data.country || null,
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
export const getProfileVisitors = async (userId: number): Promise<any[]> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		`SELECT DISTINCT u.id, u.username, u.first_name, u.last_name,
			p.gender, p.fame_rating, p.birth_date, p.city,
			(SELECT filename FROM photos WHERE user_id = u.id AND is_profile_picture = TRUE LIMIT 1) as profile_photo,
			v.visited_at
		FROM visits v
		JOIN users u ON v.visitor_id = u.id
		LEFT JOIN profiles p ON u.id = p.user_id
		WHERE v.visited_user_id = ?
		ORDER BY v.visited_at DESC
		LIMIT 50`,
		[userId]
	);

	return rows.map((row) => ({
		id: row.id,
		username: row.username,
		firstName: row.first_name,
		lastName: row.last_name,
		gender: row.gender,
		fameRating: row.fame_rating || 50,
		age: calculateAge(row.birth_date),
		city: row.city,
		profilePhoto: row.profile_photo,
		visitedAt: row.visited_at,
	}));
};

// Récupère les utilisateurs qui ont liké le profil
export const getProfileLikers = async (userId: number): Promise<any[]> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		`SELECT u.id, u.username, u.first_name, u.last_name,
			p.gender, p.fame_rating, p.birth_date, p.city,
			(SELECT filename FROM photos WHERE user_id = u.id AND is_profile_picture = TRUE LIMIT 1) as profile_photo,
			l.created_at
		FROM likes l
		JOIN users u ON l.from_user_id = u.id
		LEFT JOIN profiles p ON u.id = p.user_id
		WHERE l.to_user_id = ?
		ORDER BY l.created_at DESC
		LIMIT 50`,
		[userId]
	);

	return rows.map((row) => ({
		id: row.id,
		username: row.username,
		firstName: row.first_name,
		lastName: row.last_name,
		gender: row.gender,
		fameRating: row.fame_rating || 50,
		age: calculateAge(row.birth_date),
		city: row.city,
		profilePhoto: row.profile_photo,
		likedAt: row.created_at,
	}));
};

// Vérifie si l'utilisateur a une photo de profil
export const hasProfilePicture = async (userId: number): Promise<boolean> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		'SELECT id FROM photos WHERE user_id = ? AND is_profile_picture = TRUE LIMIT 1',
		[userId]
	);
	return rows.length > 0;
};

// Marque l'onboarding comme terminé
export const completeOnboarding = async (userId: number): Promise<void> => {
	await pool.query('UPDATE users SET has_completed_onboarding = TRUE WHERE id = ?', [userId]);
};

// Vérifie si l'utilisateur a complété l'onboarding
export const getOnboardingStatus = async (userId: number): Promise<boolean> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		'SELECT has_completed_onboarding FROM users WHERE id = ?',
		[userId]
	);
	return rows.length > 0 ? rows[0].has_completed_onboarding : false;
};

// Récupère les profils que l'utilisateur a likés
export const getLikedProfiles = async (userId: number): Promise<any[]> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		`SELECT u.id, u.username, u.first_name, u.last_name,
			p.gender, p.fame_rating, p.birth_date, p.city,
			(SELECT filename FROM photos WHERE user_id = u.id AND is_profile_picture = TRUE LIMIT 1) as profile_photo,
			l.created_at
		FROM likes l
		JOIN users u ON l.to_user_id = u.id
		LEFT JOIN profiles p ON u.id = p.user_id
		WHERE l.from_user_id = ?
		ORDER BY l.created_at DESC
		LIMIT 50`,
		[userId]
	);

	return rows.map((row) => ({
		id: row.id,
		username: row.username,
		firstName: row.first_name,
		lastName: row.last_name,
		gender: row.gender,
		fameRating: row.fame_rating || 50,
		age: calculateAge(row.birth_date),
		city: row.city,
		profilePhoto: row.profile_photo,
		likedAt: row.created_at,
	}));
};
