import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from './authMiddleware';
import { requireCustomHeader } from './csrfMiddleware';
import { setSessionCookie } from './sessionCookies';
import { User } from './User.model';
import { AuthService } from './authService';
import { authLimiter, handleAuthError } from './authRoutes';
import type { ProfileStats } from '../../../shared';

export const profileRoutes = Router();

profileRoutes.use(requireCustomHeader);

profileRoutes.get('/me', requireAuth, async (req: AuthenticatedRequest, res) => {
    const user = await User.findById(req.userId);

    if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
    }

    const stats: ProfileStats = {
        id: user._id.toString(),
        username: user.username,
        emailVerified: user.emailVerified,
        elo: user.elo,
        gamesPlayed: user.gamesPlayed,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
        lastMatches: user.lastMatches,
    };

    res.status(200).json(stats);
});

profileRoutes.patch('/password', requireAuth, authLimiter, async (req: AuthenticatedRequest, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await AuthService.changePassword(req.userId!, currentPassword, newPassword);
        const token = await AuthService.signToken(user);
        setSessionCookie(res, token);
        res.status(200).json({ message: 'Contraseña actualizada con éxito' });
    } catch (error) {
        handleAuthError(error, res);
    }
});