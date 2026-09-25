import { describe, expect, it } from 'vitest';
import { Board, Card, GameState } from '../../../shared';
import { HeuristicEvaluator, DEFAULT_EVALUATOR_WEIGHTS } from '../../src/ai/HeuristicEvaluator';

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

    describe('amenaza inmediata', () => {
        const forwardCard: Card = { name: 'Forward', description: 'Mock', color: 'red', moves: [{ x: 0, y: -1 }] };
        const sideCard: Card = { name: 'Side', description: 'Mock', color: 'red', moves: [{ x: 1, y: 0 }] };

        const boardNearTemple = (): Board => {
            const board = emptyBoard();
            board[3][2] = { type: 'master', color: 'red' }; // Maestro rojo cerca del templo azul
            board[0][0] = { type: 'master', color: 'blue' }; // Maestro azul lejos
            return board;
        };

        const withRedHand = (card: Card): GameState['cards'] => ({
            red: [card, noMoveCard],
            blue: [noMoveCard, noMoveCard],
            neutral: noMoveCard
        });

        it('Debe penalizar una posición donde el oponente puede ganar en su próximo turno', () => {
            const cards = withRedHand(forwardCard);
            const withThreat = HeuristicEvaluator.evaluate(boardNearTemple(), 'blue', cards);
            const withoutThreat = HeuristicEvaluator.evaluate(boardNearTemple(), 'blue', cards, { ...DEFAULT_EVALUATOR_WEIGHTS, threat: 0 });
            expect(withThreat).toBe(withoutThreat - 1000);
        });

        it('No debe penalizar una posición donde el oponente no puede ganar en su próximo turno', () => {
            const cards = withRedHand(sideCard);
            const withThreat = HeuristicEvaluator.evaluate(boardNearTemple(), 'blue', cards);
            const withoutThreat = HeuristicEvaluator.evaluate(boardNearTemple(), 'blue', cards, { ...DEFAULT_EVALUATOR_WEIGHTS, threat: 0 });

            expect(withThreat).toBe(withoutThreat);
        });
    });

    describe('FEAT-15 (Sub-15.3): quién mueve en la hoja', () => {
        const captureCard: Card = { name: 'Capture', description: 'Mock', color: 'red', moves: [{ x: 0, y: -1 }] };
        const withouhThreat = { ...DEFAULT_EVALUATOR_WEIGHTS, threat: 0 };

        const adjacentMasters = (): Board => {
            const board = emptyBoard();
            board[2][2] = { type: 'master', color: 'red' };
            board[3][2] = { type: 'master', color: 'blue' };
            return board;
        };

        const hands = (red: Card, blue: Card): GameState['cards'] => ({
            red: [red, noMoveCard],
            blue: [blue, noMoveCard],
            neutral: noMoveCard
        });

        const bothCapture = hands(captureCard, captureCard);
        const base = HeuristicEvaluator.evaluate(adjacentMasters(), 'red', bothCapture, withouhThreat);

        it('Si no se indica el turno, se comporta como si le tocara al rival', () => {
            const withoutTurn = HeuristicEvaluator.evaluate(adjacentMasters(), 'red', bothCapture);
            const rivalTurn = HeuristicEvaluator.evaluate(adjacentMasters(), 'red', bothCapture, DEFAULT_EVALUATOR_WEIGHTS, 'blue');

            expect(withoutTurn).toBe(rivalTurn);
        });

        it('Si le toca al rival y puede ganar, se penaliza', () => {
            expect(HeuristicEvaluator.evaluate(adjacentMasters(), 'red', bothCapture, DEFAULT_EVALUATOR_WEIGHTS, 'blue')).toBe(base - DEFAULT_EVALUATOR_WEIGHTS.threat);
        });

        it('Si le toca al jugador y puede ganar, se premia', () => {
            expect(HeuristicEvaluator.evaluate(adjacentMasters(), 'red', bothCapture, DEFAULT_EVALUATOR_WEIGHTS, 'red')).toBe(base + DEFAULT_EVALUATOR_WEIGHTS.threat);
        });

        it('Si le toca al jugador y solo el rival puede ganar, no penaliza', () => {
            const onlyRivalCanWin = hands(noMoveCard, captureCard);
            const noThreatScore = HeuristicEvaluator.evaluate(adjacentMasters(), 'red', onlyRivalCanWin, withouhThreat);

            expect(HeuristicEvaluator.evaluate(adjacentMasters(), 'red', onlyRivalCanWin, DEFAULT_EVALUATOR_WEIGHTS, 'red')).toBe(noThreatScore);
        });

        it('Si le toca al rival y solo el jugador puede ganar, no premia', () => {
            const onlyPlayerCanWin = hands(captureCard, noMoveCard);
            const noThreatScore = HeuristicEvaluator.evaluate(adjacentMasters(), 'red', onlyPlayerCanWin, withouhThreat);

            expect(HeuristicEvaluator.evaluate(adjacentMasters(), 'red', onlyPlayerCanWin, DEFAULT_EVALUATOR_WEIGHTS, 'blue')).toBe(noThreatScore);
        });
    });
});