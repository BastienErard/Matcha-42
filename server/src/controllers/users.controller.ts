import { Request, Response } from 'express';
import * as usersService from '../services/users.service';

// GET /api/users/:id
export const getPublicProfile = async (req: Request, res: Response): Promise<void> => {
	const currentUserId = req.user!.userId;
	const targetUserId = parseInt(req.params.id, 10);

	// Validation de l'ID
	if (isNaN(targetUserId) || targetUserId <= 0) {
		res.status(400).json({ code: 'INVALID_USER_ID' });
		return;
	}

	try {
		// Récupère le profil public
		const profile = await usersService.getPublicProfile(targetUserId);

		if (!profile) {
			res.status(404).json({ code: 'USER_NOT_FOUND' });
			return;
		}

		// Récupère le statut d'interaction (likes, blocks)
		const interaction = await usersService.getInteractionStatus(currentUserId, targetUserId);

		if (interaction.isBlockedBy) {
			res.status(404).json({ code: 'USER_NOT_FOUND' });
			return;
		}

		// Enregistre la visite (sauf si bloqué ou propre profil)
		if (currentUserId !== targetUserId && !interaction.hasBlocked) {
			await usersService.recordVisit(currentUserId, targetUserId);
		}

		// Retourne le profil avec le statut d'interaction
		res.json({
			profile,
			interaction: {
				hasLiked: interaction.hasLiked,
				hasLikedMe: interaction.hasLikedMe,
				isConnected: interaction.isConnected,
				hasBlocked: interaction.hasBlocked,
			},
		});
	} catch (error) {
		console.error('Erreur getPublicProfile:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};
