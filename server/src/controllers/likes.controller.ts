import { Request, Response } from 'express';
import * as likesService from '../services/likes.service';
import * as usersService from '../services/users.service';

// POST /api/users/:id/like
export const likeUser = async (req: Request, res: Response): Promise<void> => {
	const currentUserId = req.user!.userId;
	const targetUserId = parseInt(req.params.id, 10);

	// Validation de l'ID
	if (isNaN(targetUserId) || targetUserId <= 0) {
		res.status(400).json({ code: 'INVALID_USER_ID' });
		return;
	}

	// Vérifie que l'utilisateur cible existe
	if (!(await usersService.userExists(targetUserId))) {
		res.status(404).json({ code: 'USER_NOT_FOUND' });
		return;
	}

	try {
		const result = await likesService.createLike(currentUserId, targetUserId);

		if (!result.success) {
			res.status(400).json({ code: result.code });
			return;
		}

		res.json({
			message: 'LIKE_CREATED',
			isMatch: result.isMatch,
		});
	} catch (error) {
		console.error('Erreur likeUser:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// DELETE /api/users/:id/like
export const unlikeUser = async (req: Request, res: Response): Promise<void> => {
	const currentUserId = req.user!.userId;
	const targetUserId = parseInt(req.params.id, 10);

	// Validation de l'ID
	if (isNaN(targetUserId) || targetUserId <= 0) {
		res.status(400).json({ code: 'INVALID_USER_ID' });
		return;
	}

	try {
		const result = await likesService.removeLike(currentUserId, targetUserId);

		if (!result.success) {
			res.status(400).json({ code: result.code });
			return;
		}

		res.json({ message: 'LIKE_REMOVED' });
	} catch (error) {
		console.error('Erreur unlikeUser:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};
