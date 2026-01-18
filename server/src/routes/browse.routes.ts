import { Router } from 'express';
import * as browseController from '../controllers/browse.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Liste des profils suggérés
router.get('/suggestions', browseController.getSuggestions);

export default router;
