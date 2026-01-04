import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { validatePassword } from '../utils/password-validator';

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
	const { email, username, password, firstName, lastName, language } = req.body;

	// Validation basique des champs requis
	if (!email || !username || !password || !firstName || !lastName) {
		res.status(400).json({ error: 'Tous les champs sont requis' });
		return;
	}

	// Validation format email
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		res.status(400).json({ error: 'Format email invalide' });
		return;
	}

	// Validation mot de passe
	const passwordValidation = validatePassword(password);
	if (!passwordValidation.isValid) {
		res.status(400).json({ error: passwordValidation.error });
		return;
	}

	try {
		// Vérifie si email/username déjà pris
		if (await authService.emailExists(email)) {
			res.status(409).json({ error: 'Cet email est déjà utilisé' });
			return;
		}
		if (await authService.usernameExists(username)) {
			res.status(409).json({ error: "Ce nom d'utilisateur est déjà pris" });
			return;
		}

		// Crée l'utilisateur et envoie l'email de vérification
		const { userId } = await authService.createUser({
			email,
			username,
			password,
			firstName,
			lastName,
			language,
		});

		res.status(201).json({
			message: 'Inscription réussie. Vérifiez votre email pour activer votre compte.',
			userId,
		});
	} catch (error) {
		console.error('Erreur register:', error);
		res.status(500).json({ error: 'Erreur serveur' });
	}
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
	const { username, password } = req.body;

	if (!username || !password) {
		res.status(400).json({ error: 'Username et mot de passe requis' });
		return;
	}

	try {
		const result = await authService.login({ username, password });

		if (!result) {
			res.status(401).json({ error: 'Identifiants incorrects ou compte non vérifié' });
			return;
		}

		res.json({
			message: 'Connexion réussie',
			token: result.token,
			user: result.user,
		});
	} catch (error) {
		console.error('Erreur login:', error);
		res.status(500).json({ error: 'Erreur serveur' });
	}
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response): Promise<void> => {
	try {
		if (req.user) {
			await authService.logout(req.user.userId);
		}
		res.json({ message: 'Déconnexion réussie' });
	} catch (error) {
		console.error('Erreur logout:', error);
		res.status(500).json({ error: 'Erreur serveur' });
	}
};

// GET /api/auth/verify/:token
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
	const { token } = req.params;

	try {
		const verified = await authService.verifyEmail(token);

		if (!verified) {
			res.status(400).json({ error: 'Token invalide ou expiré' });
			return;
		}

		res.json({ message: 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.' });
	} catch (error) {
		console.error('Erreur verifyEmail:', error);
		res.status(500).json({ error: 'Erreur serveur' });
	}
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
	const { email } = req.body;

	if (!email) {
		res.status(400).json({ error: 'Email requis' });
		return;
	}

	try {
		await authService.forgotPassword(email);

		// On renvoie toujours un succès pour ne pas révéler si l'email existe
		res.json({
			message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
		});
	} catch (error) {
		console.error('Erreur forgotPassword:', error);
		res.status(500).json({ error: 'Erreur serveur' });
	}
};

// POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
	const { token, password } = req.body;

	if (!token || !password) {
		res.status(400).json({ error: 'Token et nouveau mot de passe requis' });
		return;
	}

	// Validation mot de passe
	const passwordValidation = validatePassword(password);
	if (!passwordValidation.isValid) {
		res.status(400).json({ error: passwordValidation.error });
		return;
	}

	try {
		const success = await authService.resetPassword(token, password);

		if (!success) {
			res.status(400).json({ error: 'Token invalide ou expiré' });
			return;
		}

		res.json({ message: 'Mot de passe réinitialisé avec succès' });
	} catch (error) {
		console.error('Erreur resetPassword:', error);
		res.status(500).json({ error: 'Erreur serveur' });
	}
};
