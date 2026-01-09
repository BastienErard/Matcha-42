import { type ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

type LayoutVariant = 'guest' | 'onboarding' | 'authenticated';

interface LayoutProps {
	children: ReactNode;
	variant?: LayoutVariant;
}

export function Layout({ children, variant = 'guest' }: LayoutProps) {
	return (
		<div className="min-h-screen flex flex-col bg-surface">
			<Header variant={variant} />

			{/* Contenu principal : flex-1 prend tout l'espace restant */}
			<main className="flex-1">{children}</main>

			<Footer />
		</div>
	);
}
