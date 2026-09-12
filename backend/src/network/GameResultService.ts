//Sub-09.1
import { MatchResult, RoomSession } from '../../../shared';
import { User, IUser } from '../auth/User.model';
import { EloService } from '../game/EloService';

export class GameResultService {
    private static readonly MAX_LAST_MATCHES = 20;

    public static async recordMatchResult(room: RoomSession): Promise<void> {
        const { red, blue } = room.players;
        const winner = room.gameState.winner;

        if (!red?.userId || !blue?.userId || !winner) return;
        const [redUser, blueUser] = await Promise.all([
            User.findById(red.userId),
            User.findById(blue.userId)
        ]);

        if (!redUser || !blueUser) return;

        const redEloBefore = redUser.elo;
        const blueEloBefore = blueUser.elo;

        const redResult: MatchResult  = winner === 'red' ? 'win' : winner === 'blue' ? 'loss' : 'draw';
        const blueResult: MatchResult = winner === 'blue' ? 'win' : winner === 'red' ? 'loss' : 'draw';

        this.UpdateEloStats(redUser, blueEloBefore, redResult, blueUser.username);
        this.UpdateEloStats(blueUser, redEloBefore, blueResult, redUser.username);
        await Promise.all([redUser.save(), blueUser.save()]);
        
    }

    private static UpdateEloStats(user: IUser, opponentEloBefore: number, matchResult: MatchResult, opponentName: string): void {
        const { newElo, delta } = EloService.calculateNewElo(user.elo, opponentEloBefore, matchResult, user.gamesPlayed);

        user.elo = newElo;
        user.gamesPlayed += 1;
        if (matchResult === 'win') user.wins += 1;
        else if (matchResult === 'loss') user.losses += 1;
        else if (matchResult === 'draw') user.draws += 1;

        user.lastMatches.unshift({ opponentName, result: matchResult, eloChange: delta, date: new Date().toISOString() });
        if (user.lastMatches.length > this.MAX_LAST_MATCHES) {
            user.lastMatches.length = this.MAX_LAST_MATCHES; 
        }
    }
}