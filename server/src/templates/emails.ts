type Language = 'fr' | 'en';

interface EmailTemplate {
	subject: string;
	html: (url: string) => string;
}

interface EmailTemplates {
	verification: EmailTemplate;
	resetPassword: EmailTemplate;
}

const templates: Record<Language, EmailTemplates> = {
	fr: {
		verification: {
			subject: 'Matcha - Vérifiez votre compte',
			html: (url: string) => `
				<h1>Bienvenue sur Matcha !</h1>
				<p>Cliquez sur le lien ci-dessous pour vérifier votre compte :</p>
				<a href="${url}">${url}</a>
				<p>Ce lien est valide pendant 24 heures.</p>
				<p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
			`,
		},
		resetPassword: {
			subject: 'Matcha - Réinitialisation de mot de passe',
			html: (url: string) => `
				<h1>Réinitialisation de mot de passe</h1>
				<p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
				<a href="${url}">${url}</a>
				<p>Ce lien est valide pendant 1 heure.</p>
				<p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
			`,
		},
	},
	en: {
		verification: {
			subject: 'Matcha - Verify your account',
			html: (url: string) => `
				<h1>Welcome to Matcha!</h1>
				<p>Click the link below to verify your account:</p>
				<a href="${url}">${url}</a>
				<p>This link is valid for 24 hours.</p>
				<p>If you did not create an account, please ignore this email.</p>
			`,
		},
		resetPassword: {
			subject: 'Matcha - Password reset',
			html: (url: string) => `
				<h1>Password Reset</h1>
				<p>Click the link below to reset your password:</p>
				<a href="${url}">${url}</a>
				<p>This link is valid for 1 hour.</p>
				<p>If you did not request this reset, please ignore this email.</p>
			`,
		},
	},
};

export const getEmailTemplate = (
	type: keyof EmailTemplates,
	lang: Language = 'fr'
): EmailTemplate => {
	return templates[lang][type];
};

export type { Language };
