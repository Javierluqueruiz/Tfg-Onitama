import { describe, it, expect} from 'vitest';
import { getRankByElo } from '../../../../shared';

describe('getRankByElo', () => {
    it('un ELO inicial está en Plata', () => {
        expect(getRankByElo(1000).tier).toBe('silver');
    });

    it('justo por debadjo de 900 es Bronce', () => {
        expect(getRankByElo(899).tier).toBe('bronze');
    });

    it('exactamente 900 es Plata', () => {
        expect(getRankByElo(900).tier).toBe('silver');
    });

    it('exactamente 1400 es Diamante', () => {
        expect(getRankByElo(1400).tier).toBe('diamond');
        expect(getRankByElo(1399).tier).toBe('platinum');
    })

    it('un ELO muy alto es Gran Maestro', () => {
        expect(getRankByElo(2200).tier).toBe('grandmaster');
    });
});