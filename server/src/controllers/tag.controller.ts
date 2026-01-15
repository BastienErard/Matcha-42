import { Request, Response } from 'express';
import * as tagService from '../services/tag.service';

// GET /api/tags
export const getAllTags = async (_req: Request, res: Response): Promise<void> => {
	try {
		const tags = await tagService.getAllTags();
		res.json({ tags });
	} catch (error) {
		console.error('Erreur getAllTags:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};
