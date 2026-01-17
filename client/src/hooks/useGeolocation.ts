import { useState, useCallback } from 'react';
import { updateLocation, getLocationFromIp, type LocationData } from '../api';

interface UseGeolocationReturn {
	location: LocationData | null;
	isLoading: boolean;
	error: string | null;
	requestLocation: () => Promise<LocationData | null>;
	updateManualLocation: (data: LocationData) => Promise<boolean>;
}

export function useGeolocation(): UseGeolocationReturn {
	const [location, setLocation] = useState<LocationData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Demande la position GPS ou utilise le fallback IP
	const requestLocation = useCallback(async (): Promise<LocationData | null> => {
		setIsLoading(true);
		setError(null);

		const currentLanguage = (localStorage.getItem('language') as 'fr' | 'en') || 'fr';

		try {
			// Vérifie si la géolocalisation est supportée
			if (!navigator.geolocation) {
				console.log('Geolocation not supported, using IP fallback');
				return await fallbackToIp(currentLanguage);
			}

			// Demande la permission GPS
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 300000,
				});
			});

			// Envoie au backend avec source et language
			const result = await updateLocation({
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
				source: 'gps',
				language: currentLanguage,
			});

			if (result.success && result.data) {
				setLocation(result.data.location);
				setIsLoading(false);
				return result.data.location;
			} else {
				return await fallbackToIp(currentLanguage);
			}
		} catch (geoError) {
			console.log('GPS denied or error, using IP fallback:', geoError);
			return await fallbackToIp(currentLanguage);
		}
	}, []);

	// Fallback via IP
	const fallbackToIp = async (currentLanguage: 'fr' | 'en'): Promise<LocationData | null> => {
		try {
			const result = await getLocationFromIp(currentLanguage);

			if (result.success && result.data) {
				const locationData = result.data.location;

				// Sauvegarde cette position avec source et language
				const saveResult = await updateLocation({
					...locationData,
					source: 'ip',
					language: currentLanguage,
				});

				if (saveResult.success && saveResult.data) {
					setLocation(saveResult.data.location);
				} else {
					setLocation(locationData);
				}

				setIsLoading(false);
				return locationData;
			} else {
				setError('LOCATION_ERROR');
				setIsLoading(false);
				return null;
			}
		} catch {
			setError('LOCATION_ERROR');
			setIsLoading(false);
			return null;
		}
	};

	// Mise à jour manuelle de la localisation
	const updateManualLocation = useCallback(async (data: LocationData): Promise<boolean> => {
		setIsLoading(true);
		setError(null);

		const result = await updateLocation(data);

		if (result.success && result.data) {
			setLocation(result.data.location);
			setIsLoading(false);
			return true;
		} else {
			setError(result.error?.code || 'LOCATION_ERROR');
			setIsLoading(false);
			return false;
		}
	}, []);

	return {
		location,
		isLoading,
		error,
		requestLocation,
		updateManualLocation,
	};
}
