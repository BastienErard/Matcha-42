import { Link } from 'react-router-dom'
import { Layout } from '../components/layout'
import { useTranslation } from '../hooks/useTranslation'

export function HomePage() {
  const { t } = useTranslation()

  return (
    <Layout variant="guest">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="text-center space-y-8 max-w-md">
          <h1 className="text-5xl font-bold text-text-primary">Matcha</h1>
          <p className="text-xl text-text-secondary">{t('landing.tagline')}</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="px-8 py-3 rounded-lg font-medium text-lg border border-border text-text-primary hover:bg-surface-muted"
            >
              {t('auth.login')}
            </Link>
            <Link
              to="/register"
              className="px-8 py-3 rounded-lg font-medium text-lg bg-primary hover:bg-primary-hover text-text-inverse"
            >
              {t('auth.register')}
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
