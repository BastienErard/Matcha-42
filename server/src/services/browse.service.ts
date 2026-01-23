import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import { calculateDistance } from './location.service';
import { calculateAge } from '../utils/date';

interface BrowseFilters {
	minAge?: number;
	maxAge?: number;
	maxDistance?: number;
	minFame?: number;
	maxFame?: number;
	tags?: string[];
}

interface BrowseSort {
	sortBy: 'distance' | 'age' | 'fame' | 'tags';
	order: 'asc' | 'desc';
}

interface ProfileSuggestion {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	age: number | null;
	gender: string;
	city: string | null;
	country: string | null;
	latitude: number | null;
	longitude: number | null;
	fameRating: number;
	profilePhoto: string | null;
	distance: number | null;
	commonTagsCount: number;
	tags: string[];
	isOnline: boolean;
	lastLogin: Date | null;
}

interface CurrentUserProfile {
	gender: string | null;
	sexualPreference: string | null;
	latitude: number | null;
	longitude: number | null;
	tags: string[];
}

// Récupère le profil de l'utilisateur courant pour le matching
const getCurrentUserProfile = async (userId: number): Promise<CurrentUserProfile | null> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		`SELECT p.gender, p.sexual_preference, p.latitude, p.longitude
		 FROM profiles p
		 WHERE p.user_id = ?`,
		[userId]
	);

	if (rows.length === 0) {
		return null;
	}

	const [tagRows] = await pool.query<RowDataPacket[]>(
		`SELECT t.name FROM user_tags ut
		 JOIN tags t ON ut.tag_id = t.id
		 WHERE ut.user_id = ?`,
		[userId]
	);

	return {
		gender: rows[0].gender,
		sexualPreference: rows[0].sexual_preference,
		latitude: rows[0].latitude,
		longitude: rows[0].longitude,
		tags: tagRows.map((t) => t.name),
	};
};

// Construit la clause WHERE pour le filtrage par orientation sexuelle
const buildOrientationFilter = (
	currentGender: string | null,
	currentPreference: string | null
): { clause: string; params: any[] } => {
	const preference = currentPreference || 'both';
	const gender = currentGender || 'both';

	let clause = '';
	const params: any[] = [];

	if (preference === 'male') {
		clause += " AND p.gender = 'male'";
	} else if (preference === 'female') {
		clause += " AND p.gender = 'female'";
	}

	if (gender === 'male') {
		clause += " AND (p.sexual_preference = 'male' OR p.sexual_preference = 'both')";
	} else if (gender === 'female') {
		clause += " AND (p.sexual_preference = 'female' OR p.sexual_preference = 'both')";
	}

	return { clause, params };
};

// Construit la clause ORDER BY multi-critères
const buildOrderClause = (sortBy: string, order: string, hasCoordinates: boolean): string => {
	// Définit les expressions de tri pour chaque critère
	const distanceExpr = hasCoordinates
		? '(POW(p.latitude - @lat, 2) + POW(p.longitude - @lng, 2))'
		: 'p.fame_rating DESC';
	const ageExpr = 'p.birth_date'; // ASC = plus jeune, DESC = plus vieux
	const tagsExpr = 'common_tags_count DESC';
	const fameExpr = 'p.fame_rating DESC';

	// Ordre par défaut : distance, age, tags, fame
	// L'ordre change selon le critère principal choisi
	switch (sortBy) {
		case 'age':
			// Age en premier, puis distance, tags, fame
			if (hasCoordinates) {
				return `ORDER BY p.birth_date ${order === 'asc' ? 'DESC' : 'ASC'}, ${distanceExpr} ASC, common_tags_count DESC, p.fame_rating DESC`;
			}
			return `ORDER BY p.birth_date ${order === 'asc' ? 'DESC' : 'ASC'}, common_tags_count DESC, p.fame_rating DESC`;

		case 'tags':
			// Tags en premier, puis distance, age, fame
			if (hasCoordinates) {
				return `ORDER BY common_tags_count ${order}, ${distanceExpr} ASC, p.birth_date DESC, p.fame_rating DESC`;
			}
			return `ORDER BY common_tags_count ${order}, p.birth_date DESC, p.fame_rating DESC`;

		case 'fame':
			// Fame en premier, puis distance, age, tags
			if (hasCoordinates) {
				return `ORDER BY p.fame_rating ${order}, ${distanceExpr} ASC, p.birth_date DESC, common_tags_count DESC`;
			}
			return `ORDER BY p.fame_rating ${order}, p.birth_date DESC, common_tags_count DESC`;

		case 'distance':
		default:
			// Distance en premier, puis age, tags, fame
			if (hasCoordinates) {
				return `ORDER BY ${distanceExpr} ${order}, p.birth_date DESC, common_tags_count DESC, p.fame_rating DESC`;
			}
			// Sans coordonnées, on trie par fame, age, tags
			return `ORDER BY p.fame_rating DESC, p.birth_date DESC, common_tags_count DESC`;
	}
};

