import type { RankingEntry } from '../../../../shared';

export function winRate({ wins, gamesPlayed }: Pick<RankingEntry, 'wins' | 'gamesPlayed'>): number {
    if (gamesPlayed === 0) return 0;
    return Math.round((wins / gamesPlayed) * 100);
}