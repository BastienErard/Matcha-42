import { createContext, useState, useCallback, type ReactNode } from 'react';
import fr from '../i18n/fr.json';
import en from '../i18n/en.json';

// Types possibles pour la langue
type Language = 'fr' | 'en';

// Structure des fichiers de traduction
type Translations = typeof fr;

// Ce que le Context offre aux composants
interface LanguageContextType {
	language: Language;
	setLanguage: (lang: Language) => void;
	t: (key: string, params?: Record<string, string | number>) => string;
}

// Les traductions indexées par langue
const translations: Record<Language, Translations> = { fr, en };

export const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
	// Initialise depuis localStorage ou préférence navigateur
	const [language, setLanguageState] = useState<Language>(() => {
		const stored = localStorage.getItem('matcha-language') as Language | null;
		if (stored && (stored === 'fr' || stored === 'en')) return stored;

		// Détecte la langue du navigateur (fr-FR → fr)
		const browserLang = navigator.language.split('-')[0];
		return browserLang === 'fr' ? 'fr' : 'en';
	});

	// Change la langue et persiste le choix
	const setLanguage = useCallback((lang: Language) => {
		setLanguageState(lang);
		localStorage.setItem('matcha-language', lang);
		document.documentElement.lang = lang;
	}, []);

	// Fonction de traduction
	const t = useCallback(
		(key: string, params?: Record<string, string | number>): string => {
			const keys = key.split('.');
			let value: unknown = translations[language];

			for (const k of keys) {
				if (value && typeof value === 'object' && k in value) {
					value = (value as Record<string, unknown>)[k];
				} else {
					console.warn(`Translation missing: ${key}`);
					return key;
				}
			}

			if (typeof value !== 'string') return key;

			// Remplace les {{variable}} par leurs valeurs
			if (params) {
				return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
					return params[paramKey]?.toString() || '';
				});
			}

			return value;
		},
		[language]
	);

	return (
		<LanguageContext.Provider value={{ language, setLanguage, t }}>
			{children}
		</LanguageContext.Provider>
	);
}
