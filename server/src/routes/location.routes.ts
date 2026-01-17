import { Router } from 'express';
import * as locationController from '../controllers/location.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

router.put('/location', locationController.updateLocation);
router.get('/location-from-ip', locationController.getLocationFromIp);
router.get('/location-source', locationController.getLocationSource);

export default router;
