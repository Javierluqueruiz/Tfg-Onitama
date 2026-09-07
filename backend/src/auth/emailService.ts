import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.resendApiKey);

export async function sendVerificationEmail(to: string, verificationUrl: string) {
    await resend.emails.send({
        from: env.emailFrom,
        to,
        subject: 'Verifica tu correo',
        html: `
            <p>Gracias por registrarte en Onitama</p>
            <p>Por favor, haz clic en el siguiente enlace para verificar tu correo electrónico:</p>
            <a href="${verificationUrl}">Verificar correo</a>
        `
    }); 
}