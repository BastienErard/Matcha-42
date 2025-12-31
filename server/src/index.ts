import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database';

// Charge les variables d'environnement depuis .env
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json()); // Parse le JSON des requêtes entrantes

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
