import { describe, expect, it } from 'vitest';
import { Board, Card, GameState } from '../../../shared';
import { HeuristicEvaluator } from '../../src/ai/HeuristicEvaluator';

describe('FEAT-14 (Sub-14.2): HeuristicEvaluator', () => {
    const emptyBoard = (): Board => Array(5).fill(null).map(() => Array(5).fill(null)) as Board;

    const noMoveCard: Card = { name: 'NoMove', description: 'Mock', color: 'red', moves: [] };
    const noMoveCards: GameState['cards'] = {
        red: [noMoveCard, noMoveCard],
        blue: [noMoveCard, noMoveCard],
        neutral: noMoveCard
    };

    it('Debe devolver +Infinity si el jugador ha ganado', () => {
        const board: Board = emptyBoard();
        board[0][2] = { type: 'master', color: 'blue' }; 
        expect(HeuristicEvaluator.evaluate(board, 'blue', noMoveCards)).toBe(Number.POSITIVE_INFINITY);
    });

    it('Debe devolver -Infinity si el jugador ha perdido', () => {
        const board: Board = emptyBoard();
        board[0][2] = { type: 'master', color: 'blue' };
        
        expect(HeuristicEvaluator.evaluate(board, 'red', noMoveCards)).toBe(Number.NEGATIVE_INFINITY);
    });

    it('Debe puntuar mejor una posición con ventaja de material', () => {
        const board = emptyBoard();
        board[0][2] = { type: 'master', color: 'red' };
        board[4][2] = { type: 'master', color: 'blue' };
        board[0][0] = { type: 'student', color: 'red' };
        board[0][4] = { type: 'student', color: 'red' };
        board[4][0] = { type: 'student', color: 'blue' };

        expect(HeuristicEvaluator.evaluate(board, 'red', noMoveCards)).toBe(100); // 2 estudiantes rojos - 1 estudiante azul = +1 * W_MATERIAL (100)
        expect(HeuristicEvaluator.evaluate(board, 'blue', noMoveCards)).toBe(-100); // 1 estudiante azul - 2 estudiantes rojos = -1 * W_MATERIAL (100)
    });

    it('Debe puntuar mejor una posición donde el maestro del jugador está más cerca del templo enemigo', () => {
        const board = emptyBoard();

        board[2][2] = { type: 'master', color: 'red' }; // Maestro rojo en el centro

        board[4][2] = { type: 'master', color: 'blue' }; // Maestro azul en el templo azul

        // positionalDiff = (2+2) - (2+0) = 2 (W_POSITION = 1 -> +2)
        // templeDiff = distancia(azul, temploRojo)=4 - distancia(rojo, temploAzul)=2 = 2 (W_TEMPLE = 10 -> +20)
        // total = 2 + 20 = 22
        expect(HeuristicEvaluator.evaluate(board, 'red', noMoveCards)).toBe(22);
        expect(HeuristicEvaluator.evaluate(board, 'blue', noMoveCards)).toBe(-22);
    });

    it('Debe puntuar mejor una posición donde el jugador tiene más movilidad', () => {
        const board = emptyBoard();
        board[0][2] = { type: 'master', color: 'red' };
        board[4][2] = { type: 'master', color: 'blue' };

        const redCard: Card = { name: 'RedCard', description: 'Mock', color: 'red', moves: [{ x: 0, y: -1 }] };
        const cards: GameState['cards'] = {
            red: [redCard, noMoveCard],
            blue: [noMoveCard, noMoveCard],
            neutral: noMoveCard
        };
        // mobilityDiff = 1 - 0 = 1 (W_MOBILITY = 2 -> +2)
        expect(HeuristicEvaluator.evaluate(board, 'red', cards)).toBe(2);
        expect(HeuristicEvaluator.evaluate(board, 'blue', cards)).toBe(-2);
    });
    
});