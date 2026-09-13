import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from './authMiddleware';
import { requireCustomHeader } from './csrfMiddleware';
import { User } from './User.model';
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