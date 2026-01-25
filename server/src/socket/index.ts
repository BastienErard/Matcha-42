import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import pool from '../config/database';
import * as cookie from 'cookie';
import { emitOnlineStatus } from './emitter';

// Map pour associer un userId à ses sockets actifs
const userSockets = new Map<number, Set<string>>();

// Met à jour le statut en ligne dans la base de données et émet l'événement
const updateOnlineStatus = async (userId: number, isOnline: boolean): Promise<void> => {
	try {
		if (isOnline) {
			await pool.query('UPDATE users SET is_online = TRUE WHERE id = ?', [userId]);
		} else {
			await pool.query(
				'UPDATE users SET is_online = FALSE, last_login = NOW() WHERE id = ?',
				[userId]
			);
		}

		// Émet le changement de statut à tous les utilisateurs connectés
		emitOnlineStatus(userId, isOnline);
	} catch (error) {
		console.error('[Socket.io] Erreur mise à jour statut en ligne:', error);
	}
};

export const setupSocket = (io: SocketIOServer): void => {
	// Middleware d'authentification Socket.io
	io.use((socket, next) => {
		let token = socket.handshake.auth.token;

		if (!token && socket.handshake.headers.cookie) {
			const cookies = cookie.parse(socket.handshake.headers.cookie);
			token = cookies.token;
		}

		if (!token) {
			return next(new Error('AUTHENTICATION_REQUIRED'));
		}

		try {
			const decoded = verifyToken(token);

			if (!decoded) {
				return next(new Error('INVALID_TOKEN'));
			}

			// Attache les données utilisateur au socket
			socket.data.userId = decoded.userId;
			socket.data.username = decoded.username;
			next();
		} catch {
			return next(new Error('INVALID_TOKEN'));
		}
	});

	io.on('connection', async (socket: Socket) => {
		const userId = socket.data.userId as number;

		// Premier socket de cet utilisateur ? → passe en ligne
		const isFirstConnection = !userSockets.has(userId) || userSockets.get(userId)!.size === 0;

		// Ajoute le socket à la liste des sockets de cet utilisateur
		if (!userSockets.has(userId)) {
			userSockets.set(userId, new Set());
		}
		userSockets.get(userId)!.add(socket.id);

		// Met à jour la BDD si c'est la première connexion
		if (isFirstConnection) {
			await updateOnlineStatus(userId, true);
		}

		// Rejoint une room personnelle (pour recevoir les notifications)
		socket.join(`user:${userId}`);

		// Gestion de la déconnexion
		socket.on('disconnect', async () => {
			// Retire le socket de la liste
			const sockets = userSockets.get(userId);
			if (sockets) {
				sockets.delete(socket.id);

				// Dernier socket déconnecté ? → passe hors ligne
				if (sockets.size === 0) {
					await updateOnlineStatus(userId, false);
				}
			}
		});
	});
};

// Vérifie si un utilisateur est connecté (au moins un socket actif)
export const isUserOnline = (userId: number): boolean => {
	const sockets = userSockets.get(userId);
	return sockets !== undefined && sockets.size > 0;
};

// Récupère tous les socket IDs d'un utilisateur
export const getUserSocketIds = (userId: number): string[] => {
	const sockets = userSockets.get(userId);
	return sockets ? Array.from(sockets) : [];
};
