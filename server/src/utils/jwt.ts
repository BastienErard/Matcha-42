import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const JWT_EXPIRES_IN = '7d'; // Token valide 7 jours

// Payload stocké dans le token (données accessibles après décodage)
interface TokenPayload {
	userId: number;
	username: string;
}

// Génère un token JWT à partir des infos utilisateur
export const generateToken = (payload: TokenPayload): string => {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Vérifie et décode un token, retourne le payload ou null si invalide
export const verifyToken = (token: string): TokenPayload | null => {
	try {
		return jwt.verify(token, JWT_SECRET) as TokenPayload;
	} catch {
		// Token expiré, malformé ou signature invalide
		return null;
	}
};
