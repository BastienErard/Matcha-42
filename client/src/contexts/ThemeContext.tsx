import { createContext, useEffect, useState, type ReactNode } from 'react';
type Theme = 'light' | 'dark';

interface ThemeContextType {
	theme: Theme;
	toggleTheme: () => void;
}

// Valeur par défaut (jamais utilisée si le Provider englobe l'app)
export const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
	// Initialise depuis localStorage ou préférence système
	const [theme, setTheme] = useState<Theme>(() => {
		const stored = localStorage.getItem('matcha-theme') as Theme | null;
		if (stored) return stored;

		// Respecte la préférence OS (dark mode système)
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	});

	// Applique la classe .dark sur <html> et persiste le choix
	useEffect(() => {
		const root = document.documentElement;

		if (theme === 'dark') {
			root.classList.add('dark');
		} else {
			root.classList.remove('dark');
		}

		localStorage.setItem('matcha-theme', theme);
	}, [theme]);

	const toggleTheme = () => {
		setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
	};

	return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
