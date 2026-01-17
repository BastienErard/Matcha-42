import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../api';
import { getMyProfile, updateLocation, getLocationFromIp, getLocationSource } from '../api';

interface User {
	id: number;
	email: string;
	username: string;
	firstName: string;
	lastName: string;
}

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	hasCompletedOnboarding: boolean;
	hasProfilePicture: boolean;
	login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
	register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
	logout: () => Promise<void>;
	refreshProfile: () => Promise<void>;
}

interface RegisterData {
	email: string;
	username: string;
	firstName: string;
	lastName: string;
	password: string;
	language: 'fr' | 'en';
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
	const [hasProfilePicture, setHasProfilePicture] = useState(false);

	// Met à jour la géolocalisation en arrière-plan
	const updateGeolocation = useCallback(async () => {
		try {
			// Vérifie d'abord la source actuelle
			const sourceResult = await getLocationSource();

			// Si position manuelle, ne pas écraser
			if (sourceResult.success && sourceResult.data?.source === 'manual') {
				console.log('Position manuelle définie, géolocalisation auto ignorée');
				return;
			}

			// Récupère la langue actuelle
			const currentLanguage = (localStorage.getItem('language') as 'fr' | 'en') || 'fr';

			// Tente d'obtenir la position GPS
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					async (position) => {
						// GPS accepté → envoie les coordonnées avec source 'gps'
						await updateLocation({
							latitude: position.coords.latitude,
							longitude: position.coords.longitude,
							source: 'gps',
							language: currentLanguage,
						});
						console.log('Position GPS enregistrée');
					},
					async () => {
						// GPS refusé → fallback IP
						const result = await getLocationFromIp(currentLanguage);
						if (result.success && result.data) {
							await updateLocation({
								...result.data.location,
								source: 'ip',
								language: currentLanguage,
							});
							console.log('Position IP enregistrée (GPS refusé)');
						}
					},
					{
						enableHighAccuracy: true,
						timeout: 10000,
						maximumAge: 300000,
					}
				);
			} else {
				// Géolocalisation non supportée → fallback IP
				const result = await getLocationFromIp(currentLanguage);
				if (result.success && result.data) {
					await updateLocation({
						...result.data.location,
						source: 'ip',
						language: currentLanguage,
					});
					console.log('Position IP enregistrée (GPS non supporté)');
				}
			}
		} catch (error) {
			console.error('Erreur géolocalisation:', error);
		}
	}, []);

	// Récupère le profil utilisateur
	const refreshProfile = useCallback(async () => {
		const result = await getMyProfile();

		if (result.success && result.data) {
			const { profile, hasCompletedOnboarding, hasProfilePicture } = result.data;

			setUser({
				id: profile.id,
				email: profile.email,
				username: profile.username,
				firstName: profile.first_name,
				lastName: profile.last_name,
			});
			setHasCompletedOnboarding(hasCompletedOnboarding);
			setHasProfilePicture(hasProfilePicture);
		} else {
			setUser(null);
			setHasCompletedOnboarding(false);
			setHasProfilePicture(false);
		}
	}, []);

	// Vérifie si l'utilisateur est connecté au chargement
	useEffect(() => {
		async function checkAuth() {
			await refreshProfile();
			setIsLoading(false);
		}
		checkAuth();
	}, [refreshProfile]);

	const login = async (username: string, password: string) => {
		const result = await apiLogin({ username, password });

		if (result.success) {
			await refreshProfile();
			// Met à jour la géolocalisation en arrière-plan après connexion
			updateGeolocation();
			return { success: true };
		}

		return { success: false, error: result.error?.code };
	};

	const register = async (data: RegisterData) => {
		const result = await apiRegister(data);

		if (result.success) {
			return { success: true };
		}

		return { success: false, error: result.error?.code };
	};

	const logout = async () => {
		await apiLogout();
		setUser(null);
		setHasCompletedOnboarding(false);
		setHasProfilePicture(false);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				isLoading,
				hasCompletedOnboarding,
				hasProfilePicture,
				login,
				register,
				logout,
				refreshProfile,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
