import type { Board, Card } from '../../../../../shared';
import { getValidTargets } from './getValidTargets';
import { describe, it, expect } from 'vitest';

const emptyBoard = (): Board => 
    Array.from({ length: 5 }, () => Array(5).fill(null)) as Board;

const mockCard: Card = {
    name: 'Mock Card',
    description: '',
    color: 'red',
    moves: [
        { x: 0, y: 1 },
        { x: 1, y: 0 },]
};

describe('getValidTargets', () => {
    it('devuelve un array vacío si no hay carta seleccionada', () => {
        const board = emptyBoard();
        const result = getValidTargets(board, null, { x: 2, y: 2 }, 'red', true);
        expect(result).toEqual([]);
    });

    it('Devuevle un array vacío si no hay ficha seleccionada', () => {
        const board = emptyBoard();
        const result = getValidTargets(board, mockCard, null, 'red', true);
        expect(result).toEqual([]);
    });

    it('devuelve los destinos válidos invirtiendo el tablero si el jugador local es rojo', () => {
        const board = emptyBoard();
        const selectedPiece = { x: 2, y: 2 };
        const result = getValidTargets(board, mockCard, selectedPiece, 'red', true);
        expect(result).toEqual([
            { x: 2, y: 1 }, // Movimiento hacia arriba
            { x: 1, y: 2 }  // Movimiento hacia la izquierda
        ]);
    });

    it('devuelve los destinos válidos sin invertir el tablero si el jugador local es azul', () => {
        const board = emptyBoard();
        const selectedPiece = { x: 2, y: 2 };
        const result = getValidTargets(board, mockCard, selectedPiece, 'blue', false);
        expect(result).toEqual([
            { x: 2, y: 3 }, // Movimiento hacia abajo
            { x: 3, y: 2 }  // Movimiento hacia la derecha
        ]);
    });

    it('descarta los destinos que se salen del tablero', () => {
        const board = emptyBoard();
        const selectedPiece = { x: 0, y: 0 };
        const edgeCaseCard: Card = {
            ...mockCard,
            moves: [{x: 0, y: -1}]
        };

        const result = getValidTargets(board, edgeCaseCard, selectedPiece, 'blue', false);
        expect(result).toEqual([]); // Movimiento hacia arriba se descarta porque está fuera del tablero
    });

    it('descarta los destinos ocupados por piezas del mismo color', () => {
    const board = emptyBoard();
    board[1][2] = { type: 'student', color: 'red' }; // destino real (2,1) ocupado por una ficha roja propia

    const result = getValidTargets(board, mockCard, { x: 2, y: 2 }, 'red', true);

    expect(result).not.toContainEqual({ x: 2, y: 1 });
    });

    it('devuelve destinos ocupados por piezas del rival', () => {
        const board = emptyBoard();
        board[1][2] = { type: 'student', color: 'blue' }; // mismo destino real (2,1), pero ficha rival

        const result = getValidTargets(board, mockCard, { x: 2, y: 2 }, 'red', true);

        expect(result).toStrictEqual([{ x: 2, y: 1 }, { x: 1, y: 2 }]);
    });
});
