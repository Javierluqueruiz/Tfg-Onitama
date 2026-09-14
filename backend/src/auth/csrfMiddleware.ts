import { Request, Response, NextFunction } from 'express';

export function requireCustomHeader(req: Request, res: Response, next: NextFunction): void {
    if (req.method === 'GET') {
        next();
        return;
    }

    if (!req.header('X-Requested-With')) {
        res.status(403).send('Solicitud rechazada');
        return;
    }
    next();
}