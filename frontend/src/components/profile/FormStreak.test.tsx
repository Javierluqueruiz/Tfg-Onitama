import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormStreak } from './FormStreak';
import type { LastMatchEntry } from '../../../../shared';

const makeMatch = (result: LastMatchEntry['result'], opponentName = 'Rival', ranked = true): LastMatchEntry => ({
    opponentName, result, eloChange: result === 'win' ? 10 : result === 'loss' ? -10 : 0, ranked, date: '2026-01-01T00:00:00.000Z',
});

describe('FormStreak', () => {
    it('no pinta nada si no hay partidas', () => {
        const { container } = render(<FormStreak matches={[]} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('no pinta nada si todas las partidas son amistosas', () => {
        const matches = [makeMatch('win', 'Invitado1', false), makeMatch('loss', 'Invitado2', false)];
        const { container } = render(<FormStreak matches={matches} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('muestra las partidas clasificatorias con la más reciente a la izquierda', () => {
        const matches = [makeMatch('win', 'Reciente'), makeMatch('loss', 'Antigua')]; // lastMatches: más reciente primero
        render(<FormStreak matches={matches} />);

        const chips = screen.getAllByTitle(/vs /i);
        expect(chips[0]).toHaveAttribute('title', 'vs Reciente');
        expect(chips[1]).toHaveAttribute('title', 'vs Antigua');
    });

    it('excluye las partidas amistosas del cordón aunque estén mezcladas con las clasificatorias', () => {
        const matches = [
            makeMatch('win', 'InvitadoReciente', false),
            makeMatch('loss', 'RivalClasificatoria', true),
        ];
        render(<FormStreak matches={matches} />);

        expect(screen.queryByTitle('vs InvitadoReciente')).not.toBeInTheDocument();
        expect(screen.getByTitle('vs RivalClasificatoria')).toBeInTheDocument();
    });

    it('muestra como mucho las 10 partidas clasificatorias más recientes', () => {
        const matches = Array.from({ length: 15 }, (_, i) => makeMatch('win', `Rival${i}`));
        render(<FormStreak matches={matches} />);

        expect(screen.getAllByTitle(/vs /i)).toHaveLength(10);
    });
});