import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { RankingEntry } from '../../../../shared';
import { RankingTable } from './RankingTable';

const entry = (username: string, overrides: Partial<RankingEntry> = {}): RankingEntry => ({
    position: 1, username, elo: 1300, gamesPlayed: 10, wins: 7, losses: 3, draws: 0, ...overrides
});

const cellsOf = (row: HTMLElement) => within(row).getAllByRole('cell').map((cell) => cell.textContent);
const dataRows = () => screen.getAllByRole('row').slice(1);

describe('RankingTable', () => {
    it('muestra posición, rango, nombre, ELO, partidas y porcentaje de victorias de cada jugador', () => {
        render(<RankingTable entries={[entry('Ana')]} me={null} />);

        expect(cellsOf(screen.getByRole('row', { name: /ana/i }))).toEqual(['1', 'Platino', 'Ana', '1300', '10', '70%']);
    });

    it('el rango sale del ELO del jugador', () => {
        render(<RankingTable entries={[entry('alto', { elo: 2000 }), entry('bajo', { elo: 800 })]} me={null} />);

        expect(screen.getByText('Gran Maestro')).toBeInTheDocument();
        expect(screen.getByText('Bronce')).toBeInTheDocument();
    });

    it('los jugadores empatados aparecen en la misma posición', () => {
        render(<RankingTable entries={[entry('Ana', { position: 1 }), entry('Berta', { position: 1 }), entry('Carmen', { position: 3 })]} me={null} />);
        expect(dataRows().map((row) => cellsOf(row)[0])).toEqual(['1', '1', '3']);
    });

    it('resalta la fila del jugador que consulta', () => {
        const entries = [entry('Ana'), entry('Berta', { position: 2 })];

        render(<RankingTable entries={entries} me={entries[1]} />);

        expect(screen.getByRole('row', { name: /berta/i })).toHaveAttribute('aria-current', 'true');
        expect(screen.getByRole('row', { name: /ana/i })).not.toHaveAttribute('aria-current');
    });

    it('no marca ninguna fila si el jugador que consulta no está en el ranking', () => {
        const { container } = render(<RankingTable entries={[entry('Ana')]} me={null} />);
        expect(container.querySelector('[aria-current]')).toBeNull();
    });

    it('si quien consulta está fuera de la lista, añade una fila al final con su posición y estadísticas', () => {
        const entries = [entry('Ana', { position: 1 }), entry('Berta', { position: 2 })];
        const me = entry('player', { position: 80, elo: 800 });

        render(<RankingTable entries={entries} me={me} />);
    
        const rows = dataRows();
        expect(rows).toHaveLength(3);
        expect(cellsOf(rows[2])).toEqual(['80', 'Bronce', 'player', '800', '10', '70%']);
        expect(rows[2]).toHaveAttribute('aria-current', 'true');
    });

    it('no duplica la fila del jugador que consulta si ya está en la lista', () => {
        const entries = [entry('Ana')];
        render(<RankingTable entries={entries} me={entries[0]} />);

        expect(dataRows()).toHaveLength(1);
        expect(screen.getAllByText('Ana')).toHaveLength(1);
    });
});