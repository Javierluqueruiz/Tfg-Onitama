//Sub-09.1
import { MatchResult } from '../../../shared';

export class EloService {
    public static readonly INITIAL_ELO = 1000;

    public static getKFactor(gamesPlayedBeforeMatch: number, currentElo: number): number {
        if (gamesPlayedBeforeMatch < 30) return 32;
        if (currentElo >= 1400) return 10;
        return 16;
    }

    public static calculateNewElo(currentElo: number, opponentElo: number, matchResult: MatchResult, gamesPlayedBeforeMatch: number): { newElo: number; delta: number } {
        const score = matchResult === 'win' ? 1 : matchResult === 'draw' ? 0.5 : 0;
        const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - currentElo) / 400));
        const k = this.getKFactor(gamesPlayedBeforeMatch, currentElo);
        const delta = Math.round(k * (score - expectedScore));
        return { newElo: currentElo + delta, delta };
    }
}