import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
	children: React.ReactNode;
	requiresOnboarding?: boolean;
}

export function ProtectedRoute({ children, requiresOnboarding = true }: ProtectedRouteProps) {
	const { user, isLoading, hasCompletedOnboarding } = useAuth();
	const location = useLocation();

	if (isLoading) {
		return (
			<div className="min-h-screen bg-surface flex items-center justify-center">
				<div className="text-text-secondary">Chargement...</div>
			</div>
		);
	}

	// Non connecté → redirige vers login
	if (!user) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	// Onboarding non terminé et route qui le requiert → redirige vers onboarding
	if (requiresOnboarding && !hasCompletedOnboarding && location.pathname !== '/onboarding') {
		return <Navigate to="/onboarding" replace />;
	}

	return <>{children}</>;
}
