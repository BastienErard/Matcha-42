import { Router } from 'express';
import multer from 'multer';
import * as photoController from '../controllers/photo.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Configuration de multer pour l'upload temporaire
const upload = multer({
	dest: '/tmp/uploads',
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB
	},
});

// Toutes les routes photos nécessitent une authentification
router.use(authMiddleware);

// Routes photos
router.get('/', photoController.getMyPhotos);
router.post('/', upload.single('photo'), photoController.uploadPhoto);
router.delete('/:id', photoController.deletePhoto);
router.put('/:id/profile', photoController.setProfilePicture);
router.put('/reorder', photoController.reorderPhotos);

export default router;
