import sanitizeHtml from 'sanitize-html';

// Configuration stricte : supprime TOUT le HTML
const strictOptions: sanitizeHtml.IOptions = {
	allowedTags: [],
	allowedAttributes: {},
	disallowedTagsMode: 'discard',
};

// Nettoie une chaîne en supprimant tout HTML/script
export const sanitizeInput = (input: string): string => {
	if (!input || typeof input !== 'string') {
		return input;
	}
	return sanitizeHtml(input, strictOptions).trim();
};

// Nettoie un objet en appliquant sanitizeInput à tous les champs string
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
	const sanitized = { ...obj };

	for (const key in sanitized) {
		if (typeof sanitized[key] === 'string') {
			sanitized[key] = sanitizeInput(sanitized[key]) as T[typeof key];
		}
	}

	return sanitized;
};

// Nettoie un tableau de strings
export const sanitizeArray = (arr: string[]): string[] => {
	if (!Array.isArray(arr)) {
		return arr;
	}
	return arr.map((item) => (typeof item === 'string' ? sanitizeInput(item) : item));
};
