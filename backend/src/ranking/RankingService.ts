import type { RankingEntry, RankingResponse } from '../../../shared';
import mongoose from 'mongoose';
import { User } from '../auth/User.model';

export type RankingRow = Omit<RankingEntry, 'position'>;

export function assignPositions(rows: RankingRow[]): RankingEntry[] {
    const entries: RankingEntry[] = [];

    rows.forEach((row, index) => {
        const tiedWithPrevious = index > 0 && row.elo === rows[index - 1].elo;
        const position = tiedWithPrevious ? entries[index - 1].position : index + 1;
        entries.push({ ...row, position });
    });

    return entries;
}

export class RankingService {
    static readonly MIN_GAMES = 5;
    static readonly LIMIT = 50;

    public static topQuery() {
        return User.find({ gamesPlayed: mongoose.trusted({ $gte: RankingService.MIN_GAMES }) })
            .sort({ elo: -1, gamesPlayed: -1, usernameLower: 1 })
            .limit(RankingService.LIMIT)
            .select('username elo gamesPlayed wins losses draws')
    }

    public static async getTop(): Promise<RankingEntry[]> {
        const users = await RankingService.topQuery().lean();

        return assignPositions(users.map(({ username, elo, gamesPlayed, wins, losses, draws }) => ({
            username, elo, gamesPlayed, wins, losses, draws
        })));
    }

    public static async getEntryOf(userId: string): Promise<RankingEntry | null> {
        const user = await User.findById(userId)
            .select('username elo gamesPlayed wins losses draws')
            .lean();
        
        if (!user || user.gamesPlayed < RankingService.MIN_GAMES) return null;

        const ahead = await User.countDocuments({
            gamesPlayed: mongoose.trusted({ $gte: RankingService.MIN_GAMES }),
            elo: mongoose.trusted({ $gt: user.elo })
        });

        const { username, elo, gamesPlayed, wins, losses, draws } = user;
        return { position: ahead + 1, username, elo, gamesPlayed, wins, losses, draws };
    }

    // Respuesta completa
    public static async getRanking(userId?: string): Promise<RankingResponse> {
        const [entries, me] = await Promise.all([
            RankingService.getTop(),
            userId ? RankingService.getEntryOf(userId) : null,
        ]);

        return { entries, me, minGames: RankingService.MIN_GAMES };
    }
}