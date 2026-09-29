import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameOverModal } from './GameOverModal';
import { SurrenderConfirmModal } from './SurrenderConfirmModal';

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
