import express, { Application, Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import photoRoutes from './routes/photo.routes';
import cookieParser from 'cookie-parser';
import tagRoutes from './routes/tag.routes';
import locationRoutes from './routes/location.routes';
import usersRoutes from './routes/users.routes';
import notificationsRoutes from './routes/notifications.routes';
import browseRoutes from './routes/browse.routes';
import { setupSocket } from './socket';
import { setSocketInstance } from './socket/emitter';
import chatRoutes from './routes/chat.routes';

// Charge les variables d'environnement depuis .env
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Création du serveur HTTP (nécessaire pour Socket.io)
const httpServer = createServer(app);

// Initialisation de Socket.io
const io = new SocketIOServer(httpServer, {
	cors: {
		origin: FRONTEND_URL,
		credentials: true,
	},
});

// Middlewares Express
app.use(
	cors({
		origin: FRONTEND_URL,
		credentials: true,
	})
);
app.use(express.json());
app.use(cookieParser());

// Servir les fichiers statiques (photos uploadées)
app.use('/uploads', express.static(UPLOAD_DIR));

// Routes REST
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/profile', locationRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/browse', browseRoutes);
app.use('/api/chat', chatRoutes);

// Test de viabilité
app.get('/api/health', async (_req: Request, res: Response) => {
	try {
		const [rows] = await pool.query('SELECT 1 + 1 AS result');
		res.json({
			status: 'ok',
			database: 'connected',
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			database: 'disconnected',
			message: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

// Initialisation du module Socket.io
setupSocket(io);
setSocketInstance(io);

// Démarrage du serveur HTTP
httpServer.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
	console.log(`Socket.io ready`);
});

// Export pour utilisation dans d'autres modules
export { io };
