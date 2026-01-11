import { createContext, useState, useEffect, type ReactNode } from 'react';
import { apiRequest } from '../api/client';
import * as authApi from '../api/auth';

interface User {
	id: number;
	email: string;
	username: string;
	firstName: string;
	lastName: string;
	isVerified: boolean;
	isProfileComplete: boolean;
}

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
	register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
	logout: () => Promise<void>;
}

interface RegisterData {
	email: string;
	username: string;
	password: string;
	firstName: string;
	lastName: string;
	language: 'fr' | 'en';
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Au démarrage, vérifie si l'utilisateur est connecté via le cookie
	useEffect(() => {
		async function checkAuth() {
			const response = await apiRequest<User>('/profile/me');

			if (response.success && response.data) {
				setUser(response.data);
			}

			setIsLoading(false);
		}

		checkAuth();
	}, []);

	async function login(username: string, password: string) {
		const response = await authApi.login({ username, password });

		if (response.success && response.data) {
			setUser(response.data.user);
			return { success: true };
		}

		return {
			success: false,
			error: response.error?.code || 'SERVER_ERROR',
		};
	}

	async function register(data: RegisterData) {
		const response = await authApi.register(data);

		if (response.success) {
			return { success: true };
		}

		return {
			success: false,
			error: response.error?.code || 'SERVER_ERROR',
		};
	}

	async function logout() {
		await authApi.logout();
		setUser(null);
	}

	return (
		<AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
			{children}
		</AuthContext.Provider>
	);
}
