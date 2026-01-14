const API_URL = 'http://localhost:3000/api';

interface ApiError {
	code: string;
}

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: ApiError;
}

export async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<ApiResponse<T>> {
	try {
		const response = await fetch(`${API_URL}${endpoint}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...options.headers,
			},
			credentials: 'include',
		});

		const data = await response.json();

		if (!response.ok) {
			// Si 401 sans code d'erreur spécifique, c'est une session expirée
			if (response.status === 401 && !data.code) {
				// Ne redirige que si on n'est pas sur une page auth
				if (
					!window.location.pathname.startsWith('/login') &&
					!window.location.pathname.startsWith('/register') &&
					!window.location.pathname.startsWith('/forgot-password') &&
					!window.location.pathname.startsWith('/reset-password')
				) {
					window.location.href = '/login';
				}
				return {
					success: false,
					error: { code: 'SESSION_EXPIRED' },
				};
			}

			// Sinon, on utilise le code d'erreur du backend
			return {
				success: false,
				error: {
					code: data.code || data.error || 'SERVER_ERROR',
				},
			};
		}

		return {
			success: true,
			data,
		};
	} catch (error) {
		return {
			success: false,
			error: {
				code: 'NETWORK_ERROR',
			},
		};
	}
}
