import pool from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import fs from 'fs/promises';
import path from 'path';

interface Photo extends RowDataPacket {
	id: number;
	user_id: number;
	filename: string;
	filepath: string;
	is_profile_picture: boolean;
	upload_order: number;
	created_at: Date;
}

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';
const MAX_PHOTOS = 5;

// Récupère toutes les photos d'un utilisateur
export const getUserPhotos = async (userId: number): Promise<Photo[]> => {
	const [rows] = await pool.query<Photo[]>(
		'SELECT * FROM photos WHERE user_id = ? ORDER BY upload_order ASC',
		[userId]
	);
	return rows;
};

// Compte le nombre de photos d'un utilisateur
export const countUserPhotos = async (userId: number): Promise<number> => {
	const [rows] = await pool.query<RowDataPacket[]>(
		'SELECT COUNT(*) as count FROM photos WHERE user_id = ?',
		[userId]
	);
	return rows[0].count;
};

// Ajoute une photo
export const addPhoto = async (
	userId: number,
	filename: string,
	filepath: string
): Promise<{ photoId: number; isFirst: boolean }> => {
	const count = await countUserPhotos(userId);

	if (count >= MAX_PHOTOS) {
		throw new Error('MAX_PHOTOS_REACHED');
	}

	const isFirst = count === 0;

	const [result] = await pool.query<ResultSetHeader>(
		`INSERT INTO photos (user_id, filename, filepath, is_profile_picture, upload_order)
		 VALUES (?, ?, ?, ?, ?)`,
		[userId, filename, filepath, isFirst, count]
	);

	// Si c'est la première photo, la définir comme photo de profil
	if (isFirst) {
		await pool.query('UPDATE profiles SET profile_picture_id = ? WHERE user_id = ?', [
			result.insertId,
			userId,
		]);
	}

	return { photoId: result.insertId, isFirst };
};

// Supprime une photo
export const deletePhoto = async (userId: number, photoId: number): Promise<boolean> => {
	// Vérifie que la photo appartient à l'utilisateur
	const [rows] = await pool.query<Photo[]>('SELECT * FROM photos WHERE id = ? AND user_id = ?', [
		photoId,
		userId,
	]);

	if (rows.length === 0) return false;

	const photo = rows[0];

	// Supprime le fichier physique
	try {
		await fs.unlink(path.join(UPLOAD_DIR, photo.filename));
	} catch (err) {
		console.error('Erreur suppression fichier:', err);
	}

	// Supprime de la BDD
	await pool.query('DELETE FROM photos WHERE id = ?', [photoId]);

	// Si c'était la photo de profil, assigner la première photo restante
	if (photo.is_profile_picture) {
		const [remaining] = await pool.query<Photo[]>(
			'SELECT id FROM photos WHERE user_id = ? ORDER BY upload_order ASC LIMIT 1',
			[userId]
		);

		if (remaining.length > 0) {
			await setProfilePicture(userId, remaining[0].id);
		} else {
			await pool.query('UPDATE profiles SET profile_picture_id = NULL WHERE user_id = ?', [
				userId,
			]);
		}
	}

	return true;
};

// Définit une photo comme photo de profil
export const setProfilePicture = async (userId: number, photoId: number): Promise<boolean> => {
	// Vérifie que la photo appartient à l'utilisateur
	const [rows] = await pool.query<RowDataPacket[]>(
		'SELECT id FROM photos WHERE id = ? AND user_id = ?',
		[photoId, userId]
	);

	if (rows.length === 0) return false;

	// Retire l'ancien statut de photo de profil
	await pool.query('UPDATE photos SET is_profile_picture = FALSE WHERE user_id = ?', [userId]);

	// Définit la nouvelle photo de profil
	await pool.query('UPDATE photos SET is_profile_picture = TRUE WHERE id = ?', [photoId]);

	// Met à jour la référence dans profiles
	await pool.query('UPDATE profiles SET profile_picture_id = ? WHERE user_id = ?', [
		photoId,
		userId,
	]);

	return true;
};

// Récupère une photo par son ID
export const getPhotoById = async (photoId: number): Promise<Photo | null> => {
	const [rows] = await pool.query<Photo[]>('SELECT * FROM photos WHERE id = ?', [photoId]);
	return rows.length > 0 ? rows[0] : null;
};

// Réordonne les photos d'un utilisateur
export const reorderPhotos = async (userId: number, photoIds: number[]): Promise<boolean> => {
	// Vérifie que toutes les photos appartiennent à l'utilisateur
	const [rows] = await pool.query<Photo[]>('SELECT id FROM photos WHERE user_id = ?', [userId]);

	const userPhotoIds = rows.map((r) => r.id);
	const allBelongToUser = photoIds.every((id) => userPhotoIds.includes(id));

	if (!allBelongToUser || photoIds.length !== userPhotoIds.length) {
		return false;
	}

	// Met à jour l'ordre
	for (let i = 0; i < photoIds.length; i++) {
		await pool.query('UPDATE photos SET upload_order = ? WHERE id = ? AND user_id = ?', [
			i,
			photoIds[i],
			userId,
		]);
	}

	return true;
};
