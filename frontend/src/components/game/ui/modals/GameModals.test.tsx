import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameOverModal } from './GameOverModal';
import { SurrenderConfirmModal } from './SurrenderConfirmModal';
import type { EloUpdate } from '../../../../../../shared'; 

describe('GameOverModal', () => {
    it.each([
        ['win', '¡Victoria!'],
        ['lose', 'Derrota'],
        ['draw', 'Empate'],
    ] as const)('para el resultado "%s" muestra el título "%s"', (result, title) => {
        render(<GameOverModal result={result} onCloseModal={vi.fn()} onExit={vi.fn()} />);

        expect(screen.getByRole('dialog', { name: title })).toBeInTheDocument();
    });

    it('permite ver el tablero final sin salir de la partida', () => {
        const onCloseModal = vi.fn();
        const onExit = vi.fn();
        render(<GameOverModal result="win" onCloseModal={onCloseModal} onExit={onExit} />);

        fireEvent.click(screen.getByRole('button', { name: 'Ver tablero final' }));

        expect(onCloseModal).toHaveBeenCalledTimes(1);
        expect(onExit).not.toHaveBeenCalled();
    });

    it('vuelve al menú', () => {
        const onExit = vi.fn();
        render(<GameOverModal result="lose" onCloseModal={vi.fn()} onExit={onExit} />);

        fireEvent.click(screen.getByRole('button', { name: 'Volver al menú' }));

        expect(onExit).toHaveBeenCalledTimes(1);
    });

    it('Escape cierra el modal como "ver tablero final", sin salir', () => {
        const onCloseModal = vi.fn();
        const onExit = vi.fn();
        render(<GameOverModal result="draw" onCloseModal={onCloseModal} onExit={onExit} />);

        fireEvent.keyDown(window, { key: 'Escape' });

        expect(onCloseModal).toHaveBeenCalledTimes(1);
        expect(onExit).not.toHaveBeenCalled();
    });
});

describe('SurrenderConfirmModal', () => {
    it('confirma la rendición solo con el botón "Rendirse"', () => {
        const onConfirm = vi.fn();
        const onCancel = vi.fn();
        render(<SurrenderConfirmModal onConfirm={onConfirm} onCancel={onCancel} />);

        fireEvent.click(screen.getByRole('button', { name: 'Rendirse' }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('"Seguir jugando", Escape y el clic fuera cancelan, y nunca confirman', () => {
        const onConfirm = vi.fn();
        const onCancel = vi.fn();
        const { container } = render(<SurrenderConfirmModal onConfirm={onConfirm} onCancel={onCancel} />);

        fireEvent.click(screen.getByRole('button', { name: 'Seguir jugando' }));
        fireEvent.keyDown(window, { key: 'Escape' });
        fireEvent.click(container.firstChild as HTMLElement);

        expect(onCancel).toHaveBeenCalledTimes(3);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('un clic dentro del cuadro no lo cierra', () => {
        const onCancel = vi.fn();
        render(<SurrenderConfirmModal onConfirm={vi.fn()} onCancel={onCancel} />);

        fireEvent.click(screen.getByRole('dialog'));

        expect(onCancel).not.toHaveBeenCalled();
    });

    it('la opción segura recibe el foco al abrirse', () => {
        render(<SurrenderConfirmModal onConfirm={vi.fn()} onCancel={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'Seguir jugando' })).toHaveFocus();
    });
});

describe('GameOverModal: variación de ELO (Sub-11.3)', () => {
    const renderModal = (eloUpdate?: EloUpdate | null) => render(<GameOverModal result="win" eloUpdate={eloUpdate} onCloseModal={vi.fn()} onExit={vi.fn()} />);

    it('mientras no llega aviso del servidor no se muestra la variación de ELO', () => {
        renderModal(null);

        expect(screen.queryByText(/ELO/)).not.toBeInTheDocument();
    });

    it('muestra lo ganado y el nuevo ELO', () => {
        renderModal({ ranked: true, eloChange: 16, newElo: 1016 });
        expect(screen.getByText('+16 ELO')).toBeInTheDocument();
        expect(screen.getByText('Nuevo ELO: 1016')).toBeInTheDocument();
    });

    it('muestra lo perdido y el nuevo ELO', () => {
        renderModal({ ranked: true, eloChange: -16, newElo: 984 });
        expect(screen.getByText('-16 ELO')).toBeInTheDocument();
        expect(screen.getByText('Nuevo ELO: 984')).toBeInTheDocument();
    });

    it('un empate sin variación se muestra como ±0', () => {
        renderModal({ ranked: true, eloChange: 0, newElo: 1000 });

        expect(screen.getByText('±0 ELO')).toBeInTheDocument();
        expect(screen.queryByText(/amistosa/i)).not.toBeInTheDocument();
    });

    it('una partida amistosa se indica como tal, sin mostrar ELO', () => {
        renderModal({ ranked: false });

        expect(screen.getByText(/partida amistosa: no puntúa/i)).toBeInTheDocument();
        expect(screen.queryByText(/\d ELO/)).not.toBeInTheDocument();
    });

    it.each([
        [{ ranked: true, eloChange: 10, newElo: 1100 }, 'Has subido a Oro'],
        [{ ranked: true, eloChange: -20, newElo: 1090 }, 'Has bajado a Plata'],
    ] as const)('avisa del cambio de rango: %j', (eloUpdate, expectedText) => {
        renderModal(eloUpdate);

        expect(screen.getByText(expectedText)).toBeInTheDocument();
    });

    it('no avisa de cambio de rango si no lo hay', () => {
        renderModal({ ranked: true, eloChange: 10, newElo: 1010 });
        expect(screen.queryByText(/subido|bajado/i)).not.toBeInTheDocument();
    });

    it('la variación aparece dentro de una región aria-live que ya existía', () => {
        const { rerender } = render(<GameOverModal result="win" eloUpdate={null} onCloseModal={vi.fn()} onExit={vi.fn()} />);
        const region = document.querySelector('[aria-live="polite"]');

        rerender(<GameOverModal result="win" eloUpdate={{ ranked: true, eloChange: 16, newElo: 1016 }} onCloseModal={vi.fn()} onExit={vi.fn()} />);

        expect(region).not.toBeNull();
        expect(region).toContainElement(screen.getByText('+16 ELO'));
    });
});