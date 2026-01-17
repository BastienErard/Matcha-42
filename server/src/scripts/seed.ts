import { faker } from '@faker-js/faker';
import pool from '../config/database';
import { hashPassword } from '../utils/hash';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const NB_USERS = 500;

const GENDERS = ['male', 'female'] as const;
const PREFERENCES = ['male', 'female', 'both'] as const;

// Génère une date de naissance entre 18 et 65 ans
const generateBirthDate = (): string => {
	const today = new Date();
	const minAge = 18;
	const maxAge = 50;
	const age = faker.number.int({ min: minAge, max: maxAge });
	const birthYear = today.getFullYear() - age;
	const birthMonth = faker.number.int({ min: 0, max: 11 });
	const birthDay = faker.number.int({ min: 1, max: 28 });
	return new Date(birthYear, birthMonth, birthDay).toISOString().split('T')[0];
};

// Génère des coordonnées aléatoires dans le canton de Vaud
const generateLocation = (): {
	latitude: number;
	longitude: number;
	city: string;
	country: string;
} => {
	const cities = [
		{ city: 'Lausanne', lat: 46.5197, lng: 6.6323 },
		{ city: 'Nyon', lat: 46.3833, lng: 6.2348 },
		{ city: 'Vevey', lat: 46.4628, lng: 6.8431 },
		{ city: 'Montreux', lat: 46.4312, lng: 6.9107 },
		{ city: 'Yverdon-les-Bains', lat: 46.7785, lng: 6.641 },
	];

	const location = faker.helpers.arrayElement(cities);
	const latVariation = faker.number.float({ min: -0.05, max: 0.05 });
	const lngVariation = faker.number.float({ min: -0.05, max: 0.05 });

	return {
		latitude: location.lat + latVariation,
		longitude: location.lng + lngVariation,
		city: location.city,
		country: 'Suisse',
	};
};

// Génère une URL de photo de profil selon le genre
const generatePhotoUrl = (gender: 'male' | 'female', index: number): string => {
	return `https://randomuser.me/api/portraits/${gender === 'male' ? 'men' : 'women'}/${index % 100}.jpg`;
};

const seed = async (): Promise<void> => {
	console.log('🌱 Début du seeding...');

	const PASSWORD_HASH = await hashPassword('Test1234!');

	try {
		// Vérifie si des utilisateurs existent déjà
		const [existingUsers] = await pool.query<RowDataPacket[]>(
			'SELECT COUNT(*) as count FROM users'
		);

		if (existingUsers[0].count >= NB_USERS) {
			console.log(
				`✅ La base contient déjà ${existingUsers[0].count} utilisateurs. Seeding ignoré.`
			);
			process.exit(0);
		}

		// Récupère tous les tags disponibles
		const [tags] = await pool.query<RowDataPacket[]>('SELECT id, name FROM tags');
		const tagIds = tags.map((t) => t.id);

		console.log(`📊 ${tags.length} tags disponibles`);
		console.log(`👤 Création de ${NB_USERS} utilisateurs...`);

		for (let i = 0; i < NB_USERS; i++) {
			const gender = faker.helpers.arrayElement(GENDERS);
			const firstName = faker.person.firstName(gender === 'male' ? 'male' : 'female');
			const lastName = faker.person.lastName();
			const username =
				faker.internet.username({ firstName, lastName }).toLowerCase().slice(0, 20) + i;
			const email = `${username}@fakematcha.com`;

			// Crée l'utilisateur
			const [userResult] = await pool.query<ResultSetHeader>(
				`INSERT INTO users (email, username, password_hash, first_name, last_name, is_verified, preferred_language)
				 VALUES (?, ?, ?, ?, ?, TRUE, ?)`,
				[
					email,
					username,
					PASSWORD_HASH,
					firstName,
					lastName,
					faker.helpers.arrayElement(['fr', 'en']),
				]
			);

			const userId = userResult.insertId;

			// Crée le profil
			const location = generateLocation();
			const sexualPreference = faker.helpers.arrayElement(PREFERENCES);
			const birthDate = generateBirthDate();
			const biography = faker.lorem.sentences({ min: 2, max: 5 });
			const fameRating = faker.number.int({ min: 20, max: 80 });

			await pool.query(
				`INSERT INTO profiles (user_id, gender, sexual_preference, biography, birth_date, latitude, longitude, city, country, fame_rating, location_updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
				[
					userId,
					gender,
					sexualPreference,
					biography,
					birthDate,
					location.latitude,
					location.longitude,
					location.city,
					location.country,
					fameRating,
				]
			);

			// Ajoute une photo de profil
			const photoUrl = generatePhotoUrl(gender, i);
			const [photoResult] = await pool.query<ResultSetHeader>(
				`INSERT INTO photos (user_id, filename, filepath, is_profile_picture, upload_order)
				 VALUES (?, ?, ?, TRUE, 0)`,
				[userId, `profile_${userId}.jpg`, photoUrl]
			);

			// Met à jour la référence de la photo de profil
			await pool.query('UPDATE profiles SET profile_picture_id = ? WHERE user_id = ?', [
				photoResult.insertId,
				userId,
			]);

			// Associe des tags aléatoires (entre 3 et 8 tags)
			const nbTags = faker.number.int({ min: 3, max: 8 });
			const userTags = faker.helpers.arrayElements(tagIds, nbTags);

			for (const tagId of userTags) {
				await pool.query('INSERT INTO user_tags (user_id, tag_id) VALUES (?, ?)', [
					userId,
					tagId,
				]);
			}

			// Log de progression tous les 50 utilisateurs
			if ((i + 1) % 50 === 0) {
				console.log(`   ✓ ${i + 1}/${NB_USERS} utilisateurs créés`);
			}
		}

		console.log('✅ Seeding terminé avec succès !');
		process.exit(0);
	} catch (error) {
		console.error('❌ Erreur lors du seeding:', error);
		process.exit(1);
	}
};

seed();
