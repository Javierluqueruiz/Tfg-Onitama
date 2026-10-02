import { describe, it, expect } from 'vitest';
import { getRankChange } from './rankChange';

describe('getRankChange', () => {
    it('no hay cambio de rango si la partida no es ranked', () => {
        expect(getRankChange({ ranked: false })).toBeNull();
    });

    it('no hay cambio mientras el ELO se mantiene en el mismo rango', () => {
        expect(getRankChange({ ranked: true, eloChange: 10, newElo: 1010 })).toBeNull();
    });

    it('detecta una subida al cruzar el límite superior del rango', () => {
        const change = getRankChange({ ranked: true, eloChange: 20, newElo: 1100 });

        expect(change?.direction).toBe('up');
        expect(change?.rank.name).toBe('Oro');
    });

    it('detecta una bajada al cruzar el límite inferior del rango', () => {
        const change = getRankChange({ ranked: true, eloChange: -20, newElo: 1090 });

        expect(change?.direction).toBe('down');
        expect(change?.rank.name).toBe('Plata');
    });

    it('llegar justo al límite superior del rango cuenta como subida', () => {
        const change = getRankChange({ ranked: true, eloChange: 1, newElo: 900 });

        expect(change?.direction).toBe('up');
        expect(change?.rank.name).toBe('Plata');
    });

    it('un empate sin variación no cambia de rango, aunque el ELO esté en un umbral', () => {
        expect(getRankChange({ ranked: true, eloChange: 0, newElo: 1000 })).toBeNull();
    });
});