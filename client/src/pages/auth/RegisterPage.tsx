import { Link } from 'react-router-dom'
import { Layout } from '../../components/layout'
import { useTranslation } from '../../hooks/useTranslation'

export function RegisterPage() {
  const { t } = useTranslation()

  return (
    <Layout variant="guest">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-text-primary">{t('auth.register')}</h1>
          </div>

          <div className="bg-surface-elevated border border-border rounded-xl p-8 space-y-6">
            <p className="text-text-secondary text-center">
              Formulaire à venir...
            </p>

            <Link
              to="/"
              className="block text-center text-text-muted hover:text-primary text-sm"
            >
              {t('common.back')}
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
