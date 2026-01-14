import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../components/layout';
import { Button, Input } from '../../components/ui';
import { useTranslation } from '../../hooks/useTranslation';
import { forgotPassword } from '../../api';

export function ForgotPasswordPage() {
	const { t } = useTranslation();

	const [email, setEmail] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError('');

		if (!email.trim()) {
			setError('MISSING_REQUIRED_FIELDS');
			return;
		}

		setIsLoading(true);

		const result = await forgotPassword(email.trim());

		setIsLoading(false);

		// Succès pour ne pas révéler si l'email existe
		if (result.success) {
			setSuccess(true);
		} else {
			setError(result.error?.code || 'SERVER_ERROR');
		}
	}

	if (success) {
		return (
			<Layout variant="guest">
				<div className="flex-1 flex items-center justify-center px-4 py-12">
					<div className="w-full max-w-md text-center space-y-6">
						<div className="text-6xl">📧</div>
						<h1 className="text-2xl font-bold text-text-primary">
							{t('auth.verifyEmail')}
						</h1>
						<p className="text-text-secondary">{t('auth.forgotPasswordSuccess')}</p>
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
					<div className="text-center">
						<h1 className="text-3xl font-bold text-text-primary">
							{t('auth.forgotPasswordTitle')}
						</h1>
						<p className="mt-2 text-text-secondary">
							{t('auth.forgotPasswordSubtitle')}
						</p>
					</div>

					<form
						onSubmit={handleSubmit}
						className="bg-surface-elevated border border-border rounded-xl p-8 space-y-6"
					>
						{error && (
							<div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
								{t(`errors.${error}`)}
							</div>
						)}

						<Input
							id="email"
							label={t('auth.email')}
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder={t('auth.email')}
							autoComplete="email"
							disabled={isLoading}
						/>

						<Button
							type="submit"
							variant="primary"
							size="lg"
							isLoading={isLoading}
							className="w-full"
						>
							{isLoading
								? t('auth.forgotPasswordLoading')
								: t('auth.forgotPasswordButton')}
						</Button>

						<p className="text-center text-text-secondary text-sm">
							<Link
								to="/login"
								className="text-primary hover:text-primary-hover font-medium"
							>
								{t('common.back')}
							</Link>
						</p>
					</form>
				</div>
			</div>
		</Layout>
	);
}
