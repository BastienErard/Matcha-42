import nodemailer from 'nodemailer';
import { getEmailTemplate, Language } from '../templates/emails';

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: Number(process.env.SMTP_PORT) || 587,
	secure: false,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export const sendVerificationEmail = async (
	email: string,
	token: string,
	lang: Language = 'fr'
): Promise<void> => {
	const template = getEmailTemplate('verification', lang);
	const verificationUrl = `${FRONTEND_URL}/verify/${token}`;

	await transporter.sendMail({
		from: process.env.SMTP_FROM,
		to: email,
		subject: template.subject,
		html: template.html(verificationUrl),
	});
};

export const sendResetPasswordEmail = async (
	email: string,
	token: string,
	lang: Language = 'fr'
): Promise<void> => {
	const template = getEmailTemplate('resetPassword', lang);
	const resetUrl = `${FRONTEND_URL}/reset-password/${token}`;

	await transporter.sendMail({
		from: process.env.SMTP_FROM,
		to: email,
		subject: template.subject,
		html: template.html(resetUrl),
	});
};
