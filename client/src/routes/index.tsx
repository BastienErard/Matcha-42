import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Pages temporaires (on les créera ensuite)
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export function AppRouter() {
	return (
		<BrowserRouter>
			<Routes>
				{/* Routes publiques */}
				<Route path="/" element={<HomePage />} />
				<Route path="/login" element={<LoginPage />} />
				<Route path="/register" element={<RegisterPage />} />

				{/* 404 - en dernier */}
				<Route path="*" element={<NotFoundPage />} />
			</Routes>
		</BrowserRouter>
	);
}
