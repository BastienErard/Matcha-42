import { apiRequest } from './client';

export interface UserPhoto {
	id: number;
	filename: string;
	isProfilePicture: boolean;
	uploadOrder: number;
}

export interface UserProfile {
	id: number;
	username: string;
	firstName: string;
	lastName: string;
	age: number | null;
	gender: 'male' | 'female' | null;
	sexualPreference: 'male' | 'female' | 'both' | null;
	biography: string | null;
	city: string | null;
	country: string | null;
	latitude: number | null;
	longitude: number | null;
	fameRating: number;
	isOnline: boolean;
	lastLogin: string | null;
	photos: UserPhoto[];
	tags: string[];
}

export interface UserInteraction {
	hasLiked: boolean;
	hasLikedMe: boolean;
	isConnected: boolean;
	hasBlocked: boolean;
}

export interface UserProfileResponse {
	profile: UserProfile;
	interaction: UserInteraction;
}

// Récupérer le profil complet d'un utilisateur
export async function getUserProfile(userId: number) {
	return apiRequest<UserProfileResponse>(`/users/${userId}`);
}

// Liker un utilisateur
export async function likeUser(userId: number) {
	return apiRequest<{ message: string; isMatch: boolean }>(`/users/${userId}/like`, {
		method: 'POST',
	});
}

// Retirer son like
export async function unlikeUser(userId: number) {
	return apiRequest<{ message: string }>(`/users/${userId}/like`, {
		method: 'DELETE',
	});
}

// Bloquer un utilisateur
export async function blockUser(userId: number) {
	return apiRequest<{ message: string }>(`/users/${userId}/block`, {
		method: 'POST',
	});
}

// Débloquer un utilisateur
export async function unblockUser(userId: number) {
	return apiRequest<{ message: string }>(`/users/${userId}/block`, {
		method: 'DELETE',
	});
}

// Signaler un utilisateur
export async function reportUser(userId: number) {
	return apiRequest<{ message: string }>(`/users/${userId}/report`, {
		method: 'POST',
	});
}
