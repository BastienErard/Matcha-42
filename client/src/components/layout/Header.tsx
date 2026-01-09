import { useTranslation } from '../../hooks/useTranslation';

type HeaderVariant = 'guest' | 'onboarding' | 'authenticated';

interface HeaderProps {
	variant?: HeaderVariant;
}

export function Header({ variant = 'guest' }: HeaderProps) {
	const { t } = useTranslation();

	return (
		<header className="border-b border-border bg-surface-elevated">
			<div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
				{/* Logo */}
				<div className="flex items-center gap-2">
					<span className="text-2xl">🔥</span>
					<span className="text-xl font-bold text-text-primary">Matcha</span>
				</div>

				{/* Navigation conditionnelle selon l'état */}
				{variant === 'onboarding' && (
					<button className="text-text-secondary hover:text-text-primary text-sm">
						{t('auth.quit')}
					</button>
				)}

				{variant === 'authenticated' && (
					<div className="flex items-center gap-6">
						{/* Navigation principale */}
						<nav className="hidden md:flex items-center gap-4">
							<a
								href="/discover"
								className="text-text-secondary hover:text-text-primary"
							>
								{t('nav.discover')}
							</a>
							<a
								href="/search"
								className="text-text-secondary hover:text-text-primary"
							>
								{t('nav.search')}
							</a>
							<a
								href="/messages"
								className="text-text-secondary hover:text-text-primary"
							>
								{t('nav.messages')}
							</a>
						</nav>

						{/* Notifications + Profil */}
						<div className="flex items-center gap-4">
							<button className="relative text-text-secondary hover:text-text-primary">
								<svg
									className="w-6 h-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
									/>
								</svg>
								{/* Badge notifications (exemple statique) */}
								<span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-text-inverse text-xs rounded-full flex items-center justify-center">
									3
								</span>
							</button>

							<a
								href="/profile"
								className="text-text-secondary hover:text-text-primary font-medium"
							>
								{t('nav.profile')}
							</a>
						</div>
					</div>
				)}
			</div>
		</header>
	);
}
