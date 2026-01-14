import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../../components/layout';
import { Button, Input } from '../../components/ui';
import { useTranslation } from '../../hooks/useTranslation';
import { resetPassword } from '../../api';

export function ResetPasswordPage() {
	const { t } = useTranslation();
	const { token } = useParams<{ token: string }>();

	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError('');

		if (!password || !confirmPassword) {
			setError('MISSING_REQUIRED_FIELDS');
			return;
		}

		if (password !== confirmPassword) {
			setError('PASSWORDS_DO_NOT_MATCH');
			return;
		}

		if (!token) {
			setError('INVALID_OR_EXPIRED_TOKEN');
			return;
		}

		setIsLoading(true);

		const result = await resetPassword(token, password);

		setIsLoading(false);

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
						<div className="text-6xl">✅</div>
						<h1 className="text-2xl font-bold text-text-primary">
							{t('auth.resetPasswordSuccess')}
						</h1>
						<Link
							to="/login"
							className="inline-block px-6 py-3 rounded-lg font-medium bg-primary hover:bg-primary-hover text-text-inverse"
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
							{t('auth.resetPasswordTitle')}
						</h1>
						<p className="mt-2 text-text-secondary">
							{t('auth.resetPasswordSubtitle')}
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
							id="password"
							label={t('auth.newPassword')}
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoComplete="new-password"
							disabled={isLoading}
						/>

						<Input
							id="confirmPassword"
							label={t('auth.confirmPassword')}
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
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
							{isLoading
								? t('auth.resetPasswordLoading')
								: t('auth.resetPasswordButton')}
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
