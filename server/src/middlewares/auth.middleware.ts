import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

// Middleware qui protège les routes nécessitant une connexion
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
	// Récupère le token depuis le cookie
	const token = req.cookies?.token;

	if (!token) {
		res.status(401).json({ error: 'Non authentifié' });
		return;
	}

	// Vérifie et décode le token
	const payload = verifyToken(token);

	if (!payload) {
		// Supprime le cookie invalide
		res.clearCookie('token', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
		});
		res.status(401).json({ error: 'Token invalide ou expiré' });
		return;
	}

	// Attache les données utilisateur à la requête pour les controllers
	req.user = payload;

	// Passe au controller suivant
	next();
};
