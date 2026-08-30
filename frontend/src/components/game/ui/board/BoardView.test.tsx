import { BoardView } from './BoardView';
import type { Board } from '../../../../../../shared';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import styles from './BoardView.module.css';

const emptyBoard = (): Board => 
    Array.from({ length: 5 }, () => Array(5).fill(null)) as Board;

describe('BoardView', () => {
    it('Muestra las 25 casillas del tablero', () => {
        const board = emptyBoard();
        const { container } = render(
            <BoardView
                board={board}
                localColor="red"
                currentTurn="red"
                selectedPiece={null}
                validTargets={[]}
                onCellClick={() => {}}
            />
        );

        expect(container.querySelectorAll(`.${styles.cell}`)).toHaveLength(25);
    });

    it('Muestra cada pieza con su nombre', () => {
        const board: Board = emptyBoard();
        board[0][2] = { type: 'master', color: 'red' };
        board[4][2] = { type: 'student', color: 'blue' };

        render(
            <BoardView
                board={board}
                localColor="red"
                currentTurn="red"
                selectedPiece={null}
                validTargets={[]}
                onCellClick={() => {}}
            />
        );


        expect(screen.getByRole('img', { name: 'Maestro Rojo' })).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Estudiante Azul' })).toBeInTheDocument();
    });

    it('Llama a onCellClick con las coordenadas correctas al hacer click en una casilla', () => {
        const board = emptyBoard();
        const handleCellClick = vi.fn();

        const { container } = render(
            <BoardView
                board={board}
                localColor="red"
                currentTurn="red"
                selectedPiece={null}
                validTargets={[]}
                onCellClick={handleCellClick}
            />
        );

        const cells = container.querySelectorAll(`.${styles.cell}`);
        fireEvent.click(cells[8]);

        expect(handleCellClick).toHaveBeenCalledWith({ x: 3, y: 1 });
    });

    it('Marca como validMove una casilla que es un objetivo válido', () => {
        const board = emptyBoard();
        board[1][2] = { type: 'student', color: 'blue' };

        const { container } = render(
            <BoardView
                board={board}
                localColor="red"  
                currentTurn="red"
                selectedPiece={{ x: 0, y: 0 }}
                validTargets={[{ x: 2, y: 1 }]}
                onCellClick={() => {}}
            />
        );

        const targetCell = container.querySelectorAll(`.${styles.cell}`)[1*5+2];
        expect(targetCell).toHaveClass(styles.validCapture);
    });

    it('Marca la pieza seleccionada con la clase selectedPiece', () => {
        const board = emptyBoard();
        board[2][2] = { type: 'student', color: 'red' };

        render(
            <BoardView
                board={board}
                localColor="red"
                currentTurn="red"
                selectedPiece={{ x: 2, y: 2 }}
                validTargets={[]}
                onCellClick={() => {}}
            />
        );

        const piece = screen.getByRole('img', { name: 'Estudiante Rojo' });
        expect(piece).toHaveClass(styles.selectedPiece);
    });

    it('Marca origen y destino del último movimiento con la clase lastMove', () => {
        const board = emptyBoard();
        const { container } = render(
            <BoardView
                board={board}
                localColor="red"
                currentTurn="red"
                selectedPiece={null}
                validTargets={[]}
                onCellClick={() => {}}
                lastMove={{ from: { x: 1, y: 1 }, to: { x: 2, y: 2 } }}
            />
        );

        const cells = container.querySelectorAll(`.${styles.cell}`);
        expect(cells[1*5+1]).toHaveClass(styles.lastMove);
        expect(cells[2*5+2]).toHaveClass(styles.lastMove);
    });
});