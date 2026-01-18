import { Request, Response } from 'express';
import * as blocksService from '../services/blocks.service';
import * as usersService from '../services/users.service';

// POST /api/users/:id/block
export const blockUser = async (req: Request, res: Response): Promise<void> => {
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
		const result = await blocksService.createBlock(currentUserId, targetUserId);

		if (!result.success) {
			res.status(400).json({ code: result.code });
			return;
		}

		res.json({ message: 'USER_BLOCKED' });
	} catch (error) {
		console.error('Erreur blockUser:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// DELETE /api/users/:id/block
export const unblockUser = async (req: Request, res: Response): Promise<void> => {
	const currentUserId = req.user!.userId;
	const targetUserId = parseInt(req.params.id, 10);

	// Validation de l'ID
	if (isNaN(targetUserId) || targetUserId <= 0) {
		res.status(400).json({ code: 'INVALID_USER_ID' });
		return;
	}

	try {
		const result = await blocksService.removeBlock(currentUserId, targetUserId);

		if (!result.success) {
			res.status(400).json({ code: result.code });
			return;
		}

		res.json({ message: 'USER_UNBLOCKED' });
	} catch (error) {
		console.error('Erreur unblockUser:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// GET /api/profile/blocked
export const getBlockedUsers = async (req: Request, res: Response): Promise<void> => {
	const currentUserId = req.user!.userId;

	try {
		const blockedUsers = await blocksService.getBlockedUsers(currentUserId);
		res.json({ blockedUsers });
	} catch (error) {
		console.error('Erreur getBlockedUsers:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// POST /api/users/:id/report
export const reportUser = async (req: Request, res: Response): Promise<void> => {
	const currentUserId = req.user!.userId;
	const targetUserId = parseInt(req.params.id, 10);
	const { reason } = req.body;

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
		const result = await blocksService.createReport(currentUserId, targetUserId, reason);

		if (!result.success) {
			res.status(400).json({ code: result.code });
			return;
		}

		res.json({ message: 'USER_REPORTED' });
	} catch (error) {
		console.error('Erreur reportUser:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};
