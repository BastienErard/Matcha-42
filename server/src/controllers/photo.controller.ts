import { Request, Response } from 'express';
import * as photoService from '../services/photo.service';
import path from 'path';
import fs from 'fs/promises';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// GET /api/photos
export const getMyPhotos = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user!.userId;
		const photos = await photoService.getUserPhotos(userId);
		res.json({ photos });
	} catch (error) {
		console.error('Erreur getMyPhotos:', error);
		res.status(500).json({ error: 'SERVER_ERROR' });
	}
};

// POST /api/photos
export const uploadPhoto = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user!.userId;
		const file = req.file;

		if (!file) {
			res.status(400).json({ error: 'NO_FILE_PROVIDED' });
			return;
		}

		// Validation du type MIME
		if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
			// Supprime le fichier temporaire
			await fs.unlink(file.path);
			res.status(400).json({ error: 'INVALID_FILE_TYPE' });
			return;
		}

		// Validation de la taille
		if (file.size > MAX_FILE_SIZE) {
			await fs.unlink(file.path);
			res.status(400).json({ error: 'FILE_TOO_LARGE' });
			return;
		}

		// Génère un nom unique pour le fichier
		const ext = path.extname(file.originalname);
		const filename = `${userId}_${Date.now()}${ext}`;
		const filepath = path.join(UPLOAD_DIR, filename);

		// Déplace le fichier vers le dossier d'upload
		await fs.copyFile(file.path, filepath);
		await fs.unlink(file.path);

		// Enregistre en BDD
		const { photoId, isFirst } = await photoService.addPhoto(userId, filename, filepath);

		res.status(201).json({
			message: 'PHOTO_UPLOADED',
			photoId,
			isProfilePicture: isFirst,
		});
	} catch (error) {
		console.error('Erreur uploadPhoto:', error);
		if (error instanceof Error && error.message === 'MAX_PHOTOS_REACHED') {
			res.status(400).json({ error: 'MAX_PHOTOS_REACHED' });
			return;
		}
		res.status(500).json({ error: 'SERVER_ERROR' });
	}
};

// DELETE /api/photos/:id
export const deletePhoto = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user!.userId;
		const photoId = parseInt(req.params.id, 10);

		if (isNaN(photoId)) {
			res.status(400).json({ error: 'INVALID_PHOTO_ID' });
			return;
		}

		const deleted = await photoService.deletePhoto(userId, photoId);

		if (!deleted) {
			res.status(404).json({ error: 'PHOTO_NOT_FOUND' });
			return;
		}

		res.json({ message: 'PHOTO_DELETED' });
	} catch (error) {
		console.error('Erreur deletePhoto:', error);
		res.status(500).json({ error: 'SERVER_ERROR' });
	}
};

// PUT /api/photos/:id/profile
export const setProfilePicture = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user!.userId;
		const photoId = parseInt(req.params.id, 10);

		if (isNaN(photoId)) {
			res.status(400).json({ error: 'INVALID_PHOTO_ID' });
			return;
		}

		const success = await photoService.setProfilePicture(userId, photoId);

		if (!success) {
			res.status(404).json({ error: 'PHOTO_NOT_FOUND' });
			return;
		}

		res.json({ message: 'PROFILE_PICTURE_UPDATED' });
	} catch (error) {
		console.error('Erreur setProfilePicture:', error);
		res.status(500).json({ error: 'SERVER_ERROR' });
	}
};

// PUT /api/photos/reorder
export const reorderPhotos = async (req: Request, res: Response): Promise<void> => {
	try {
		const userId = req.user!.userId;
		const { photoIds } = req.body;

		if (!photoIds || !Array.isArray(photoIds)) {
			res.status(400).json({ error: 'INVALID_PHOTO_IDS' });
			return;
		}

		const success = await photoService.reorderPhotos(userId, photoIds);

		if (!success) {
			res.status(400).json({ error: 'REORDER_FAILED' });
			return;
		}

		res.json({ message: 'PHOTOS_REORDERED' });
	} catch (error) {
		console.error('Erreur reorderPhotos:', error);
		res.status(500).json({ error: 'SERVER_ERROR' });
	}
};
