import { describe, it, expect } from 'vitest';
import { Board, Card, GameState } from '../../../shared/index';
import { AiPlayer } from '../../src/ai/AiPlayer';

describe('FEAT-14 (Sub-14.2): AiPlayer', () => {

    const emptyBoard = (): Board => Array(5).fill(null).map(() => Array(5).fill(null)) as Board;

    it('Debe lanza un error si el jugador no tiene movimientos legales disponibles', () => {
        const board: Board = emptyBoard();
        const mockCard: Card = { name: 'Mock', description: 'Mock', color: 'red', moves: [{ x: 0, y: -1 }] };
        const cards: GameState['cards'] = {
            red: [mockCard, mockCard],
            blue: [mockCard, mockCard],
            neutral: mockCard
        };

        expect(() => AiPlayer.selectMove(board, 'red', cards)).toThrowError(`[FEAT-14] No hay movimientos legales disponibles para el jugador red`);
    });

    it('Debe elegir el movimiento que captura al maestro enemigo si está disponible', () => {
        const board = emptyBoard();
        board[0][2] = { type: 'master', color: 'red' };
        board[1][2] = { type: 'master', color: 'blue' };

        const captureCard: Card = { name: 'Capture', description: 'Mock', color: 'red', moves: [{ x: 1, y: 0 }, { x: 0, y: -1 }] };
        const mockCard: Card = { name: 'Mock', description: 'Mock', color: 'red', moves: [] };

        const cards: GameState['cards'] = {
            red: [captureCard, mockCard],
            blue: [mockCard, mockCard],
            neutral: mockCard
        };

        const move = AiPlayer.selectMove(board, 'red', cards);
        expect(move).toEqual({ from: { x: 2, y: 0 }, to: { x: 2, y: 1 }, cardName: 'Capture' });
    });
});