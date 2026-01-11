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

		// Session expirée ou invalide → redirection login
		if (response.status === 401) {
			// Ne redirige que si on n'est pas déjà sur une page auth
			if (
				!window.location.pathname.startsWith('/login') &&
				!window.location.pathname.startsWith('/register')
			) {
				window.location.href = '/login';
			}
			return {
				success: false,
				error: { code: 'SESSION_EXPIRED' },
			};
		}

		const data = await response.json();

		if (!response.ok) {
			return {
				success: false,
				error: {
					code: data.code || 'SERVER_ERROR',
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
