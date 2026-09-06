import { Router, Response } from 'express';
import { AuthService, AuthError } from './authService';
import { requireAuth, AuthenticatedRequest } from './authMiddleware';
import { User } from './User.model';
import rateLimit from 'express-rate-limit';

export const authRoutes = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 10,
    message: { message: 'Demasiados intentos de autenticación. Por favor, inténtelo de nuevo más tarde.'},
    standardHeaders: true,
    legacyHeaders: false,
});

authRoutes.post('/register', authLimiter, async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const user = await AuthService.register(username, email, password);
        res.status(201).json({ message: 'Usuario registrado exitosamente', id: user._id, username: user.username });
    } catch (error) {
        handleAuthError(error, res);
    }
});

authRoutes.post('/login', authLimiter, async (req, res) => {
    const { username, password } = req.body;

    try {
        const { user, token } = await AuthService.login(username, password);
        res.status(200).json({ message: 'Inicio de sesión exitoso', token, user: { id: user._id, username: user.username } });
    } catch (error) {
        handleAuthError(error, res);
    }
});

authRoutes.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
    const user = await User.findById(req.userId);

    if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
    }

    res.status(200).json({ id: user._id, username: user.username });
});

function handleAuthError(error: unknown, res: Response): void {
    if (error instanceof AuthError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }

    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });    
}