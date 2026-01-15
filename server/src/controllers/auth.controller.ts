import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { validatePassword } from '../utils/password-validator';

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
	const { email, username, password, firstName, lastName, language } = req.body;

	if (!email || !username || !password || !firstName || !lastName) {
		res.status(400).json({ code: 'MISSING_REQUIRED_FIELDS' });
		return;
	}

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		res.status(400).json({ code: 'INVALID_EMAIL_FORMAT' });
		return;
	}

	const passwordValidation = validatePassword(password);
	if (!passwordValidation.isValid) {
		res.status(400).json({ code: passwordValidation.error });
		return;
	}

	try {
		if (await authService.emailExists(email)) {
			res.status(409).json({ code: 'EMAIL_ALREADY_EXISTS' });
			return;
		}
		if (await authService.usernameExists(username)) {
			res.status(409).json({ code: 'USERNAME_ALREADY_EXISTS' });
			return;
		}

		const { userId } = await authService.createUser({
			email,
			username,
			password,
			firstName,
			lastName,
			language,
		});

		res.status(201).json({
			message: 'Registration successful',
			userId,
		});
	} catch (error) {
		console.error('Erreur register:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
	const { username, password } = req.body;

	if (!username || !password) {
		res.status(400).json({ code: 'MISSING_REQUIRED_FIELDS' });
		return;
	}

	try {
		const result = await authService.login({ username, password });

		if (!result) {
			res.status(401).json({ code: 'INVALID_CREDENTIALS' });
			return;
		}

		res.cookie('token', result.token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		res.json({
			message: 'Login successful',
			user: result.user,
		});
	} catch (error) {
		console.error('Erreur login:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response): Promise<void> => {
	try {
		if (req.user) {
			await authService.logout(req.user.userId);
		}

		res.clearCookie('token', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
		});

		res.json({ message: 'Logout successful' });
	} catch (error) {
		console.error('Erreur logout:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// GET /api/auth/verify/:token
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
	const { token } = req.params;

	try {
		const verified = await authService.verifyEmail(token);

		if (!verified) {
			res.status(400).json({ code: 'INVALID_OR_EXPIRED_TOKEN' });
			return;
		}

		res.json({ message: 'Email verified successfully' });
	} catch (error) {
		console.error('Erreur verifyEmail:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
	const { email } = req.body;

	if (!email) {
		res.status(400).json({ code: 'MISSING_REQUIRED_FIELDS' });
		return;
	}

	try {
		await authService.forgotPassword(email);

		res.json({ message: 'Password reset email sent if account exists' });
	} catch (error) {
		console.error('Erreur forgotPassword:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
	const { token, password } = req.body;

	if (!token || !password) {
		res.status(400).json({ code: 'MISSING_REQUIRED_FIELDS' });
		return;
	}

	const passwordValidation = validatePassword(password);
	if (!passwordValidation.isValid) {
		res.status(400).json({ code: passwordValidation.error });
		return;
	}

	try {
		const success = await authService.resetPassword(token, password);

		if (!success) {
			res.status(400).json({ code: 'INVALID_OR_EXPIRED_TOKEN' });
			return;
		}

		res.json({ message: 'Password reset successful' });
	} catch (error) {
		console.error('Erreur resetPassword:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// PUT /api/auth/change-password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
	const userId = req.user!.userId;
	const { currentPassword, newPassword } = req.body;

	if (!currentPassword || !newPassword) {
		res.status(400).json({ code: 'MISSING_REQUIRED_FIELDS' });
		return;
	}

	// Validation du nouveau mot de passe
	const passwordValidation = validatePassword(newPassword);
	if (!passwordValidation.isValid) {
		res.status(400).json({ code: passwordValidation.error });
		return;
	}

	try {
		const result = await authService.changePassword(userId, currentPassword, newPassword);

		if (!result.success) {
			res.status(400).json({ code: result.code });
			return;
		}

		res.json({ message: 'PASSWORD_CHANGED' });
	} catch (error) {
		console.error('Erreur changePassword:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};
