// Étend les types d'Express pour inclure l'utilisateur authentifié dans la requête
declare namespace Express {
	interface Request {
		user?: {
			userId: number;
			username: string;
		};
	}
}
