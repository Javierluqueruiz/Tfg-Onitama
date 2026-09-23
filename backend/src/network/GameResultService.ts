//Sub-09.1
import { MatchResult, RoomSession } from '../../../shared';
import { User, IUser } from '../auth/User.model';
import { EloService } from '../game/EloService';

export class GameResultService {
    private static readonly MAX_LAST_MATCHES = 20;

    public static async recordMatchResult(room: RoomSession): Promise<void> {
        if (!room.countsForStats) return; // Sub-14.3

        const { red, blue } = room.players;
        const winner = room.gameState.winner;
        if (!winner) return;

        const redResult: MatchResult = winner === 'red' ? 'win' : winner === 'blue' ? 'loss' : 'draw';
        const blueResult: MatchResult = winner === 'blue' ? 'win' : winner === 'red' ? 'loss' : 'draw';

        if (red?.userId && blue?.userId) {
            // Los dos son cuentas registradas -- partida clasificatoria de verdad.
            const [redUser, blueUser] = await Promise.all([
                User.findById(red.userId),
                User.findById(blue.userId)
            ]);

            if (!redUser || !blueUser) return;

            const redEloBefore = redUser.elo;
            const blueEloBefore = blueUser.elo;

            this.updateRankedStats(redUser, blueEloBefore, redResult, blueUser.username);
            this.updateRankedStats(blueUser, redEloBefore, blueResult, redUser.username);
            await Promise.all([redUser.save(), blueUser.save()]);
            return;
        }

        // Uno de los dos es invitado -- no hay ELO que mover, pero el lado
        // registrado sí guarda la partida en su historial, marcada como amistosa.
        if (red?.userId && !blue?.userId) {
            await this.recordUnrankedMatch(red.userId, redResult, blue?.name ?? 'Invitado');
        } else if (blue?.userId && !red?.userId) {
            await this.recordUnrankedMatch(blue.userId, blueResult, red?.name ?? 'Invitado');
        }
        // Dos invitados: ninguno tiene perfil que actualizar.
    }

    private static async recordUnrankedMatch(userId: string, result: MatchResult, opponentName: string): Promise<void> {
        const user = await User.findById(userId);
        if (!user) return;

        user.lastMatches.unshift({ opponentName, result, eloChange: 0, ranked: false, date: new Date().toISOString() });
        if (user.lastMatches.length > this.MAX_LAST_MATCHES) {
            user.lastMatches.length = this.MAX_LAST_MATCHES;
        }
        await user.save();
    }

    private static updateRankedStats(user: IUser, opponentEloBefore: number, matchResult: MatchResult, opponentName: string): void {
        const { newElo, delta } = EloService.calculateNewElo(user.elo, opponentEloBefore, matchResult, user.gamesPlayed);

        user.elo = newElo;
        user.gamesPlayed += 1;
        if (matchResult === 'win') user.wins += 1;
        else if (matchResult === 'loss') user.losses += 1;
        else if (matchResult === 'draw') user.draws += 1;

        user.lastMatches.unshift({ opponentName, result: matchResult, eloChange: delta, ranked: true, date: new Date().toISOString() });
        if (user.lastMatches.length > this.MAX_LAST_MATCHES) {
            user.lastMatches.length = this.MAX_LAST_MATCHES;
        }
    }
}