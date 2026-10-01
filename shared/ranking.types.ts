export interface RankingEntry {
    position: number;
    username: string;
    elo: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
}

export interface RankingResponse {
    entries: RankingEntry[];
    me : RankingEntry | null;
    minGames: number;
}

