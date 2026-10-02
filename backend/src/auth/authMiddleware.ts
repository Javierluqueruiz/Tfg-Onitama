import { Request, Response, NextFunction } from 'express';
import { AuthService } from './authService';

export interface AuthenticatedRequest extends Request {
    userId?: string;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const token = req.cookies?.token;

    if (!token) {
        res.status(401).json({ message: 'No autenticado' });
        return;
    }

    try {
        const payload = AuthService.verifyToken(token);
        const isValid = await AuthService.isSessionStillValid(payload);

        if (!isValid) {
            res.status(401).json({ message: 'Token inválido' });
            return;
        }

        req.userId = payload.sub;
        next();
    } catch {
        res.status(401).json({ message: 'Token inválido' });
    }
}

// Para rutas públicas que, si hay sesión, personalizan la respuesta
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const token = req.cookies?.token;

    if (token) {
        try {
            const payload = AuthService.verifyToken(token);
            if (await AuthService.isSessionStillValid(payload)) {
                req.userId = payload.sub;
            }
        } catch {
            // Token inválido -> se sigue como invitado
        }
    }
    next();
}