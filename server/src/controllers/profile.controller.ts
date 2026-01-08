import { Request, Response } from 'express';
import * as profileService from '../services/profile.service';
import * as authService from '../services/auth.service';

// GET /api/profile/me
export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user!.userId;
		const profile = await profileService.getProfile(userId);

		if (!profile) {
			res.status(404).json({ error: 'PROFILE_NOT_FOUND' });
			return;
		}

		const tags = await profileService.getUserTags(userId);

		res.json({ profile, tags });
	} catch (error) {
		console.error('Erreur getMyProfile:', error);
		res.status(500).json({ error: 'SERVER_ERROR' });
	}
};

// PUT /api/profile/me
export const updateMyProfile = async (req: Request, res: Response): Promise<void> => {
	const userId = req.user!.userId;
	const { gender, sexualPreference, biography, birthDate, latitude, longitude, city, country, tags } = req.body;

	// Validation des champs obligatoires du profil
	if (!gender || !sexualPreference || !biography || !birthDate) {
		res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' });
		return;
	}

	// Validation du genre
	if (!['male', 'female', 'other'].includes(gender)) {
		res.status(400).json({ error: 'INVALID_GENDER' });
		return;
	}

	// Validation de la préférence sexuelle
	if (!['male', 'female', 'both'].includes(sexualPreference)) {
		res.status(400).json({ error: 'INVALID_SEXUAL_PREFERENCE' });
		return;
	}

	// Validation de la date de naissance (doit être majeur)
	const birthDateObj = new Date(birthDate);
	const today = new Date();
	const age = today.getFullYear() - birthDateObj.getFullYear();
	if (age < 18) {
		res.status(400).json({ error: 'MUST_BE_ADULT' });
		return;
	}

	try {
		await profileService.upsertProfile(userId, {
			gender,
			sexualPreference,
			biography,
			birthDate,
			latitude,
			longitude,
			city,
			country,
		});

		// Met à jour les tags si fournis
		if (tags && Array.isArray(tags)) {
			await profileService.updateUserTags(userId, tags);
		}

		res.json({ message: 'PROFILE_UPDATED' });
	} catch (error) {
		console.error('Erreur updateMyProfile:', error);
		res.status(500).json({ error: 'SERVER_ERROR' });
	}
};

// PUT /api/profile/user
export const updateUserInfo = async (req: Request, res: Response): Promise<void> => {
	const userId = req.user!.userId;
	const { firstName, lastName, email } = req.body;

	// Validation format email si fourni
	if (email) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			res.status(400).json({ error: 'INVALID_EMAIL_FORMAT' });
			return;
		}

		// Vérifie que l'email n'est pas déjà pris
		if (await authService.emailExists(email)) {
			res.status(409).json({ error: 'EMAIL_ALREADY_EXISTS' });
			return;
		}
	}

	try {
		await profileService.updateUser(userId, { firstName, lastName, email });
		res.json({ message: 'USER_UPDATED' });
	} catch (error) {
		console.error('Erreur updateUserInfo:', error);
		res.status(500).json({ error: 'SERVER_ERROR' });
	}
};

// GET /api/profile/visitors
export const getVisitors = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user!.userId;
		const visitors = await profileService.getProfileVisitors(userId);
		res.json({ visitors });
	} catch (error) {
		console.error('Erreur getVisitors:', error);
		res.status(500).json({ error: 'SERVER_ERROR' });
	}
};

// GET /api/profile/likers
export const getLikers = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user!.userId;
		const likers = await profileService.getProfileLikers(userId);
		res.json({ likers });
	} catch (error) {
		console.error('Erreur getLikers:', error);
		res.status(500).json({ error: 'SERVER_ERROR' });
	}
};

