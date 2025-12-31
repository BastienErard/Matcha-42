import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

// Middleware qui protège les routes nécessitant une connexion
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
	// Récupère le header Authorization (format: "Bearer eyJ...")
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		res.status(401).json({ error: 'Token manquant' });
		return;
	}

	// Extrait le token en retirant "Bearer "
	const token = authHeader.split(' ')[1];

	// Vérifie et décode le token
	const payload = verifyToken(token);

	if (!payload) {
		res.status(401).json({ error: 'Token invalide ou expiré' });
		return;
	}

	// Attache les données utilisateur à la requête pour les controllers
	req.user = payload;

	// Passe au controller suivant
	next();
};
