import { Request, Response } from 'express';
import * as locationService from '../services/location.service';
import * as geocodingService from '../services/geocoding.service';
import { LocationSource } from '../services/location.service';
import { sanitizeInput } from '../utils/sanitize';

// Position par défaut pour le développement local (Lausanne)
const getDefaultLocation = (language: string) => ({
	latitude: 46.5197,
	longitude: 6.6323,
	city: 'Lausanne',
	country: language === 'fr' ? 'Suisse' : 'Switzerland',
});

const VALID_SOURCES: LocationSource[] = ['gps', 'ip', 'manual'];

// PUT /api/profile/location
export const updateLocation = async (req: Request, res: Response): Promise<void> => {
	const userId = req.user!.userId;
	const { latitude, longitude, city, country, source, language } = req.body;

	// Validation de la source
	if (!source || !VALID_SOURCES.includes(source)) {
		res.status(400).json({ code: 'INVALID_LOCATION_SOURCE' });
		return;
	}

	// Sanitization des inputs texte
	const cleanCity = city ? sanitizeInput(city) : undefined;
	const cleanCountry = country ? sanitizeInput(country) : undefined;
	const lang = language || 'en';

	try {
		let finalLatitude: number;
		let finalLongitude: number;
		let finalCity: string | undefined;
		let finalCountry: string | undefined;

		if (source === 'manual') {
			// Position manuelle : on a besoin de ville et pays
			if (!cleanCity || !cleanCountry) {
				res.status(400).json({ code: 'CITY_AND_COUNTRY_REQUIRED' });
				return;
			}

			// Forward geocoding : convertit ville+pays en coordonnées
			const geocoded = await geocodingService.forwardGeocode(cleanCity, cleanCountry, lang);

			if (!geocoded) {
				res.status(400).json({ code: 'LOCATION_NOT_FOUND' });
				return;
			}

			finalLatitude = geocoded.latitude;
			finalLongitude = geocoded.longitude;
			finalCity = geocoded.city;
			finalCountry = geocoded.country;
		} else {
			// GPS ou IP : on a besoin de coordonnées
			if (typeof latitude !== 'number' || typeof longitude !== 'number') {
				res.status(400).json({ code: 'INVALID_COORDINATES' });
				return;
			}

			// Validation des plages de coordonnées
			if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
				res.status(400).json({ code: 'COORDINATES_OUT_OF_RANGE' });
				return;
			}

			finalLatitude = latitude;
			finalLongitude = longitude;

			// Reverse geocoding : convertit coordonnées en ville+pays
			const geocoded = await geocodingService.reverseGeocode(latitude, longitude, lang);

			if (geocoded) {
				finalCity = geocoded.city;
				finalCountry = geocoded.country;
			} else {
				// Si le reverse geocoding échoue, on garde les valeurs fournies ou null
				finalCity = cleanCity;
				finalCountry = cleanCountry;
			}
		}

		// Sauvegarde en base de données
		await locationService.updateLocation(userId, {
			latitude: finalLatitude,
			longitude: finalLongitude,
			city: finalCity,
			country: finalCountry,
			source,
		});

		// Retourne les données enrichies/corrigées
		res.json({
			message: 'LOCATION_UPDATED',
			location: {
				latitude: finalLatitude,
				longitude: finalLongitude,
				city: finalCity,
				country: finalCountry,
				source,
			},
		});
	} catch (error) {
		console.error('Erreur updateLocation:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// GET /api/profile/location-from-ip
export const getLocationFromIp = async (req: Request, res: Response): Promise<void> => {
	const { language } = req.query;
	const lang = typeof language === 'string' ? language : 'en';

	try {
		// Récupère l'IP du client (gère les proxies)
		const forwardedFor = req.headers['x-forwarded-for'];
		let ip: string;

		if (typeof forwardedFor === 'string') {
			ip = forwardedFor.split(',')[0].trim();
		} else {
			ip = req.ip || req.socket.remoteAddress || '';
		}

		// En développement local, retourne la position par défaut
		if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
			res.json({ location: getDefaultLocation(lang), isDefault: true });
			return;
		}

		const location = await locationService.getLocationFromIp(ip);

		if (!location) {
			// Fallback sur la position par défaut si l'IP n'est pas trouvée
			res.json({ location: getDefaultLocation(lang), isDefault: true });
			return;
		}

		// Enrichir avec reverse geocoding pour avoir les noms localisés
		const geocoded = await geocodingService.reverseGeocode(
			location.latitude,
			location.longitude,
			lang
		);

		if (geocoded) {
			location.city = geocoded.city;
			location.country = geocoded.country;
		}

		res.json({ location, isDefault: false });
	} catch (error) {
		console.error('Erreur getLocationFromIp:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// GET /api/profile/location-source
export const getLocationSource = async (req: Request, res: Response): Promise<void> => {
	const userId = req.user!.userId;

	try {
		const source = await locationService.getLocationSource(userId);
		res.json({ source });
	} catch (error) {
		console.error('Erreur getLocationSource:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};
