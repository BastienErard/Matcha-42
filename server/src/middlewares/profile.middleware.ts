import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

// Vérifie si l'utilisateur a une photo de profil
export const requireProfilePicture = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	const userId = req.user?.userId;

	if (!userId) {
		res.status(401).json({ code: 'UNAUTHORIZED' });
		return;
	}

	const [rows] = await pool.query<RowDataPacket[]>(
		'SELECT 1 FROM photos WHERE user_id = ? AND is_profile_picture = TRUE',
		[userId]
	);

	if (rows.length === 0) {
		res.status(403).json({ code: 'PROFILE_PICTURE_REQUIRED' });
		return;
	}

	next();
};
