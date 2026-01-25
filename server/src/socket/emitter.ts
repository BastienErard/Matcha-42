import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

// Initialise la référence à l'instance Socket.io
export const setSocketInstance = (socketIO: SocketIOServer): void => {
	io = socketIO;
};

// Émet un événement vers un utilisateur spécifique (via sa room personnelle)
export const emitToUser = (userId: number, event: string, data: unknown): void => {
	if (!io) {
		console.warn('[Socket.io] Instance non initialisée, événement ignoré');
		return;
	}
	io.to(`user:${userId}`).emit(event, data);
};

// Émet à tous les utilisateurs connectés
export const emitToAll = (event: string, data: unknown): void => {
	if (!io) {
		console.warn('[Socket.io] Instance non initialisée, événement ignoré');
		return;
	}
	io.emit(event, data);
};

// Émet une notification temps réel
export const emitNotification = (
	userId: number,
	notification: {
		id: number;
		type: 'like' | 'unlike' | 'visit' | 'message' | 'match';
		fromUser: {
			id: number;
			username: string;
			firstName: string;
			profilePhoto: string | null;
		};
		createdAt: Date;
	}
): void => {
	emitToUser(userId, 'notification', notification);
};

// Émet un nouveau message (pour le chat)
export const emitMessage = (
	userId: number,
	message: {
		id: number;
		conversationId: number;
		senderId: number;
		senderUsername: string;
		content: string;
		createdAt: Date;
	}
): void => {
	emitToUser(userId, 'message', message);
};

// Émet une mise à jour du statut en ligne à tous les utilisateurs
export const emitOnlineStatus = (userId: number, isOnline: boolean): void => {
	emitToAll('onlineStatus', { userId, isOnline });
};
