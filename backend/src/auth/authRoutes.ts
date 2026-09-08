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
    // Los tests de integración hacen muchos más de 10 registros/logins en un
    // mismo archivo -- sin esto, el propio rate limiter empieza a devolver
    // 429 a mitad de la suite. En producción NODE_ENV nunca es 'test'.
    skip: () => process.env.NODE_ENV === 'test',
});

authRoutes.post('/register', authLimiter, async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const user = await AuthService.register(username, email, password);
        res.status(201).json({ message: 'Usuario registrado exitosamente', id: user._id, username: user.username, emailVerified: user.emailVerified });
    } catch (error) {
        handleAuthError(error, res);
    }
});

authRoutes.post('/login', authLimiter, async (req, res) => {
    const { username, password } = req.body;

    try {
        const { user, token } = await AuthService.login(username, password);
        res.status(200).json({ message: 'Inicio de sesión exitoso', token, user: { id: user._id, username: user.username, emailVerified: user.emailVerified } });
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

    res.status(200).json({ id: user._id, username: user.username, emailVerified: user.emailVerified });
});

authRoutes.post('/verify-email', async (req, res) => {
    const { token } = req.body;

    try {
        const user = await AuthService.verifyEmail(token);
        res.status(200).json({ id: user._id, username: user.username, emailVerified: user.emailVerified });
    } catch (error) {
        handleAuthError(error, res);
    }
});

authRoutes.post('/resend-verification', requireAuth, authLimiter, async (req: AuthenticatedRequest, res) => {
    try {
        await AuthService.resendVerificationEmail(req.userId!);
        res.status(200).json({ message: 'Correo de verificación reenviado exitosamente' });
    } catch (error) {
        handleAuthError(error, res);
    }
});

authRoutes.post('/forgot-password', authLimiter, async (req, res) => {
    const { email } = req.body;

    try {
        await AuthService.requestPasswordReset(email);
    } catch (error) {
        console.error(error);
    }

    res.status(200).json({ message: 'Instrucciones de restablecimiento de contraseña enviadas' });
});

authRoutes.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        await AuthService.resetPassword(token, newPassword);
        res.status(200).json({ message: 'Contraseña restablecida exitosamente' });
    } catch (error) {
        handleAuthError(error, res);
    }
});



function handleAuthError(error: unknown, res: Response): void {
    if (error instanceof AuthError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }

    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor' });    
}