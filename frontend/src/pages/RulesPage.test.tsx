import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RulesPage } from './RulesPage';
import boardStyles from '../components/game/ui/board/BoardView.module.css';

function renderPage() {
    return render(
        <MemoryRouter>
            <RulesPage />
        </MemoryRouter>
    );
}

// Índices (fila * 5 + columna) de las casillas resaltadas como destino en un tablero.
function targetIndexes(board: HTMLElement): number[] {
    const container = board.querySelector(`.${boardStyles.boardContainer}`) as HTMLElement;
    const cells = Array.from(container.children).filter(el => el.classList.contains(boardStyles.cell));
    return cells.flatMap((cell, index) => cell.classList.contains(boardStyles.validMove) ? [index] : []);
}

describe('RulesPage', () => {
    it('muestra las siete secciones de las reglas', () => {
        renderPage();

        ['Tablero y piezas', 'Cómo ganar', 'Las cartas', 'Un turno', 'Casos especiales', 'Modos de juego', 'Puntuación ELO y rangos']
            .forEach(title => {
                expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
            });
    });

    it('presenta las piezas antes que las formas de ganar', () => {
        renderPage();

        const titles = screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent);
        expect(titles.indexOf('Tablero y piezas')).toBeLessThan(titles.indexOf('Cómo ganar'));
    });

    it('explica la puntuación ELO y muestra los siete rangos, de Bronce a Gran Maestro', () => {
        renderPage();

        ['Bronce', 'Plata', 'Oro', 'Platino', 'Diamante', 'Maestro', 'Gran Maestro'].forEach(name => {
            expect(screen.getByText(name)).toBeInTheDocument();
        });
        expect(screen.getByText('Menos de 900')).toBeInTheDocument();
        expect(screen.getByText('1700 o más')).toBeInTheDocument();
        expect(screen.getByText('1100 – 1249')).toBeInTheDocument();
    });

    it('explica los dos motores de IA en los modos de juego', () => {
        renderPage();

        expect(screen.getByRole('heading', { level: 3, name: 'Heurística' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 3, name: 'Minimax' })).toBeInTheDocument();
    });

    it('enlaza cada sección desde el índice lateral', () => {
        renderPage();

        const toc = screen.getByRole('navigation', { name: /secciones/i });
        expect(within(toc).getAllByRole('link')).toHaveLength(7);
        expect(within(toc).getByRole('link', { name: 'Las cartas' })).toHaveAttribute('href', '#cartas');
    });

    it('permite volver al lobby', () => {
        renderPage();

        screen.getAllByRole('link', { name: /jugar/i }).forEach(link => {
            expect(link).toHaveAttribute('href', '/');
        });
    });

    describe('explorador de cartas', () => {
        it('ilumina los destinos de la carta elegida', () => {
            renderPage();
            const panel = screen.getByRole('complementary');

            fireEvent.click(screen.getByRole('button', { name: 'Carta Crab' }));

            expect(within(panel).getByRole('heading', { name: 'Crab' })).toBeInTheDocument();
            const board = within(panel).getByRole('group', { name: /carta Crab/i });
            // Crab: (-2,0), (2,0) y (0,-1) desde el centro (2,2) -> (0,2), (4,2) y (2,1)
            expect(targetIndexes(board)).toEqual([7, 10, 14]);
        });

        it('muestra Tiger por defecto: dos casillas adelante y una atrás', () => {
            renderPage();
            const panel = screen.getByRole('complementary');

            expect(targetIndexes(within(panel).getByRole('group', { name: /carta Tiger/i }))).toEqual([2, 17]);
        });
    });
});