// Récupère les suggestions de profils
export const getSuggestions = async (
	userId: number,
	filters: BrowseFilters,
	sort: BrowseSort,
	limit: number = 20,
	offset: number = 0
): Promise<{ profiles: ProfileSuggestion[]; total: number }> => {
	const currentUser = await getCurrentUserProfile(userId);

	if (!currentUser) {
		return { profiles: [], total: 0 };
	}

	const hasCoordinates = !!(currentUser.latitude && currentUser.longitude);

	// Construit la requête de base
	let query = `
		SELECT DISTINCT
			u.id,
			u.username,
			u.first_name,
			u.last_name,
			u.is_online,
			u.last_login,
			p.gender,
			p.birth_date,
			p.city,
			p.country,
			p.latitude,
			p.longitude,
			p.fame_rating,
			(SELECT filename FROM photos WHERE user_id = u.id AND is_profile_picture = TRUE LIMIT 1) as profile_photo,
			(SELECT COUNT(*) FROM user_tags ut1
			 JOIN user_tags ut2 ON ut1.tag_id = ut2.tag_id
			 WHERE ut1.user_id = u.id AND ut2.user_id = ?) as common_tags_count
		FROM users u
		JOIN profiles p ON u.id = p.user_id
		WHERE u.id != ?
		AND u.is_verified = TRUE
		AND u.has_completed_onboarding = TRUE
	`;

	const params: any[] = [userId, userId];

	// Exclure les utilisateurs bloqués (dans les deux sens)
	query += `
		AND u.id NOT IN (
			SELECT blocked_user_id FROM blocks WHERE blocker_id = ?
			UNION
			SELECT blocker_id FROM blocks WHERE blocked_user_id = ?
		)
	`;
	params.push(userId, userId);

	// Filtre par orientation sexuelle
	const orientationFilter = buildOrientationFilter(
		currentUser.gender,
		currentUser.sexualPreference
	);
	query += orientationFilter.clause;
	params.push(...orientationFilter.params);

	// Filtre par âge
	if (filters.minAge) {
		query += ` AND TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) >= ?`;
		params.push(filters.minAge);
	}
	if (filters.maxAge) {
		query += ` AND TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) <= ?`;
		params.push(filters.maxAge);
	}

	// Filtre par fame rating
	if (filters.minFame !== undefined) {
		query += ` AND p.fame_rating >= ?`;
		params.push(filters.minFame);
	}
	if (filters.maxFame !== undefined) {
		query += ` AND p.fame_rating <= ?`;
		params.push(filters.maxFame);
	}

	// Filtre par tags (recherche les profils qui ont AU MOINS un des tags demandés)
	if (filters.tags && filters.tags.length > 0) {
		query += `
			AND u.id IN (
				SELECT ut.user_id FROM user_tags ut
				JOIN tags t ON ut.tag_id = t.id
				WHERE t.name IN (${filters.tags.map(() => '?').join(',')})
				GROUP BY ut.user_id
				HAVING COUNT(DISTINCT t.name) >= 1
			)
		`;
		params.push(...filters.tags);
	}

	// Compte le total avec les mêmes filtres
	let countQuery = `
		SELECT COUNT(DISTINCT u.id) as total
		FROM users u
		JOIN profiles p ON u.id = p.user_id
		WHERE u.id != ?
		AND u.is_verified = TRUE
		AND u.has_completed_onboarding = TRUE
		AND u.id NOT IN (
			SELECT blocked_user_id FROM blocks WHERE blocker_id = ?
			UNION
			SELECT blocker_id FROM blocks WHERE blocked_user_id = ?
		)
	`;

	const countParams: any[] = [userId, userId, userId];

	countQuery += orientationFilter.clause;
	countParams.push(...orientationFilter.params);

	if (filters.minAge) {
		countQuery += ` AND TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) >= ?`;
		countParams.push(filters.minAge);
	}
	if (filters.maxAge) {
		countQuery += ` AND TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) <= ?`;
		countParams.push(filters.maxAge);
	}
	if (filters.minFame !== undefined) {
		countQuery += ` AND p.fame_rating >= ?`;
		countParams.push(filters.minFame);
	}
	if (filters.maxFame !== undefined) {
		countQuery += ` AND p.fame_rating <= ?`;
		countParams.push(filters.maxFame);
	}
	if (filters.tags && filters.tags.length > 0) {
		countQuery += `
			AND u.id IN (
				SELECT ut.user_id FROM user_tags ut
				JOIN tags t ON ut.tag_id = t.id
				WHERE t.name IN (${filters.tags.map(() => '?').join(',')})
				GROUP BY ut.user_id
				HAVING COUNT(DISTINCT t.name) >= 1
			)
		`;
		countParams.push(...filters.tags);
	}

	const [countRows] = await pool.query<RowDataPacket[]>(countQuery, countParams);
	const total = countRows[0]?.total || 0;

	// Tri multi-critères
	const orderClause = buildOrderClause(sort.sortBy, sort.order, hasCoordinates);

	// Remplace les variables @lat et @lng si on a des coordonnées
	if (hasCoordinates) {
		query += ` ${orderClause.replace(/@lat/g, '?').replace(/@lng/g, '?')}`;
		// Compte combien de fois on a besoin des coordonnées
		const latCount = (orderClause.match(/@lat/g) || []).length;
		for (let i = 0; i < latCount; i++) {
			params.push(currentUser.latitude, currentUser.longitude);
		}
	} else {
		query += ` ${orderClause}`;
	}

	// Pagination
	query += ` LIMIT ? OFFSET ?`;
	params.push(limit, offset);

	// Exécute la requête
	const [rows] = await pool.query<RowDataPacket[]>(query, params);

	// Transforme les résultats
	const profilesPromises = rows.map(async (row) => {
		// Calcule la distance si on a les coordonnées
		let distance: number | null = null;
		if (currentUser.latitude && currentUser.longitude && row.latitude && row.longitude) {
			distance = calculateDistance(
				currentUser.latitude,
				currentUser.longitude,
				row.latitude,
				row.longitude
			);
		}

		// Filtre par distance si demandé (post-filtrage car calcul Haversine)
		if (filters.maxDistance && distance !== null && distance > filters.maxDistance) {
			return null;
		}

		// Récupère les tags de l'utilisateur
		const [tagRows] = await pool.query<RowDataPacket[]>(
			`SELECT t.name FROM user_tags ut
		 JOIN tags t ON ut.tag_id = t.id
		 WHERE ut.user_id = ?`,
			[row.id]
		);

		return {
			id: row.id,
			username: row.username,
			firstName: row.first_name,
			lastName: row.last_name,
			age: calculateAge(row.birth_date),
			gender: row.gender,
			city: row.city,
			country: row.country,
			latitude: row.latitude,
			longitude: row.longitude,
			fameRating: row.fame_rating || 50,
			profilePhoto: row.profile_photo,
			distance,
			commonTagsCount: row.common_tags_count || 0,
			tags: tagRows.map((t) => t.name),
			isOnline: Boolean(row.is_online),
			lastLogin: row.last_login,
		};
	});

	const profilesWithNulls = await Promise.all(profilesPromises);
	const profiles = profilesWithNulls.filter((p): p is ProfileSuggestion => p !== null);

	return { profiles, total };
};
