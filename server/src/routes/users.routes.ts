import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import * as likesController from '../controllers/likes.controller';
import * as blocksController from '../controllers/blocks.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireProfilePicture } from '../middlewares/profile.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Profil public d'un utilisateur
router.get('/:id', usersController.getPublicProfile);

// Likes (nécessitent une photo de profil)
router.post('/:id/like', requireProfilePicture, likesController.likeUser);
router.delete('/:id/like', requireProfilePicture, likesController.unlikeUser);

// Block (nécessite une photo de profil)
router.post('/:id/block', requireProfilePicture, blocksController.blockUser);
router.delete('/:id/block', requireProfilePicture, blocksController.unblockUser);

// Report (nécessite une photo de profil)
router.post('/:id/report', requireProfilePicture, blocksController.reportUser);

export default router;
