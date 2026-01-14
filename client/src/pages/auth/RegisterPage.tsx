import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/layout';
import { Button, Input } from '../../components/ui';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../hooks/useAuth';

export function RegisterPage() {
	const { t, language } = useTranslation();
	const { register } = useAuth();

	// État du formulaire
	const [formData, setFormData] = useState({
		email: '',
		username: '',
		firstName: '',
		lastName: '',
		password: '',
		confirmPassword: '',
	});

	// État UI
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError('');

		// Validation
		const { email, username, firstName, lastName, password, confirmPassword } = formData;

		if (!email || !username || !firstName || !lastName || !password || !confirmPassword) {
			setError('MISSING_REQUIRED_FIELDS');
			return;
		}

		const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
		if (!usernameRegex.test(username)) {
			setError('INVALID_USERNAME_FORMAT');
			return;
		}

		if (password !== confirmPassword) {
			setError('PASSWORDS_DO_NOT_MATCH');
			return;
		}

		setIsLoading(true);

		const result = await register({
			email: email.trim(),
			username: username.trim(),
			firstName: firstName.trim(),
			lastName: lastName.trim(),
			password,
			language,
		});

		setIsLoading(false);

		if (result.success) {
			setSuccess(true);
		} else {
			setError(result.error || 'SERVER_ERROR');
		}
	}

	// Affichage succès
	if (success) {
		return (
			<Layout variant="guest">
				<div className="flex-1 flex items-center justify-center px-4 py-12">
					<div className="w-full max-w-md text-center space-y-6">
						<div className="text-6xl">📧</div>
						<h1 className="text-2xl font-bold text-text-primary">
							{t('auth.verifyEmail')}
						</h1>
						<p className="text-text-secondary">{t('auth.registerSuccess')}</p>
						<Link
							to="/login"
							className="inline-block text-primary hover:text-primary-hover font-medium"
						>
							{t('auth.login')}
						</Link>
					</div>
				</div>
			</Layout>
		);
	}

	return (
		<Layout variant="guest">
			<div className="flex-1 flex items-center justify-center px-4 py-12">
				<div className="w-full max-w-md space-y-8">
					{/* En-tête */}
					<div className="text-center">
						<h1 className="text-3xl font-bold text-text-primary">
							{t('auth.registerTitle')}
						</h1>
						<p className="mt-2 text-text-secondary">{t('auth.registerSubtitle')}</p>
					</div>

					{/* Formulaire */}
					<form
						onSubmit={handleSubmit}
						className="bg-surface-elevated border border-border rounded-xl p-8 space-y-5"
					>
						{/* Erreur globale */}
						{error && (
							<div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
								{t(`errors.${error}`)}
							</div>
						)}

						{/* Prénom / Nom sur la même ligne */}
						<div className="grid grid-cols-2 gap-4">
							<Input
								id="firstName"
								name="firstName"
								label={t('auth.firstName')}
								type="text"
								value={formData.firstName}
								onChange={handleChange}
								autoComplete="given-name"
								disabled={isLoading}
							/>
							<Input
								id="lastName"
								name="lastName"
								label={t('auth.lastName')}
								type="text"
								value={formData.lastName}
								onChange={handleChange}
								autoComplete="family-name"
								disabled={isLoading}
							/>
						</div>

						<Input
							id="username"
							name="username"
							label={t('auth.username')}
							type="text"
							value={formData.username}
							onChange={handleChange}
							autoComplete="username"
							disabled={isLoading}
						/>

						<Input
							id="email"
							name="email"
							label={t('auth.email')}
							type="email"
							value={formData.email}
							onChange={handleChange}
							autoComplete="email"
							disabled={isLoading}
						/>

						<Input
							id="password"
							name="password"
							label={t('auth.password')}
							type="password"
							value={formData.password}
							onChange={handleChange}
							autoComplete="new-password"
							disabled={isLoading}
						/>

						<Input
							id="confirmPassword"
							name="confirmPassword"
							label={t('auth.confirmPassword')}
							type="password"
							value={formData.confirmPassword}
							onChange={handleChange}
							autoComplete="new-password"
							disabled={isLoading}
						/>

						<Button
							type="submit"
							variant="primary"
							size="lg"
							isLoading={isLoading}
							className="w-full"
						>
							{isLoading ? t('auth.registerLoading') : t('auth.registerButton')}
						</Button>

						<p className="text-center text-text-secondary text-sm">
							{t('auth.hasAccount')}{' '}
							<Link
								to="/login"
								className="text-primary hover:text-primary-hover font-medium"
							>
								{t('auth.login')}
							</Link>
						</p>
					</form>
				</div>
			</div>
		</Layout>
	);
}
