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

export function useSocket(options: UseSocketOptions = {}) {
	const { user } = useAuth();
	const socketRef = useRef<Socket | null>(null);
	const optionsRef = useRef(options);

	// Met à jour les options sans recréer la connexion
	useEffect(() => {
		optionsRef.current = options;
	}, [options]);

	useEffect(() => {
		if (!user) {
			// Déconnecte si pas d'utilisateur
			if (socketRef.current) {
				socketRef.current.disconnect();
				socketRef.current = null;
			}
			return;
		}

		// Crée la connexion Socket.io
		const socket = io('http://localhost:3000', {
			withCredentials: true,
			transports: ['websocket', 'polling'],
		});

		// Écoute les notifications
		socket.on('notification', (notification: SocketNotification) => {
			optionsRef.current.onNotification?.(notification);
		});

		// Écoute les messages
		socket.on('message', (message: SocketMessage) => {
			optionsRef.current.onMessage?.(message);
		});

		// Écoute les changements de statut en ligne
		socket.on('onlineStatus', (status: SocketOnlineStatus) => {
			optionsRef.current.onOnlineStatus?.(status);
		});

		socketRef.current = socket;

		return () => {
			socket.disconnect();
			socketRef.current = null;
		};
	}, [user]);

	const isConnected = useCallback(() => {
		return socketRef.current?.connected ?? false;
	}, []);

	return { socket: socketRef.current, isConnected };
}
