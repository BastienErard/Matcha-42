import { Router } from 'express';
import * as notificationsController from '../controllers/notifications.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Liste des notifications
router.get('/', notificationsController.getNotifications);

// Nombre de notifications non lues
router.get('/unread-count', notificationsController.getUnreadCount);

// Marquer toutes comme lues
router.put('/read-all', notificationsController.markAllAsRead);

// Marquer une notification comme lue
router.put('/:id/read', notificationsController.markAsRead);

export default router;
