import { env } from '../config/env';

export async function verifyCaptcha(token: string): Promise<boolean> {
    if (!token) {
        return false;
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            secret: env.turnstileSecretKey ?? '',
            response: token,
        }),
    })

    const data = await response.json();
    return data.success === true;
}