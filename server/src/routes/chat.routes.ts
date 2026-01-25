import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireProfilePicture } from '../middlewares/profile.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

// Liste des conversations
router.get('/conversations', chatController.getConversations);

// Nombre total de messages non lus
router.get('/unread-count', chatController.getUnreadCount);

// Messages d'une conversation
router.get('/conversations/:id/messages', chatController.getMessages);

// Marquer une conversation comme lue
router.put('/conversations/:id/read', chatController.markAsRead);

// Envoyer un message (nécessite une photo de profil)
router.post('/messages', requireProfilePicture, chatController.sendMessage);

export default router;
