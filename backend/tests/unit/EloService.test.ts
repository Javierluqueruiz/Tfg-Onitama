import { describe, it, expect } from 'vitest';
import { EloService } from '../../src/game/EloService';

describe('EloService.getKFactor', () => {
    it('devuelve 32 para menos de 30 partidas jugadas', () => {
        expect(EloService.getKFactor(0, 2000)).toBe(32);
        expect(EloService.getKFactor(29, 2000)).toBe(32);
    });

    it('devuelve 16 para 30 o más partidas jugadas y ELO menor a 1400', () => {
        expect(EloService.getKFactor(30, 1399)).toBe(16);
        expect(EloService.getKFactor(100, 1000)).toBe(16);
    });

    it('devuelve 10 para 30 o más partidas jugadas y ELO mayor o igual a 1400', () => {
        expect(EloService.getKFactor(30, 1400)).toBe(10);
        expect(EloService.getKFactor(100, 2000)).toBe(10);
    });
});

describe('EloService.calculateNewElo', () => {
    it('con ELOs iguales, ganar suma la mitad del K-factor', () => {
        const { newElo, delta } = EloService.calculateNewElo(1000, 1000, 'win', 10);
        expect(newElo).toBe(1016);
        expect(delta).toBe(16);
    });

    it('con ELOs iguales, perder resta la mitad del K-factor', () => {
        const { newElo, delta } = EloService.calculateNewElo(1000, 1000, 'loss', 10);
        expect(newElo).toBe(984);
        expect(delta).toBe(-16);
    });

    it('con ELOs iguales, empatar no cambia el ELO', () => {
        const { newElo, delta } = EloService.calculateNewElo(1000, 1000, 'draw', 10);
        expect(newElo).toBe(1000);
        expect(delta).toBe(0);
    });
    
    it('un jugador con ELO más bajo, al ganar contra un jugador con ELO más alto, gana más puntos', () => {
        // expected = 1 / (1+10^1) = 1 / (1+10) = 1/11 ≈ 0.0909
        // delta = 32 * (1 - 0.0909) ≈ 32 * 0.9091 ≈ 29.09 
        const { newElo, delta } = EloService.calculateNewElo(1000, 1400, 'win', 10);
        expect(newElo).toBe(1029);
        expect(delta).toBe(29); // Más de la mitad del K-factor
    });

    it('un jugador con ELO más alto y muchas partidas jugadas, al perder contra un jugador con ELO más bajo, pierde menos puntos', () => {
        // expected = 1 / (1+10^-1) = 1 / (1+0.1) = 1/1.1 ≈ 0.9091
        // delta = 10 * (0 - 0.9091) ≈ 10 * -0.9091 ≈ -9.09
        const { newElo, delta } = EloService.calculateNewElo(1400, 1000, 'loss', 50);
        expect(newElo).toBe(1391);
        expect(delta).toBe(-9); // Menos de la mitad del K-factor
    });
});