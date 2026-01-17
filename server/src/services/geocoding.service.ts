const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'Matcha/1.0 (matcha@42.fr)';

interface ForwardGeocodingResult {
	latitude: number;
	longitude: number;
	city: string;
	country: string;
}

interface ReverseGeocodingResult {
	city: string;
	country: string;
}

interface NominatimSearchResponse {
	lat: string;
	lon: string;
	type: string;
	address?: {
		city?: string;
		town?: string;
		village?: string;
		municipality?: string;
		country?: string;
	};
}

interface NominatimReverseResponse {
	error?: string;
	address?: {
		city?: string;
		town?: string;
		village?: string;
		municipality?: string;
		country?: string;
	};
}

// Types de lieux acceptés (exclut suburb, neighbourhood, etc.)
const VALID_PLACE_TYPES = ['city', 'town', 'village', 'municipality', 'administrative'];

// Normalise une chaîne pour comparaison (minuscules, sans accents)
const normalizeString = (str: string): string => {
	return str
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, ''); // Supprime les accents
};

// Vérifie si deux noms de villes correspondent (tolérant aux accents et casse)
const citiesMatch = (input: string, result: string): boolean => {
	return normalizeString(input) === normalizeString(result);
};

// Convertit ville+pays en coordonnées (forward geocoding)
export const forwardGeocode = async (
	city: string,
	country: string,
	language: string = 'en'
): Promise<ForwardGeocodingResult | null> => {
	try {
		const params = new URLSearchParams({
			city,
			country,
			format: 'json',
			addressdetails: '1',
			limit: '5', // On prend plusieurs résultats pour trouver le bon
			'accept-language': language,
		});

		const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
			headers: { 'User-Agent': USER_AGENT },
		});

		const data = (await response.json()) as NominatimSearchResponse[];

		if (!data || data.length === 0) {
			return null;
		}

		// Cherche un résultat valide parmi les réponses
		for (const result of data) {
			const address = result.address || {};
			const resultCity =
				address.city || address.town || address.village || address.municipality;

			// Vérifie que c'est bien une ville/town/village et que le nom correspond
			if (resultCity && citiesMatch(city, resultCity)) {
				return {
					latitude: parseFloat(result.lat),
					longitude: parseFloat(result.lon),
					city: resultCity,
					country: address.country || country,
				};
			}
		}

		// Aucun résultat valide trouvé
		return null;
	} catch (error) {
		console.error('Erreur forwardGeocode:', error);
		return null;
	}
};

// Convertit coordonnées en ville+pays (reverse geocoding)
export const reverseGeocode = async (
	lat: number,
	lng: number,
	language: string = 'en'
): Promise<ReverseGeocodingResult | null> => {
	try {
		const params = new URLSearchParams({
			lat: lat.toString(),
			lon: lng.toString(),
			format: 'json',
			addressdetails: '1',
			'accept-language': language,
		});

		const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
			headers: { 'User-Agent': USER_AGENT },
		});

		const data = (await response.json()) as NominatimReverseResponse;

		if (!data || data.error) {
			return null;
		}

		const address = data.address || {};

		return {
			city: address.city || address.town || address.village || address.municipality || '',
			country: address.country || '',
		};
	} catch (error) {
		console.error('Erreur reverseGeocode:', error);
		return null;
	}
};
