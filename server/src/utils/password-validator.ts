// Liste des mots de passe les plus courants (source: SecLists, Have I Been Pwned)
const COMMON_PASSWORDS = [
	'password',
	'password1',
	'password123',
	'123456',
	'12345678',
	'123456789',
	'1234567890',
	'qwerty',
	'qwerty123',
	'azerty',
	'azerty123',
	'abc123',
	'letmein',
	'welcome',
	'welcome1',
	'admin',
	'admin123',
	'login',
	'master',
	'hello',
	'freedom',
	'shadow',
	'sunshine',
	'princess',
	'dragon',
	'monkey',
	'football',
	'baseball',
	'soccer',
	'hockey',
	'batman',
	'superman',
	'trustno1',
	'iloveyou',
	'starwars',
	'passw0rd',
	'p@ssword',
	'p@ssw0rd',
	'changeme',
	'secret',
	'love',
	'hello123',
	'charlie',
	'donald',
	'michael',
	'jennifer',
	'jordan',
	'thomas',
	'hunter',
	'ranger',
	'buster',
	'killer',
	'george',
	'robert',
	'pepper',
	'daniel',
	'summer',
	'winter',
	'spring',
	'orange',
	'banana',
	'computer',
	'internet',
	'whatever',
	'nothing',
	'cheese',
	'chicken',
	'ginger',
	'flower',
	'mother',
	'father',
	'access',
	'matrix',
	'corvette',
	'ferrari',
	'mercedes',
	'porsche',
	'guitar',
	'purple',
	'yellow',
	'silver',
	'diamond',
	'maggie',
	'bailey',
	'cookie',
	'ashley',
	'nicole',
	'jessica',
	'michelle',
	'joshua',
	'andrew',
	'matthew',
	'amanda',
	'samantha',
	'anthony',
	'william',
	'richard',
];

interface PasswordValidationResult {
	isValid: boolean;
	error?: string;
}

export const validatePassword = (password: string): PasswordValidationResult => {
	// Vérifie la longueur minimale
	if (password.length < 8) {
		return { isValid: false, error: 'PASSWORD_TOO_SHORT' };
	}

	// Vérifie la présence d'une majuscule
	if (!/[A-Z]/.test(password)) {
		return { isValid: false, error: 'PASSWORD_NO_UPPERCASE' };
	}

	// Vérifie la présence d'une minuscule
	if (!/[a-z]/.test(password)) {
		return { isValid: false, error: 'PASSWORD_NO_LOWERCASE' };
	}

	// Vérifie la présence d'un chiffre
	if (!/\d/.test(password)) {
		return { isValid: false, error: 'PASSWORD_NO_NUMBER' };
	}

	// Vérifie que ce n'est pas un mot de passe courant
	if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
		return { isValid: false, error: 'PASSWORD_TOO_COMMON' };
	}

	return { isValid: true };
};
