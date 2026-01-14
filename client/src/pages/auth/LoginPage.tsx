import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '../../components/layout';
import { Button, Input } from '../../components/ui';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../hooks/useAuth';

export function LoginPage() {
	const { t } = useTranslation();
	const { login } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	// État du formulaire
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');

	// État UI
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError('');

		if (!username.trim() || !password) {
			setError('MISSING_REQUIRED_FIELDS');
			return;
		}

		setIsLoading(true);

		const result = await login(username.trim(), password);

		setIsLoading(false);

		if (result.success) {
			// Redirige vers la page demandée initialement, ou /discover par défaut
			const from = location.state?.from?.pathname || '/discover';
			navigate(from, { replace: true });
		} else {
			setError(result.error || 'SERVER_ERROR');
		}
	}

	return (
		<Layout variant="guest">
			<div className="flex-1 flex items-center justify-center px-4 py-12">
				<div className="w-full max-w-md space-y-8">
					{/* En-tête */}
					<div className="text-center">
						<h1 className="text-3xl font-bold text-text-primary">
							{t('auth.loginTitle')}
						</h1>
						<p className="mt-2 text-text-secondary">{t('auth.loginSubtitle')}</p>
					</div>

					{/* Formulaire */}
					<form
						onSubmit={handleSubmit}
						className="bg-surface-elevated border border-border rounded-xl p-8 space-y-6"
					>
						{/* Erreur globale */}
						{error && (
							<div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
								{t(`errors.${error}`)}
							</div>
						)}

						<Input
							id="username"
							label={t('auth.username')}
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder={t('auth.username')}
							autoComplete="username"
							disabled={isLoading}
						/>

						<Input
							id="password"
							label={t('auth.password')}
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder={t('auth.password')}
							autoComplete="current-password"
							disabled={isLoading}
						/>

						<div className="flex items-center justify-end">
							<Link
								to="/forgot-password"
								className="text-sm text-primary hover:text-primary-hover"
							>
								{t('auth.forgotPassword')}
							</Link>
						</div>

						<Button
							type="submit"
							variant="primary"
							size="lg"
							isLoading={isLoading}
							className="w-full"
						>
							{isLoading ? t('auth.loginLoading') : t('auth.loginButton')}
						</Button>

						<p className="text-center text-text-secondary text-sm">
							{t('auth.noAccount')}{' '}
							<Link
								to="/register"
								className="text-primary hover:text-primary-hover font-medium"
							>
								{t('auth.register')}
							</Link>
						</p>
					</form>
				</div>
			</div>
		</Layout>
	);
}
