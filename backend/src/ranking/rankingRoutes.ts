import { Router } from 'express';
import { optionalAuth, AuthenticatedRequest } from '../auth/authMiddleware';
import { RankingService } from './RankingService';

export const rankingRoutes = Router();

rankingRoutes.get('/', optionalAuth, async (req: AuthenticatedRequest, res) => {
    res.set('Cache-Control', 'no-store');
    res.status(200).json(await RankingService.getRanking(req.userId));
});