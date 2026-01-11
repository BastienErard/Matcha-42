import { Link } from 'react-router-dom';
import { Layout } from '../components/layout';
import { useTranslation } from '../hooks/useTranslation';

export function NotFoundPage() {
	const { t } = useTranslation();

	return (
		<Layout variant="guest">
			<div className="flex-1 flex items-center justify-center px-4 py-12">
				<div className="text-center space-y-6">
					<p className="text-8xl font-bold text-primary">404</p>
					<h1 className="text-2xl font-bold text-text-primary">{t('notFound.title')}</h1>
					<p className="text-text-secondary">{t('notFound.message')}</p>

					<Link
						to="/"
						className="inline-block px-6 py-3 rounded-lg font-medium bg-primary hover:bg-primary-hover text-text-inverse"
					>
						{t('common.back')}
					</Link>
				</div>
			</div>
		</Layout>
	);
}
