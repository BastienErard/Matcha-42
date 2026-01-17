import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Profil public d'un utilisateur
router.get('/:id', usersController.getPublicProfile);

export default router;
