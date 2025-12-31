import pool from '../config/database';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// Interface représentant un utilisateur en BDD
interface User extends RowDataPacket {
	id: number;
	email: string;
	username: string;
	password_hash: string;
	first_name: string;
	last_name: string;
	is_verified: boolean;
}

// Données requises pour l'inscription
interface RegisterData {
	email: string;
	username: string;
	password: string;
	firstName: string;
	lastName: string;
}

// Données requises pour la connexion
interface LoginData {
	username: string;
	password: string;
}

// Vérifie si un email existe déjà
export const emailExists = async (email: string): Promise<boolean> => {
	const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [
		email,
	]);
	return rows.length > 0;
};

// Vérifie si un username existe déjà
export const usernameExists = async (username: string): Promise<boolean> => {
	const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE username = ?', [
		username,
	]);
	return rows.length > 0;
};

// Crée un nouvel utilisateur
export const createUser = async (
	data: RegisterData
): Promise<{ userId: number; verificationToken: string }> => {
	const hashedPassword = await hashPassword(data.password);

	// Token unique pour la vérification par email
	const verificationToken = crypto.randomUUID();

	const [result] = await pool.query<ResultSetHeader>(
		`INSERT INTO users (email, username, password_hash, first_name, last_name, verification_token)
     VALUES (?, ?, ?, ?, ?, ?)`,
		[
			data.email,
			data.username,
			hashedPassword,
			data.firstName,
			data.lastName,
			verificationToken,
		]
	);

	return { userId: result.insertId, verificationToken };
};

// Vérifie le compte via le token reçu par email
export const verifyEmail = async (token: string): Promise<boolean> => {
	const [result] = await pool.query<ResultSetHeader>(
		'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE verification_token = ?',
		[token]
	);
	return result.affectedRows > 0;
};

// Connecte un utilisateur et retourne un JWT
export const login = async (
	data: LoginData
): Promise<{ token: string; user: Omit<User, 'password_hash'> } | null> => {
	const [rows] = await pool.query<User[]>('SELECT * FROM users WHERE username = ?', [
		data.username,
	]);

	if (rows.length === 0) return null;

	const user = rows[0];

	// Vérifie le mot de passe
	const isValid = await comparePassword(data.password, user.password_hash);
	if (!isValid) return null;

	// Vérifie que le compte est activé
	if (!user.is_verified) return null;

	// Met à jour last_login et is_online
	await pool.query('UPDATE users SET last_login = NOW(), is_online = TRUE WHERE id = ?', [
		user.id,
	]);

	// Génère le JWT
	const token = generateToken({ userId: user.id, username: user.username });

	// Retourne le token et les infos user (sans le password_hash)
	const { password_hash, ...userWithoutPassword } = user;
	return { token, user: userWithoutPassword };
};

// Déconnecte un utilisateur
export const logout = async (userId: number): Promise<void> => {
	await pool.query('UPDATE users SET is_online = FALSE WHERE id = ?', [userId]);
};
