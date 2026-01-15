import { Router } from 'express';
import * as profileController from '../controllers/profile.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Toutes les routes profil nécessitent une authentification
router.use(authMiddleware);

// Profil de l'utilisateur connecté
router.get('/me', profileController.getMyProfile);
router.put('/me', profileController.updateMyProfile);

// Complétion de l'onboarding
router.post('/complete-onboarding', profileController.completeOnboarding);

// Mise à jour des infos utilisateur (nom, prénom, email)
router.put('/user', profileController.updateUserInfo);

// Qui a visité / liké mon profil
router.get('/visitors', profileController.getVisitors);
router.get('/likers', profileController.getLikers);

// Profils que j'ai likés
router.get('/liked', profileController.getLikedProfiles);

export default router;
