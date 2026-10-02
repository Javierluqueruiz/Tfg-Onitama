import { describe, it, expect } from 'vitest';
import type { RankingEntry } from '../../../../shared';
import { winRate } from './winRate';

const entry = (overrides: Partial<RankingEntry>): RankingEntry => ({
    position: 1, username: 'Ana', elo: 1000, gamesPlayed: 10, wins: 0, losses: 0, draws: 0, ...overrides
});

describe('winRate', () => {
    it('devuelve el porcentaje de victorias de un jugador', () => {
        expect(winRate(entry({ gamesPlayed: 10, wins: 7, losses: 3 }))).toBe(70);
    });

    it('redondea al entero más cercano', () => {
        expect(winRate(entry({ gamesPlayed: 3, wins: 1, losses: 2 }))).toBe(33);
        expect(winRate(entry({ gamesPlayed: 3, wins: 2, losses: 1 }))).toBe(67);
    });

    it('los empates cuentan como partida jugada', () => {
        expect(winRate(entry({ gamesPlayed: 10, wins: 5, losses: 3, draws: 2 }))).toBe(50);
    });

    it('si no ha jugado ninguna partida devuelve 0', () => {
        expect(winRate(entry({ gamesPlayed: 0, wins: 0, losses: 0 }))).toBe(0);
    });
});