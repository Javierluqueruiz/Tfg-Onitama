import { describe, it, expect } from 'vitest';
import { assignPositions } from '../../src/ranking/RankingService';

const row = (username: string, elo: number) => ({
    username, elo, gamesPlayed: 10, wins: 5, losses: 4, draws: 1
});

describe('assignPositions', () => {
    it('devuelve una lista vacía si no hay jugadores', () => {
        expect(assignPositions([])).toEqual([]);
    });

    it('numera 1, 2, 3, cuando hay tres jugadores con distinto ELO', () => {
        const result = assignPositions([row('A', 1000), row('B', 900), row('C', 800)]);

        expect(result.map((r) => r.position)).toEqual([1, 2, 3]);
    });

    it('da la misma posición a jugadores con el mismo ELO', () => {
        const result = assignPositions([row('A', 1000), row('B', 1000), row('C', 800)]);

        expect(result.map((r) => r.position)).toEqual([1, 1, 3]);
    });

    it('mantiene el empate con tres jugadores y retoma la numeración después', () => {
        const result = assignPositions([row('A', 1000), row('B', 1000), row('C', 1000), row('D', 800)]);

        expect(result.map((r) => r.position)).toEqual([1, 1, 1, 4]);
    });

    it('mantiene el orden recibido', () => {
        const result = assignPositions([row('A', 1000), row('B', 1000)]);

        expect(result.map((r) => r.username)).toEqual(['A', 'B']);
        expect(result[0]).toEqual({
            position: 1, username: 'A', elo: 1000, gamesPlayed: 10, wins: 5, losses: 4, draws: 1
        })
    });
});