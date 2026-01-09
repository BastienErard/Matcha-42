import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';

export function Footer() {
	const { theme, toggleTheme } = useTheme();
	const { language, setLanguage, t } = useTranslation();

	return (
		<footer className="border-t border-border bg-surface-elevated">
			<div className="max-w-7xl mx-auto px-4 py-4">
				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					{/* Copyright */}
					<p className="text-text-muted text-sm">{t('footer.copyright')}</p>

					{/* Message central */}
					<p className="text-text-secondary text-sm">{t('footer.madeWith')}</p>

					{/* Toggles */}
					<div className="flex items-center gap-2">
						{/* Toggle thème */}
						<button
							onClick={toggleTheme}
							className="p-2 rounded-lg hover:bg-surface-muted text-text-secondary hover:text-text-primary"
							aria-label={t('theme.toggle')}
						>
							{theme === 'light' ? (
								<svg
									className="w-5 h-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
									/>
								</svg>
							) : (
								<svg
									className="w-5 h-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
									/>
								</svg>
							)}
						</button>

						{/* Toggle langue */}
						<button
							onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
							className="px-2 py-1 rounded-lg hover:bg-surface-muted text-sm font-medium text-text-secondary hover:text-text-primary"
						>
							{language === 'fr' ? '🇫🇷' : '🇬🇧'}
						</button>
					</div>
				</div>
			</div>
		</footer>
	);
}
