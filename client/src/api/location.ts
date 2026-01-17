import { apiRequest } from './client';

export interface LocationData {
	latitude: number;
	longitude: number;
	city?: string;
	country?: string;
	source?: 'gps' | 'ip' | 'manual';
	language?: 'fr' | 'en';
}

export interface LocationResponse {
	latitude: number;
	longitude: number;
	city: string;
	country: string;
	source: 'gps' | 'ip' | 'manual';
}

// Sauvegarder la position avec la source
export async function updateLocation(data: LocationData) {
	return apiRequest<{ message: string; location: LocationResponse }>('/profile/location', {
		method: 'PUT',
		body: JSON.stringify(data),
	});
}

// Fallback : estimer la position via IP
export async function getLocationFromIp(language: 'fr' | 'en' = 'en') {
	return apiRequest<{ location: LocationData; isDefault: boolean }>(
		`/profile/location-from-ip?language=${language}`
	);
}

// Récupérer la source actuelle de localisation
export async function getLocationSource() {
	return apiRequest<{ source: 'gps' | 'ip' | 'manual' | null }>('/profile/location-source');
}
