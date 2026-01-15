import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

interface Tag extends RowDataPacket {
	id: number;
	name: string;
}

// Récupère tous les tags disponibles
export const getAllTags = async (): Promise<Tag[]> => {
	const [rows] = await pool.query<Tag[]>('SELECT id, name FROM tags ORDER BY name ASC');
	return rows;
};
