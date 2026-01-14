import { Layout } from '../../components/layout';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../hooks/useAuth';

export function DiscoverPage() {
	const { t } = useTranslation();
	const { user } = useAuth();

	return (
		<Layout variant="authenticated">
			<div className="max-w-7xl mx-auto px-4 py-12">
				<div className="text-center space-y-6">
					<h1 className="text-3xl font-bold text-text-primary">{t('nav.discover')}</h1>
					<p className="text-text-secondary">
						Bienvenue {user?.firstName} ! Cette page affichera bientôt les profils
						suggérés.
					</p>
				</div>
			</div>
		</Layout>
	);
}
