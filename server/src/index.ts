import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import photoRoutes from './routes/photo.routes';
import cookieParser from 'cookie-parser';
import tagRoutes from './routes/tag.routes';

// Charge les variables d'environnement depuis .env
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';

// Middlewares
app.use(
	cors({
		origin: process.env.FRONTEND_URL || 'http://localhost:5173',
		credentials: true, // Autorise l'envoi des cookies
	})
);
app.use(express.json());
app.use(cookieParser());

// Servir les fichiers statiques (photos uploadées)
app.use('/uploads', express.static(UPLOAD_DIR));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/tags', tagRoutes);

// Route de test + test l'accès à MySQL
app.get('/api/health', async (_req: Request, res: Response) => {
	try {
		// Teste la connexion MySQL
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

// Démarrage du serveur
app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
