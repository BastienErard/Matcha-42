import { Request, Response } from 'express';
import * as chatService from '../services/chat.service';
import sanitizeHtml from 'sanitize-html';

// GET /api/chat/conversations
export const getConversations = async (req: Request, res: Response): Promise<void> => {
	const userId = req.user!.userId;

	try {
		const conversations = await chatService.getConversations(userId);
		res.json({ conversations });
	} catch (error) {
		console.error('Erreur getConversations:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// GET /api/chat/conversations/:id/messages
export const getMessages = async (req: Request, res: Response): Promise<void> => {
	const userId = req.user!.userId;
	const conversationId = parseInt(req.params.id, 10);
	const limit = parseInt(req.query.limit as string, 10) || 50;
	const offset = parseInt(req.query.offset as string, 10) || 0;

	if (isNaN(conversationId) || conversationId <= 0) {
		res.status(400).json({ code: 'INVALID_CONVERSATION_ID' });
		return;
	}

	if (limit < 1 || limit > 100) {
		res.status(400).json({ code: 'INVALID_LIMIT' });
		return;
	}

	if (offset < 0) {
		res.status(400).json({ code: 'INVALID_OFFSET' });
		return;
	}

	try {
		const messages = await chatService.getMessages(conversationId, userId, limit, offset);
		res.json({ messages });
	} catch (error) {
		if (error instanceof Error && error.message === 'CONVERSATION_NOT_FOUND') {
			res.status(404).json({ code: 'CONVERSATION_NOT_FOUND' });
			return;
		}
		console.error('Erreur getMessages:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// POST /api/chat/messages
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
	const senderId = req.user!.userId;
	const { receiverId, content } = req.body;

	// Validation du receiverId
	if (!receiverId || typeof receiverId !== 'number' || receiverId <= 0) {
		res.status(400).json({ code: 'INVALID_RECEIVER_ID' });
		return;
	}

	// Validation du contenu
	if (!content || typeof content !== 'string') {
		res.status(400).json({ code: 'CONTENT_REQUIRED' });
		return;
	}

	// Sanitize et trim le contenu
	const sanitizedContent = sanitizeHtml(content.trim(), {
		allowedTags: [],
		allowedAttributes: {},
	});

	if (sanitizedContent.length === 0) {
		res.status(400).json({ code: 'CONTENT_REQUIRED' });
		return;
	}

	if (sanitizedContent.length > 2000) {
		res.status(400).json({ code: 'CONTENT_TOO_LONG' });
		return;
	}

	// On ne peut pas s'envoyer un message à soi-même
	if (senderId === receiverId) {
		res.status(400).json({ code: 'CANNOT_MESSAGE_YOURSELF' });
		return;
	}

	try {
		const message = await chatService.sendMessage(senderId, receiverId, sanitizedContent);
		res.status(201).json({ message });
	} catch (error) {
		if (error instanceof Error) {
			switch (error.message) {
				case 'USERS_NOT_CONNECTED':
					res.status(403).json({ code: 'USERS_NOT_CONNECTED' });
					return;
				case 'YOU_ARE_BLOCKED':
					res.status(403).json({ code: 'YOU_ARE_BLOCKED' });
					return;
				case 'USER_BLOCKED':
					res.status(403).json({ code: 'USER_BLOCKED' });
					return;
			}
		}
		console.error('Erreur sendMessage:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// PUT /api/chat/conversations/:id/read
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
	const userId = req.user!.userId;
	const conversationId = parseInt(req.params.id, 10);

	if (isNaN(conversationId) || conversationId <= 0) {
		res.status(400).json({ code: 'INVALID_CONVERSATION_ID' });
		return;
	}

	try {
		const count = await chatService.markMessagesAsRead(conversationId, userId);
		res.json({ message: 'MESSAGES_MARKED_READ', count });
	} catch (error) {
		if (error instanceof Error && error.message === 'CONVERSATION_NOT_FOUND') {
			res.status(404).json({ code: 'CONVERSATION_NOT_FOUND' });
			return;
		}
		console.error('Erreur markAsRead:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};

// GET /api/chat/unread-count
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
	const userId = req.user!.userId;

	try {
		const unreadCount = await chatService.getTotalUnreadCount(userId);
		res.json({ unreadCount });
	} catch (error) {
		console.error('Erreur getUnreadCount:', error);
		res.status(500).json({ code: 'SERVER_ERROR' });
	}
};
