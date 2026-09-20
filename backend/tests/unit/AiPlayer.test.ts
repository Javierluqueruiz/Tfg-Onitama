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

    it('Debe evitar una jugada que permita al oponente ganar en el siguiente turno', () => {
        const board = emptyBoard();
        board[2][2] = { type: 'master', color: 'red' };
        board[4][2] = { type: 'master', color: 'blue' };

        const redCard: Card = { name: 'RedCard', description: 'Mock', color: 'red', moves: [{ x: 0, y: -1 }, { x:-1, y:-1 }] };
        const blueCard: Card = { name: 'BlueCard', description: 'Mock', color: 'blue', moves: [{ x: 0, y: -1 }] };
        const passiveCard: Card = { name: 'Passive', description: 'Mock', color: 'red', moves: [] };

        const cards: GameState['cards'] = {
            red: [redCard, passiveCard],
            blue: [blueCard, passiveCard],
            neutral: passiveCard
        };

        expect(AiPlayer.selectMove(board, 'red', cards)).toEqual({ from: { x: 2, y: 2 }, to: { x: 3, y: 3 }, cardName: 'RedCard' });
    });
});

describe('FEAT-14 (Sub-14.3): AiPlayer.selectDiscard', () => {
    const emptyBoard = (): Board => Array(5).fill(null).map(() => Array(5).fill(null)) as Board;
    const card = (name: string, moves: { x: number, y: number }[]): Card => ({ name, description: 'Mock', color: 'red', moves });

    const board = emptyBoard();
    board[0][2] = { type: 'master', color: 'red' };
    board[4][2] = { type: 'master', color: 'blue' };

    const blueHand: [Card, Card] = [card('Azul A', []), card('Azul B', [])];

    it('Debe descartar la carta que le deja más movilidad con la mano resultante', () => {
        const useful = card('Útil', [{ x: 0, y: -1 }, { x: 1, y: 0 }]);
        const useless = card('Inútil', [{ x: 0, y: 1 }]);
        const neutral = card('Neutral', []);

        const handUsefulFirst: GameState['cards'] = { red: [useful, useless], blue: blueHand, neutral };
        const handUselessFirst: GameState['cards'] = { red: [useless, useful], blue: blueHand, neutral };

        expect(AiPlayer.selectDiscard(board, 'red', handUsefulFirst)).toBe('Inútil');
        expect(AiPlayer.selectDiscard(board, 'red', handUselessFirst)).toBe('Inútil');
    });

    it('Si ninguna carta tiene movimientos legales, debe descartar la que tiene menos movimientos posibles', () => {
        const blocked1 = card('Bloqueada 1', [{ x: 0, y: 1 }]);
        const blocked2 = card('Bloqueada 2', [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: -1, y: 1 }]);
        const neutral = card('Neutral', [{ x: 0, y: -1}]);
        
        const blocked1First: GameState['cards'] = { red: [blocked1, blocked2], blue: blueHand, neutral };
        const blocked2First: GameState['cards'] = { red: [blocked2, blocked1], blue: blueHand, neutral };

        expect(AiPlayer.selectDiscard(board, 'red', blocked1First)).toBe('Bloqueada 1');
        expect(AiPlayer.selectDiscard(board, 'red', blocked2First)).toBe('Bloqueada 1');
    });

    it('Debe devolver siempre el nombre de una carta que esté en la mano del jugador', () => {
        const a = card('A', [{ x: 0, y: -1 }]);
        const b = card('B', [{ x: 1, y: 0 }]);
        const cards: GameState['cards'] = { red: [a, b], blue: blueHand, neutral: card('Neutral', []) };
        expect(['A', 'B']).toContain(AiPlayer.selectDiscard(board, 'red', cards));
    });
});