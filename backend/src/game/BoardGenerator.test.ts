import { describe, beforeAll, it, expect } from 'vitest';
import { BoardGenerator } from './BoardGenerator';
import { Board } from '../../../shared/types';
import { before } from 'node:test';

describe('FEAT-01: BoardGenerator', () => {
    
    let board: Board;

    beforeAll(() => {
        board = BoardGenerator.createInitialBoard();
    });

    it('debe generar una matriz exacta de 5x5', () => {        
        expect(board.length).toBe(5);

        board.forEach(row => {
            expect(row.length).toBe(5);
        });
    });

    it('debe colocar a los maestros en las celdas centrales de la primera y última fila y a los estudiantes a sus lados', () => {
        board.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (y === 0) {
                    if (x === 2) {
                        expect(cell).toEqual({ type: 'master', color: 'red' });
                    } else {
                        expect(cell).toEqual({ type: 'student', color: 'red' });
                    }
                } else if (y === 4) {
                    if (x === 2) {
                        expect(cell).toEqual({ type: 'master', color: 'blue' });
                    } else {
                        expect(cell).toEqual({ type: 'student', color: 'blue' });
                    }
                }
            });
        });
    });

    it('Debe dejar las filas centrales (1, 2 y 3) totalmente vacías', () => {
        const emptyRow = [null, null, null, null, null];
        expect(board[1]).toEqual(emptyRow);
        expect(board[2]).toEqual(emptyRow);
        expect(board[3]).toEqual(emptyRow);
    });
});