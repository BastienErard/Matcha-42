import { Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../hooks/useAuth';

type HeaderVariant = 'guest' | 'onboarding' | 'authenticated';

interface HeaderProps {
	variant?: HeaderVariant;
}

export function Header({ variant = 'guest' }: HeaderProps) {
	const { t } = useTranslation();
	const { user, logout } = useAuth();

	const logoDestination = user ? '/discover' : '/';

	// Classes communes pour les liens de navigation
	const navLinkClasses = 'text-text-secondary hover:text-primary transition-colors duration-200';

	// Classes pour les boutons texte
	const textButtonClasses =
		'text-text-secondary hover:text-primary transition-colors duration-200 underline-offset-4 hover:underline';

	return (
		<header className="border-b border-border bg-surface-elevated">
			<div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
				{/* Logo cliquable */}
				<Link
					to={logoDestination}
					className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-200"
				>
					<span className="text-2xl">🔥</span>
					<span className="text-xl font-bold text-text-primary">Matcha</span>
				</Link>

				{/* Navigation conditionnelle selon l'état */}
				{variant === 'onboarding' && (
					<button onClick={logout} className={textButtonClasses}>
						{t('auth.logout')}
					</button>
				)}

				{variant === 'authenticated' && (
					<div className="flex items-center gap-6">
						{/* Navigation principale */}
						<nav className="hidden md:flex items-center gap-4">
							<Link to="/discover" className={navLinkClasses}>
								{t('nav.discover')}
							</Link>
							<Link to="/messages" className={navLinkClasses}>
								{t('nav.messages')}
							</Link>
						</nav>

						{/* Notifications + Profil + Déconnexion */}
						<div className="flex items-center gap-4">
							<button className="relative text-text-secondary hover:text-primary transition-colors duration-200">
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
								<span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-text-inverse text-xs rounded-full flex items-center justify-center">
									3
								</span>
							</button>

							<Link to="/profile" className={navLinkClasses + ' font-medium'}>
								{t('nav.profile')}
							</Link>

							<button onClick={logout} className={textButtonClasses}>
								{t('auth.logout')}
							</button>
						</div>
					</div>
				)}
			</div>
		</header>
	);
}
