import { apiRequest } from './client';

export interface Profile {
	id: number;
	email: string;
	username: string;
	first_name: string;
	last_name: string;
	gender: 'male' | 'female' | null;
	sexual_preference: 'male' | 'female' | 'both' | null;
	biography: string | null;
	birth_date: string | null;
	latitude: number | null;
	longitude: number | null;
	city: string | null;
	country: string | null;
	fame_rating: number;
	is_online: boolean;
	last_login: string | null;
}

export interface Tag {
	id: number;
	name: string;
}

export interface ProfileWithTags {
	profile: Profile;
	tags: string[];
	hasCompletedOnboarding: boolean;
	hasProfilePicture: boolean;
}

export interface UpdateProfileData {
	gender?: 'male' | 'female';
	sexualPreference?: 'male' | 'female' | 'both';
	biography?: string;
	birthDate?: string;
	city?: string;
	country?: string;
	tags?: string[];
}

// Récupérer son profil
export async function getMyProfile() {
	return apiRequest<ProfileWithTags>('/profile/me');
}

// Mettre à jour son profil
export async function updateProfile(data: UpdateProfileData) {
	return apiRequest<{ message: string }>('/profile/me', {
		method: 'PUT',
		body: JSON.stringify(data),
	});
}

// Récupérer tous les tags disponibles
export async function getTags() {
	return apiRequest<{ tags: Tag[] }>('/tags');
}

// Marquer l'onboarding comme terminé
export async function completeOnboarding() {
	return apiRequest<{ message: string }>('/profile/complete-onboarding', {
		method: 'POST',
	});
}
