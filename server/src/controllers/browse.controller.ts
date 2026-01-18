import { Request, Response } from 'express';
import * as browseService from '../services/browse.service';

// GET /api/browse/suggestions
export const getSuggestions = async (req: Request, res: Response): Promise<void> => {
	const userId = req.user!.userId;

	// Paramètres de pagination
	const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 50);
	const offset = parseInt(req.query.offset as string, 10) || 0;

	// Paramètres de tri
	const sortBy = (req.query.sortBy as string) || 'distance';
	const order = (req.query.order as string) || 'asc';

	// Validation du tri
	const validSortBy = ['distance', 'age', 'fame', 'tags'];
	const validOrder = ['asc', 'desc'];

	if (!validSortBy.includes(sortBy)) {
		res.status(400).json({ code: 'INVALID_SORT_BY' });
		return;
	}

	if (!validOrder.includes(order)) {
		res.status(400).json({ code: 'INVALID_ORDER' });
		return;
	}

	// Paramètres de filtrage
	const filters: {
		minAge?: number;
		maxAge?: number;
		maxDistance?: number;
		minFame?: number;
		maxFame?: number;
		tags?: string[];
	} = {};

	if (req.query.minAge) {
		filters.minAge = parseInt(req.query.minAge as string, 10);
		if (isNaN(filters.minAge) || filters.minAge < 18) {
			res.status(400).json({ code: 'INVALID_MIN_AGE' });
			return;
		}
	}

	if (req.query.maxAge) {
		filters.maxAge = parseInt(req.query.maxAge as string, 10);
		if (isNaN(filters.maxAge) || filters.maxAge < 18) {
			res.status(400).json({ code: 'INVALID_MAX_AGE' });
			return;
		}
	}

	if (req.query.maxDistance) {
		filters.maxDistance = parseInt(req.query.maxDistance as string, 10);
		if (isNaN(filters.maxDistance) || filters.maxDistance < 0) {
			res.status(400).json({ code: 'INVALID_MAX_DISTANCE' });
			return;
		}
	}

	if (req.query.minFame) {
		filters.minFame = parseInt(req.query.minFame as string, 10);
		if (isNaN(filters.minFame) || filters.minFame < 0 || filters.minFame > 100) {
			res.status(400).json({ code: 'INVALID_MIN_FAME' });
			return;
		}
	}

	if (req.query.maxFame) {
		filters.maxFame = parseInt(req.query.maxFame as string, 10);
		if (isNaN(filters.maxFame) || filters.maxFame < 0 || filters.maxFame > 100) {
			res.status(400).json({ code: 'INVALID_MAX_FAME' });
			return;
		}
	}

	if (req.query.tags) {
		const tagsParam = req.query.tags as string;
		filters.tags = tagsParam
			.split(',')
			.map((t) => t.trim())
			.filter((t) => t.length > 0);
	}

	try {
		const result = await browseService.getSuggestions(
			userId,
			filters,
			{
				sortBy: sortBy as 'distance' | 'age' | 'fame' | 'tags',
				order: order as 'asc' | 'desc',
			},
			limit,
			offset
		);

		res.json({
			profiles: result.profiles,
			total: result.total,
			limit,
			offset,
		});
	} catch (error) {
		console.error('Erreur getSuggestions:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};
