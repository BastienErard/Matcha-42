import { apiRequest } from './client';

// Types pour les requêtes
interface RegisterRequest {
	email: string;
	username: string;
	password: string;
	firstName: string;
	lastName: string;
	language: 'fr' | 'en';
}

interface LoginRequest {
	username: string;
	password: string;
}

// Types pour les réponses
interface User {
	id: number;
	email: string;
	username: string;
	firstName: string;
	lastName: string;
	isVerified: boolean;
	isProfileComplete: boolean;
}

interface AuthResponse {
	message: string;
	user: User;
}

// Inscription
export async function register(data: RegisterRequest) {
	return apiRequest<AuthResponse>('/auth/register', {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

// Connexion
export async function login(data: LoginRequest) {
	return apiRequest<AuthResponse>('/auth/login', {
		method: 'POST',
		body: JSON.stringify(data),
	});
}

// Déconnexion
export async function logout() {
	return apiRequest('/auth/logout', {
		method: 'POST',
	});
}

// Vérification email
export async function verifyEmail(token: string) {
	return apiRequest(`/auth/verify/${token}`);
}

// Demande de reset mot de passe
export async function forgotPassword(email: string) {
	return apiRequest('/auth/forgot-password', {
		method: 'POST',
		body: JSON.stringify({ email }),
	});
}

// Reset mot de passe
export async function resetPassword(token: string, password: string) {
	return apiRequest('/auth/reset-password', {
		method: 'POST',
		body: JSON.stringify({ token, password }),
	});
}

// Changer le mot de passe
export async function changePassword(currentPassword: string, newPassword: string) {
	return apiRequest<{ message: string }>('/auth/change-password', {
		method: 'PUT',
		body: JSON.stringify({ currentPassword, newPassword }),
	});
}
