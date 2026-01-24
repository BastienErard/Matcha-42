import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../hooks/useAuth';
import { NotificationDropdown } from '../common';

type HeaderVariant = 'guest' | 'onboarding' | 'authenticated';

interface HeaderProps {
	variant?: HeaderVariant;
}

export function Header({ variant = 'guest' }: HeaderProps) {
	const { t } = useTranslation();
	const { user, logout } = useAuth();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const logoDestination = user ? '/discover' : '/';

	const navLinkClasses = 'text-text-secondary hover:text-primary transition-colors duration-200';
	const textButtonClasses =
		'text-text-secondary hover:text-primary transition-colors duration-200 underline-offset-4 hover:underline';

	const mobileNavLinkClasses =
		'block py-3 text-text-primary hover:text-primary transition-colors duration-200 text-lg';

	function closeMobileMenu() {
		setIsMobileMenuOpen(false);
	}

	return (
		<header className="border-b border-border bg-surface-elevated relative z-50">
			<div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
				{/* Logo */}
				<Link
					to={logoDestination}
					className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-200"
					onClick={closeMobileMenu}
				>
					<span className="text-2xl">🔥</span>
					<span className="text-xl font-bold text-text-primary">Matcha</span>
				</Link>

				{/* Onboarding : juste logout */}
				{variant === 'onboarding' && (
					<button onClick={logout} className={textButtonClasses}>
						{t('auth.logout')}
					</button>
				)}

				{/* Authenticated : navigation complète */}
				{variant === 'authenticated' && (
					<>
						{/* Desktop navigation */}
						<div className="hidden md:flex items-center gap-6">
							<nav className="flex items-center gap-4">
								<Link to="/discover" className={navLinkClasses}>
									{t('nav.discover')}
								</Link>
								<Link to="/messages" className={navLinkClasses}>
									{t('nav.messages')}
								</Link>
							</nav>

							<div className="flex items-center gap-4">
								{/* Notifications */}
								<NotificationDropdown />

								<Link to="/profile" className={navLinkClasses + ' font-medium'}>
									{t('nav.profile')}
								</Link>

								<button onClick={logout} className={textButtonClasses}>
									{t('auth.logout')}
								</button>
							</div>
						</div>

						{/* Mobile : Notifications + Burger */}
						<div className="flex md:hidden items-center gap-3">
							{/* Notifications (toujours visible) */}
							<NotificationDropdown />

							{/* Menu burger */}
							<button
								onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
								className="p-2 text-text-secondary hover:text-primary transition-colors duration-200"
								aria-label={t('nav.menu')}
							>
								{isMobileMenuOpen ? (
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
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								) : (
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
											d="M4 6h16M4 12h16M4 18h16"
										/>
									</svg>
								)}
							</button>
						</div>
					</>
				)}
			</div>

			{/* Mobile menu dropdown */}
			{variant === 'authenticated' && isMobileMenuOpen && (
				<>
					{/* Overlay */}
					<div
						className="fixed inset-0 bg-black/50 md:hidden z-40"
						onClick={closeMobileMenu}
					/>

					{/* Menu */}
					<nav className="absolute top-full left-0 right-0 bg-surface-elevated border-b border-border md:hidden z-50 shadow-lg">
						<div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
							<Link
								to="/discover"
								className={mobileNavLinkClasses}
								onClick={closeMobileMenu}
							>
								{t('nav.discover')}
							</Link>
							<Link
								to="/messages"
								className={mobileNavLinkClasses}
								onClick={closeMobileMenu}
							>
								{t('nav.messages')}
							</Link>
							<Link
								to="/profile"
								className={mobileNavLinkClasses}
								onClick={closeMobileMenu}
							>
								{t('nav.profile')}
							</Link>

							<div className="pt-3 mt-3 border-t border-border">
								<button
									onClick={() => {
										closeMobileMenu();
										logout();
									}}
									className="block py-3 text-error hover:text-error/80 transition-colors duration-200 text-lg"
								>
									{t('auth.logout')}
								</button>
							</div>
						</div>
					</nav>
				</>
			)}
		</header>
	);
}
