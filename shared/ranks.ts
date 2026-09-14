export type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'grandmaster';

export interface EloRank {
    tier: RankTier;
    name: string;
    minElo: number;
}

const ELO_RANKS: EloRank[] = [
    { tier: 'grandmaster', name: 'Gran Maestro', minElo: 1700 },
    { tier: 'master', name: 'Maestro', minElo: 1550 },
    { tier: 'diamond', name: 'Diamante', minElo: 1400 },
    { tier: 'platinum', name: 'Platino', minElo: 1250 },
    { tier: 'gold', name: 'Oro', minElo: 1100 },
    { tier: 'silver', name: 'Plata', minElo: 900 },
    { tier: 'bronze', name: 'Bronce', minElo: -Infinity },
];

export function getRankByElo(elo: number): EloRank {
    return ELO_RANKS.find((rank) => elo >= rank.minElo)!;
}