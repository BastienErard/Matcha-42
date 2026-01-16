import { Request, Response } from 'express';
import * as locationService from '../services/location.service';
import { sanitizeInput } from '../utils/sanitize';

// Position par défaut pour le développement local (Lausanne)
const DEFAULT_LOCATION = {
	latitude: 46.5197,
	longitude: 6.6323,
	city: 'Lausanne',
	country: 'Suisse',
};

// PUT /api/profile/location
export const updateLocation = async (req: Request, res: Response): Promise<void> => {
	const userId = req.user!.userId;
	const { latitude, longitude, city, country } = req.body;

	// Validation des coordonnées
	if (typeof latitude !== 'number' || typeof longitude !== 'number') {
		res.status(400).json({ code: 'INVALID_COORDINATES' });
		return;
	}

	// Validation des plages de coordonnées
	if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
		res.status(400).json({ code: 'COORDINATES_OUT_OF_RANGE' });
		return;
	}

	// Sanitization des inputs texte
	const cleanCity = city ? sanitizeInput(city) : undefined;
	const cleanCountry = country ? sanitizeInput(country) : undefined;

	try {
		await locationService.updateLocation(userId, {
			latitude,
			longitude,
			city: cleanCity,
			country: cleanCountry,
		});

		res.json({ message: 'LOCATION_UPDATED' });
	} catch (error) {
		console.error('Erreur updateLocation:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// GET /api/profile/location-from-ip
export const getLocationFromIp = async (req: Request, res: Response): Promise<void> => {
	try {
		// Récupère l'IP du client (gère les proxies)
		const forwardedFor = req.headers['x-forwarded-for'];
		let ip: string;

		if (typeof forwardedFor === 'string') {
			ip = forwardedFor.split(',')[0].trim();
		} else {
			ip = req.ip || req.socket.remoteAddress || '';
		}

		// Impossible en localhost d'avoir une position => utilisation d'un placeholder
		if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
			res.json({ location: DEFAULT_LOCATION, isDefault: true });
			return;
		}

		const location = await locationService.getLocationFromIp(ip);

		if (!location) {
			res.json({ location: DEFAULT_LOCATION, isDefault: true });
			return;
		}

		res.json({ location, isDefault: false });
	} catch (error) {
		console.error('Erreur getLocationFromIp:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};
