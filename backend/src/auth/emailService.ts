import { env } from '../config/env';

// Brevo ofrece una API HTTP para mandar correo transaccional -- viaja por el puerto 443,
// como cualquier petición normal, y evita el bloqueo de SMTP saliente hacia Gmail que
// sufría la versión anterior desde la red de Render (ver bitácora del proyecto:
// ENETUNREACH con IPv6, y después ETIMEDOUT incluso forzando IPv4 y probando el puerto 587).
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

async function sendEmail(to: string, subject: string, htmlContent: string): Promise<void> {
    const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': env.brevoApiKey ?? '',
        },
        body: JSON.stringify({
            sender: { email: env.gmailUser },
            to: [{ email: to }],
            subject,
            htmlContent,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Brevo respondió ${response.status}: ${errorBody}`);
    }
}

export async function sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
    await sendEmail(to, 'Verifica tu cuenta de Onitama', `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background-color: #f6efdc; border-radius: 12px; border: 1px solid #c79a4b;">
            <h2 style="color: #2c2417; margin-top: 0;">⛩️ Onitama</h2>
            <p style="color: #2c2417; font-size: 15px; line-height: 1.5;">
                Gracias por registrarte. Confirma tu correo electrónico haciendo clic en el siguiente botón
                (el enlace caduca en 24 horas):
            </p>
            <p style="text-align: center; margin: 32px 0;">
                <a href="${verificationUrl}"
                   style="background-color: #3f6d57; color: #f6efdc; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                    Verificar mi correo
                </a>
            </p>
            <p style="color: #5b4c34; font-size: 13px;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                <a href="${verificationUrl}" style="color: #3f6d57; word-break: break-all;">${verificationUrl}</a>
            </p>
        </div>
    `);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    await sendEmail(to, 'Restablece tu contraseña de Onitama', `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background-color: #f6efdc; border-radius: 12px; border: 1px solid #c79a4b;">
            <h2 style="color: #2c2417; margin-top: 0;">⛩️ Onitama</h2>
            <p style="color: #2c2417; font-size: 15px; line-height: 1.5;">
                Hemos recibido una solicitud para restablecer tu contraseña. Si no has sido tú, ignora este correo.
                El enlace caduca en 1 hora.
            </p>
            <p style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}"
                   style="background-color: #a8503a; color: #f6efdc; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                    Restablecer mi contraseña
                </a>
            </p>
            <p style="color: #5b4c34; font-size: 13px;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                <a href="${resetUrl}" style="color: #a8503a; word-break: break-all;">${resetUrl}</a>
            </p>
        </div>
    `);
}

export async function sendVerifyBeforeResetEmail(to: string, verificationUrl: string): Promise<void> {
    await sendEmail(to, 'Verifica tu correo antes de restablecer tu contraseña', `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background-color: #f6efdc; border-radius: 12px; border: 1px solid #c79a4b;">
            <h2 style="color: #2c2417; margin-top: 0;">⛩️ Onitama</h2>
            <p style="color: #2c2417; font-size: 15px; line-height: 1.5;">
                Has solicitado restablecer tu contraseña, pero tu cuenta todavía no tiene el correo verificado.
                Verifícalo primero con el siguiente botón; después podrás solicitar el restablecimiento de nuevo.
            </p>
            <p style="text-align: center; margin: 32px 0;">
                <a href="${verificationUrl}"
                   style="background-color: #3f6d57; color: #f6efdc; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                    Verificar mi correo
                </a>
            </p>
            <p style="color: #5b4c34; font-size: 13px;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                <a href="${verificationUrl}" style="color: #3f6d57; word-break: break-all;">${verificationUrl}</a>
            </p>
        </div>
    `);
}
