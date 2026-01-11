// Étend les types d'Express pour inclure l'utilisateur authentifié et les cookies
declare namespace Express {
	interface Request {
		user?: {
			userId: number;
			username: string;
		};
		cookies: {
			token?: string;
		};
	}
}
