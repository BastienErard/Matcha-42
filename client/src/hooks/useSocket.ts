import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

interface SocketNotification {
	id: number;
	type: 'like' | 'unlike' | 'visit' | 'message' | 'match';
	fromUser: {
		id: number;
		username: string;
		firstName: string;
		profilePhoto: string | null;
	};
	createdAt: string;
}

interface SocketMessage {
	id: number;
	conversationId: number;
	senderId: number;
	senderUsername: string;
	content: string;
	createdAt: string;
}

interface SocketOnlineStatus {
	userId: number;
	isOnline: boolean;
}

interface UseSocketOptions {
	onNotification?: (notification: SocketNotification) => void;
	onMessage?: (message: SocketMessage) => void;
	onOnlineStatus?: (status: SocketOnlineStatus) => void;
}

// Singleton pour éviter les connexions multiples
let globalSocket: Socket | null = null;
let connectionCount = 0;
let disconnectTimeout: ReturnType<typeof setTimeout> | null = null;

export function useSocket(options: UseSocketOptions = {}) {
	const { user } = useAuth();
	const optionsRef = useRef(options);

	// Met à jour les options sans recréer la connexion
	useEffect(() => {
		optionsRef.current = options;
	}, [options]);

	useEffect(() => {
		if (!user) {
			return;
		}

		// Annule tout timeout de déconnexion en cours
		if (disconnectTimeout) {
			clearTimeout(disconnectTimeout);
			disconnectTimeout = null;
		}

		connectionCount++;

		// Crée la connexion Socket.io seulement si elle n'existe pas
		if (!globalSocket) {
			globalSocket = io('http://localhost:3000', {
				withCredentials: true,
				transports: ['websocket', 'polling'],
			});
		}

		const socket = globalSocket;

		// Handlers
		const handleNotification = (notification: SocketNotification) => {
			optionsRef.current.onNotification?.(notification);
		};

		const handleMessage = (message: SocketMessage) => {
			optionsRef.current.onMessage?.(message);
		};

		const handleOnlineStatus = (status: SocketOnlineStatus) => {
			optionsRef.current.onOnlineStatus?.(status);
		};

		// Écoute les événements
		socket.on('notification', handleNotification);
		socket.on('message', handleMessage);
		socket.on('onlineStatus', handleOnlineStatus);

		return () => {
			connectionCount--;

			// Retire les listeners
			socket.off('notification', handleNotification);
			socket.off('message', handleMessage);
			socket.off('onlineStatus', handleOnlineStatus);

			// Déconnecte avec un délai pour permettre le remount en StrictMode
			if (connectionCount === 0) {
				disconnectTimeout = setTimeout(() => {
					if (connectionCount === 0 && globalSocket) {
						globalSocket.disconnect();
						globalSocket = null;
					}
				}, 100);
			}
		};
	}, [user]);

	const isConnected = useCallback(() => {
		return globalSocket?.connected ?? false;
	}, []);

	return { socket: globalSocket, isConnected };
}

export type { SocketNotification, SocketMessage, SocketOnlineStatus };
