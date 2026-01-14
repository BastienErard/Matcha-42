import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface GuestRouteProps {
	children: React.ReactNode;
}

export function GuestRoute({ children }: GuestRouteProps) {
	const { user, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className="min-h-screen bg-surface flex items-center justify-center">
				<div className="text-text-secondary">Chargement...</div>
			</div>
		);
	}

	// Déjà connecté → redirige vers discover
	if (user) {
		return <Navigate to="/discover" replace />;
	}

	return <>{children}</>;
}
