import { Request, Response, NextFunction } from 'express';
import { AuthService } from './authService';

export interface AuthenticatedRequest extends Request {
    userId?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'No autenticado' });
        return;
    }

    const token = authHeader.slice('Bearer '.length);

    try {
        const payload = AuthService.verifyToken(token);
        req.userId = payload.sub;
        next();
    } catch {
        res.status(401).json({ message: 'Token inválido' });
    }
}