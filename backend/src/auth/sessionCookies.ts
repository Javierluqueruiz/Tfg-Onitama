import { Response } from 'express';
import ms from 'ms';
import { env } from '../config/env';

const isProduction = process.env.NODE_ENV === 'production';

export function setSessionCookie(res: Response, token: string): void {
    res.cookie('token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: ms(env.jwtExpiresIn as Parameters<typeof ms>[0]),
    });
}

export function clearSessionCookie(res: Response): void {
    res.clearCookie('token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
    });
}