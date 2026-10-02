import { getRankByElo, type EloRank, type EloUpdate } from '../../../../shared';

export interface RankChange {
    direction: 'up' | 'down';
    rank: EloRank;
}

export function getRankChange(update: EloUpdate): RankChange | null {
    if (!update.ranked) return null;

    const before = getRankByElo(update.newElo - update.eloChange);
    const after = getRankByElo(update.newElo);

    if (after.tier === before.tier) return null;
    return { direction: after.minElo > before.minElo ? 'up' : 'down', rank: after };
}