import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { ProtectedRoute } from './ProtectedRoute';
import { GuestRoute } from './GuestRoute';

// Pages publiques
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';

// Pages auth (guest only)
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { VerifyEmailPage } from '../pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';

// Pages protégées (authenticated only)
import { DiscoverPage } from '../pages/browse/DiscoverPage';

export function AppRouter() {
	return (
		<BrowserRouter>
			<Routes>
				{/* Page d'accueil : redirige vers /discover si connecté */}
				<Route
					path="/"
					element={
						<GuestRoute>
							<HomePage />
						</GuestRoute>
					}
				/>

				{/* Routes guest (déconnectés uniquement) */}
				<Route
					path="/login"
					element={
						<GuestRoute>
							<LoginPage />
						</GuestRoute>
					}
				/>
				<Route
					path="/register"
					element={
						<GuestRoute>
							<RegisterPage />
						</GuestRoute>
					}
				/>
				<Route
					path="/forgot-password"
					element={
						<GuestRoute>
							<ForgotPasswordPage />
						</GuestRoute>
					}
				/>
				<Route
					path="/reset-password/:token"
					element={
						<GuestRoute>
							<ResetPasswordPage />
						</GuestRoute>
					}
				/>

				{/* Vérification email (accessible à tous) */}
				<Route path="/verify/:token" element={<VerifyEmailPage />} />

				{/* Routes protégées (connectés uniquement) */}
				<Route
					path="/discover"
					element={
						<ProtectedRoute>
							<DiscoverPage />
						</ProtectedRoute>
					}
				/>

				{/* 404 */}
				<Route path="*" element={<NotFoundPage />} />
			</Routes>
		</BrowserRouter>
	);
}
