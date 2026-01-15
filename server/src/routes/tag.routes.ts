import { Router } from 'express';
import * as tagController from '../controllers/tag.controller';

const router = Router();

// Route publique (pas besoin d'être connecté)
router.get('/', tagController.getAllTags);

export default router;
