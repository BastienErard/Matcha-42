import pool from '../config/database';

export type LocationSource = 'gps' | 'ip' | 'manual';

interface LocationData {
	latitude: number;
	longitude: number;
	city?: string;
	country?: string;
	source: LocationSource;
}

interface IpLocationResponse {
	status: string;
	lat?: number;
	lon?: number;
	city?: string;
	country?: string;
}

// Met à jour la localisation d'un utilisateur
export const updateLocation = async (userId: number, data: LocationData): Promise<void> => {
	await pool.query(
		`UPDATE profiles
		 SET latitude = ?, longitude = ?, city = ?, country = ?, location_source = ?, location_updated_at = NOW()
		 WHERE user_id = ?`,
		[
			data.latitude,
			data.longitude,
			data.city || null,
			data.country || null,
			data.source,
			userId,
		]
	);
};

// Récupère la source de localisation actuelle d'un utilisateur
export const getLocationSource = async (userId: number): Promise<LocationSource | null> => {
	const [rows] = await pool.query<any[]>(
		'SELECT location_source FROM profiles WHERE user_id = ?',
		[userId]
	);

	if (rows.length === 0) {
		return null;
	}

	return rows[0].location_source;
};

// Récupère la localisation à partir de l'IP via ip-api.com
export const getLocationFromIp = async (
	ip: string
): Promise<Omit<LocationData, 'source'> | null> => {
	try {
		const response = await fetch(
			`http://ip-api.com/json/${ip}?fields=status,lat,lon,city,country`
		);
		const data = (await response.json()) as IpLocationResponse;

		if (data.status !== 'success' || !data.lat || !data.lon) {
			return null;
		}

		return {
			latitude: data.lat,
			longitude: data.lon,
			city: data.city,
			country: data.country,
		};
	} catch (error) {
		console.error('Erreur getLocationFromIp:', error);
		return null;
	}
};

// Calcule la distance en km entre deux points (formule Haversine)
export const calculateDistance = (
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number
): number => {
	const R = 6371; // Rayon de la Terre en km
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return Math.round(R * c);
};

const toRad = (deg: number): number => {
	return deg * (Math.PI / 180);
};
