import { Request, Response } from 'express';
import * as notificationsService from '../services/notifications.service';

// GET /api/notifications
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
	const userId = req.user!.userId;
	const limit = parseInt(req.query.limit as string, 10) || 50;
	const offset = parseInt(req.query.offset as string, 10) || 0;

	// Validation des paramètres
	if (limit < 1 || limit > 100) {
		res.status(400).json({ code: 'INVALID_LIMIT' });
		return;
	}

	if (offset < 0) {
		res.status(400).json({ code: 'INVALID_OFFSET' });
		return;
	}

	try {
		const notifications = await notificationsService.getNotifications(userId, limit, offset);
		const unreadCount = await notificationsService.getUnreadCount(userId);

		res.json({ notifications, unreadCount });
	} catch (error) {
		console.error('Erreur getNotifications:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// GET /api/notifications/unread-count
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
	const userId = req.user!.userId;

	try {
		const unreadCount = await notificationsService.getUnreadCount(userId);
		res.json({ unreadCount });
	} catch (error) {
		console.error('Erreur getUnreadCount:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// PUT /api/notifications/:id/read
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
	const userId = req.user!.userId;
	const notificationId = parseInt(req.params.id, 10);

	// Validation de l'ID
	if (isNaN(notificationId) || notificationId <= 0) {
		res.status(400).json({ code: 'INVALID_NOTIFICATION_ID' });
		return;
	}

	try {
		const success = await notificationsService.markAsRead(notificationId, userId);

		if (!success) {
			res.status(404).json({ code: 'NOTIFICATION_NOT_FOUND' });
			return;
		}

		res.json({ message: 'NOTIFICATION_MARKED_READ' });
	} catch (error) {
		console.error('Erreur markAsRead:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// PUT /api/notifications/read-all
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
	const userId = req.user!.userId;

	try {
		const count = await notificationsService.markAllAsRead(userId);
		res.json({ message: 'ALL_NOTIFICATIONS_MARKED_READ', count });
	} catch (error) {
		console.error('Erreur markAllAsRead:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};
