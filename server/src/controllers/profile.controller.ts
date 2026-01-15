import { Request, Response } from 'express';
import * as profileService from '../services/profile.service';
import * as authService from '../services/auth.service';

// GET /api/profile/me
export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user!.userId;
		const profile = await profileService.getProfile(userId);

		if (!profile) {
			res.status(404).json({ code: 'PROFILE_NOT_FOUND' });
			return;
		}

		const tags = await profileService.getUserTags(userId);
		const hasProfilePicture = await profileService.hasProfilePicture(userId);
		const hasCompletedOnboarding = await profileService.getOnboardingStatus(userId);

		res.json({ profile, tags, hasProfilePicture, hasCompletedOnboarding });
	} catch (error) {
		console.error('Erreur getMyProfile:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// POST /api/profile/complete-onboarding
export const completeOnboarding = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user!.userId;

		// Vérifie que le profil est complet
		const profile = await profileService.getProfile(userId);
		if (!profile) {
			res.status(404).json({ code: 'PROFILE_NOT_FOUND' });
			return;
		}

		const tags = await profileService.getUserTags(userId);
		const hasProfilePicture = await profileService.hasProfilePicture(userId);

		// Validation : tous les éléments requis
		if (
			!profile.gender ||
			!profile.sexual_preference ||
			!profile.biography ||
			!profile.birth_date
		) {
			res.status(400).json({ code: 'PROFILE_INCOMPLETE' });
			return;
		}

		if (tags.length === 0) {
			res.status(400).json({ code: 'TAGS_REQUIRED' });
			return;
		}

		if (!hasProfilePicture) {
			res.status(400).json({ code: 'PROFILE_PICTURE_REQUIRED' });
			return;
		}

		// Marque l'onboarding comme terminé
		await profileService.completeOnboarding(userId);

		res.json({ message: 'ONBOARDING_COMPLETED' });
	} catch (error) {
		console.error('Erreur completeOnboarding:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// PUT /api/profile/me
export const updateMyProfile = async (req: Request, res: Response): Promise<void> => {
	const userId = req.user!.userId;
	const {
		gender,
		sexualPreference,
		biography,
		birthDate,
		latitude,
		longitude,
		city,
		country,
		tags,
	} = req.body;

	// Validation du genre si fourni
	if (gender && !['male', 'female'].includes(gender)) {
		res.status(400).json({ code: 'INVALID_GENDER' });
		return;
	}

	// Validation de la préférence sexuelle si fournie
	if (sexualPreference && !['male', 'female', 'both'].includes(sexualPreference)) {
		res.status(400).json({ code: 'INVALID_SEXUAL_PREFERENCE' });
		return;
	}

	// Validation de la date de naissance si fournie (doit être majeur)
	if (birthDate) {
		const birthDateObj = new Date(birthDate);
		const today = new Date();
		const age = today.getFullYear() - birthDateObj.getFullYear();
		const monthDiff = today.getMonth() - birthDateObj.getMonth();
		if (age < 18 || (age === 18 && monthDiff < 0)) {
			res.status(400).json({ code: 'MUST_BE_ADULT' });
			return;
		}
	}

	try {
		// Construit l'objet avec seulement les champs fournis
		const profileData: any = {};
		if (gender) profileData.gender = gender;
		if (sexualPreference) profileData.sexualPreference = sexualPreference;
		if (biography !== undefined) profileData.biography = biography;
		if (birthDate) profileData.birthDate = birthDate;
		if (latitude !== undefined) profileData.latitude = latitude;
		if (longitude !== undefined) profileData.longitude = longitude;
		if (city !== undefined) profileData.city = city;
		if (country !== undefined) profileData.country = country;

		// Met à jour le profil seulement si des données sont fournies
		if (Object.keys(profileData).length > 0) {
			await profileService.upsertProfile(userId, profileData);
		}

		// Met à jour les tags si fournis
		if (tags && Array.isArray(tags)) {
			await profileService.updateUserTags(userId, tags);
		}

		res.json({ message: 'PROFILE_UPDATED' });
	} catch (error) {
		console.error('Erreur updateMyProfile:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
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
			res.status(400).json({ code: 'INVALID_EMAIL_FORMAT' });
			return;
		}

		// Vérifie que l'email n'est pas déjà pris
		if (await authService.emailExists(email)) {
			res.status(409).json({ code: 'EMAIL_ALREADY_EXISTS' });
			return;
		}
	}

	try {
		await profileService.updateUser(userId, { firstName, lastName, email });
		res.json({ message: 'USER_UPDATED' });
	} catch (error) {
		console.error('Erreur updateUserInfo:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
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
		res.status(500).json({ code: 'SERVER_ERROR' });
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
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// GET /api/profile/liked
export const getLikedProfiles = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user!.userId;
		const liked = await profileService.getLikedProfiles(userId);
		res.json({ liked });
	} catch (error) {
		console.error('Erreur getLikedProfiles:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};
