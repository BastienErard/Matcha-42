import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../../components/layout';
import { useTranslation } from '../../hooks/useTranslation';
import { verifyEmail } from '../../api';

type VerifyStatus = 'loading' | 'success' | 'error';

export function VerifyEmailPage() {
	const { t } = useTranslation();
	const { token } = useParams<{ token: string }>();

	const [status, setStatus] = useState<VerifyStatus>('loading');

	// Évite le double appel en StrictMode
	const hasVerified = useRef(false);

	useEffect(() => {
		async function verify() {
			// Si déjà vérifié, on ne refait pas l'appel
			if (hasVerified.current) return;
			hasVerified.current = true;

			if (!token) {
				setStatus('error');
				return;
			}

			const result = await verifyEmail(token);
			setStatus(result.success ? 'success' : 'error');
		}

		verify();
	}, [token]);

	return (
		<Layout variant="guest">
			<div className="flex-1 flex items-center justify-center px-4 py-12">
				<div className="w-full max-w-md text-center space-y-6">
					{status === 'loading' && (
						<>
							<div className="text-6xl">⏳</div>
							<h1 className="text-2xl font-bold text-text-primary">
								{t('common.loading')}
							</h1>
						</>
					)}

					{status === 'success' && (
						<>
							<div className="text-6xl">✅</div>
							<h1 className="text-2xl font-bold text-text-primary">
								{t('auth.emailVerified')}
							</h1>
							<p className="text-text-secondary">{t('auth.emailVerifiedMessage')}</p>
							<Link
								to="/login"
								className="inline-block px-6 py-3 rounded-lg font-medium bg-primary hover:bg-primary-hover text-text-inverse"
							>
								{t('auth.login')}
							</Link>
						</>
					)}

					{status === 'error' && (
						<>
							<div className="text-6xl">❌</div>
							<h1 className="text-2xl font-bold text-text-primary">
								{t('auth.emailVerificationFailed')}
							</h1>
							<p className="text-text-secondary">
								{t('errors.INVALID_OR_EXPIRED_TOKEN')}
							</p>
							<Link
								to="/"
								className="inline-block px-6 py-3 rounded-lg font-medium bg-primary hover:bg-primary-hover text-text-inverse"
							>
								{t('common.back')}
							</Link>
						</>
					)}
				</div>
			</div>
		</Layout>
	);
}
