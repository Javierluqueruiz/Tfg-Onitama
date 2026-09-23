import { describe, it, expect, vi, afterEach } from 'vitest';
import { Board, Card, GameState, PlayerColor } from '../../../shared/index';
import { DiscardMode, MinimaxPlayer } from '../../src/ai/MinimaxPlayer';
import { AiPlayer } from '../../src/ai/AiPlayer';
import { HeuristicEvaluator, DEFAULT_EVALUATOR_WEIGHTS } from '../../src/ai/HeuristicEvaluator';
import { GameEngine } from '../../src/game/GameEngine';
import { MoveArbitrator, LegalMove } from '../../src/game/MoveArbitrator';
import { MovementManager } from '../../src/game/MovementManager';
import { DeckManager } from '../../src/game/DeckManager';
import { ONITAMA_DECK } from '../../src/game/onitamaDeck';

describe('FEAT-15 (Sub-15.1) - MinimaxPlayer.selectMove', () => {
    const emptyBoard = (): Board => Array(5).fill(null).map(() => Array(5).fill(null)) as Board;
    const passiveCard: Card = { name: 'Passive', description: 'Does nothing', color: 'red', moves: [] };

    const buildState = (board: Board, currentTurn: PlayerColor, cards: GameState['cards']): GameState => ({
        roomId: 'test-room',
        status: 'in_progress',
        currentTurn,
        board, 
        cards, 
        winner: null,
        timeRemaining: { red: 0, blue: 0 }
    });

    const randomPosition = (plies: number): GameState => {
        for (;;) {
            let state: GameState = { ...GameEngine.createNewGame('test-room'), status: 'in_progress'};

            for (let i = 0; i < plies && state.status === 'in_progress'; i++) {
                const moves = MoveArbitrator.generateLegalMoves(state.board, state.currentTurn, state.cards[state.currentTurn]);
                const move = moves[Math.floor(Math.random() * moves.length)];
                state = GameEngine.processTurn(state, move.from, move.to, move.cardName);
            }

            if (state.status === 'in_progress') return state;
        }
    };

    const scoreAfter = (state: GameState, move: LegalMove): number => {
        const board = MovementManager.movePiece(state.board, move.from, move.to).newBoard;
        const cards = DeckManager.playCard(state.cards, state.currentTurn, move.cardName);
        return HeuristicEvaluator.evaluate(board, state.currentTurn, cards);
    };

    it('Debe devolver siempre un movimiento legal', () => {
        const state = randomPosition(4);
        const legalMoves = MoveArbitrator.generateLegalMoves(state.board, state.currentTurn, state.cards[state.currentTurn]);

        expect(legalMoves).toContainEqual(MinimaxPlayer.selectMove(state, { depth: 2 }));
    });

    it.each([0, -1, 1.5])('Debe lanzar un error si la profundidad no es un entero mayor o igual a 1 (depth = %d)', (depth) => {
        const state = randomPosition(4);

        expect(() => MinimaxPlayer.selectMove(state, { depth })).toThrowError('La profundidad debe ser un entero mayor o igual a 1');
    });

    it.each([1, 2])('A profundidad %i, debe tomar la victoria inmediata si está disponible', (depth) => {
        const board: Board = emptyBoard();
        board[0][2] = { type: 'master', color: 'red' };
        board[1][2] = { type: 'master', color: 'blue' };

        const captureCard: Card = { name: 'Capture', description: '', color: 'red', moves: [{ x: 1, y: 0 }, { x: 0, y: -1 }] };
        const cards: GameState['cards'] = { red: [captureCard, passiveCard], blue: [passiveCard, passiveCard], neutral: passiveCard };

        expect(MinimaxPlayer.selectMove(buildState(board, 'red', cards), { depth })).toEqual({ from: { x: 2, y: 0 }, to: { x: 2, y: 1 }, cardName: 'Capture' });
    });

    it('A profundidad 1, debe dar la misma puntuación que el evaluador heurístico en nivel difícil', () => {
        for (let i = 0; i < 30; i++) {
            const state = randomPosition(2 + Math.floor(Math.random() * 10));
            const minimaxMove = MinimaxPlayer.selectMove(state, { depth: 1 });
            const heuristicMove = AiPlayer.selectMove(state.board, state.currentTurn, state.cards, { difficulty: 'hard' });

            expect(scoreAfter(state, minimaxMove)).toBe(scoreAfter(state, heuristicMove));
        }
    });

    it('Debe lanzar un error si el jugador no tiene movimientos legales', () => {
        const board: Board = emptyBoard();
        board[0][2] = { type: 'master', color: 'red' };
        board[4][2] = { type: 'master', color: 'blue' };
        const cards: GameState['cards'] = { red: [passiveCard, passiveCard], blue: [passiveCard, passiveCard], neutral: passiveCard };

        expect(() => MinimaxPlayer.selectMove(buildState(board, 'red', cards), { depth: 2 })).toThrowError('No hay movimientos legales disponibles para el jugador actual');
    });

    it('Si varias jugadas tienen la misma puntuación, debe elegir una al azar', () => {
        const board: Board = emptyBoard();
        board[2][2] = { type: 'master', color: 'red' };
        board[4][2] = { type: 'master', color: 'blue' };

        const sidesCard: Card = { name: 'Sides', description: '', color: 'red', moves: [{ x: 1, y: 0 }, { x: -1, y: 0 }] };
        const state = buildState(board, 'red', { red: [sidesCard, passiveCard], blue: [passiveCard, passiveCard], neutral: passiveCard });

        expect(MinimaxPlayer.selectMove(state, { depth: 1, random: () => 0 })).toEqual({ from: { x: 2, y: 2 }, to: { x: 1, y: 2 }, cardName: 'Sides' });
        expect(MinimaxPlayer.selectMove(state, { depth: 1, random: () => 0.999 })).toEqual({ from: { x: 2, y: 2 }, to: { x: 3, y: 2 }, cardName: 'Sides' });
    });

    it('Toma la victoria inmediata aunque haya otra jugada que gane más adelante', () => {
        const board: Board = emptyBoard();
        board[0][0] = { type: 'master', color: 'red' };
        board[0][2] = { type: 'student', color: 'red' };
        board[1][2] = { type: 'master', color: 'blue' };

        const captureCard: Card = { name: 'Capture', description: '', color: 'red', moves: [ { x: 0, y: -1 }] };
        const shuffleCard: Card = { name: 'Shuffle', description: '', color: 'red', moves: [ { x: -1, y: 0 }] };
        const state = buildState(board, 'red', { red: [captureCard, shuffleCard], blue: [passiveCard, passiveCard], neutral: passiveCard });

        expect(MinimaxPlayer.selectMove(state, { depth: 3, random: () => 0 })).toEqual({ from: { x: 2, y: 0 }, to: { x: 2, y: 1 }, cardName: 'Capture' });
    });

    describe('La búsqueda va más allá de lo que el evaluador heurístico puede ver', () => {
        const board: Board = emptyBoard();
        board[2][2] = { type: 'master', color: 'red' };
        board[4][2] = { type: 'master', color: 'blue' };

        const redCard: Card = { name: 'RedCard', description: '', color: 'red', moves: [{ x: 0, y: -1 }, { x: -1, y: -1 }] };
        const blueCard: Card = { name: 'BlueCard', description: '', color: 'blue', moves: [{ x: 0, y: -1 }] };
        const state = buildState(board, 'red', { red: [redCard, passiveCard], blue: [blueCard, passiveCard], neutral: passiveCard });

        const withoutThreat = { ...DEFAULT_EVALUATOR_WEIGHTS, threat: 0 };
        const unsafeMove = { from: { x: 2, y: 2 }, to: { x: 2, y: 3 }, cardName: 'RedCard' };
        const safeMove = { from: { x: 2, y: 2 }, to: { x: 3, y: 3 }, cardName: 'RedCard' };

        it('A profundidad 1, sin amenaza, cae en la trampa', () => {
            expect(MinimaxPlayer.selectMove(state, { depth: 1, weights: withoutThreat })).toEqual(unsafeMove);
        });

        it('A profundidad 2, sin amenaza, evita la trampa', () => {
            expect(MinimaxPlayer.selectMove(state, { depth: 2, weights: withoutThreat })).toEqual(safeMove);
        });

        it('A profundidad 2, supone que el oponente elige la mejor jugada', () => {
            const twoReplyBlueCard: Card = { name: 'BlueCard', description: '', color: 'blue', moves: [{ x: 0, y: -1 }, { x: 1, y: 0 }] };

            const twoReplyState = buildState(board, 'red', { red: [redCard, passiveCard], blue: [twoReplyBlueCard, passiveCard], neutral: passiveCard });

            expect(MinimaxPlayer.selectMove(twoReplyState, { depth: 2, weights: withoutThreat })).toEqual(safeMove);
        });
    });

    afterEach(() => { vi.resetAllMocks(); });

    describe('selectDiscard', () => {
        const mockCard = (name: string, moves: { x: number, y: number }[]): Card => ({ name, description: '', color: 'red', moves });

        const board: Board = emptyBoard();
        board[0][2] = { type: 'master', color: 'red' };
        board[4][2] = { type: 'master', color: 'blue' };

        const blueHand: [Card, Card] = [mockCard('Azul A', []), mockCard('Azul B', [])];
        const useful = mockCard('Útil', [{ x: 0, y: -1 }, { x: 1, y: 0 }]);
        const useless = mockCard('Inútil', [{ x: 0, y: 1 }]);
        const neutral = mockCard('Neutral', []);

        const discardState = (hand: [Card, Card]): GameState => ({ ...buildState(board, 'red', { red: hand, blue: blueHand, neutral }), status: 'waiting_for_discard' });

        it.each([[useful, useless], [useless, useful]])('A profundidad 1, descarta la carta que deja más movilidad, sea cual sea su orden en la mano', (a, b) => {
            expect(MinimaxPlayer.selectDiscard(discardState([a, b]), { depth: 1 })).toBe('Inútil');
        });

        it('Devuelve siempre el nombre de una cara de la mano', () => {
            expect(['Útil', 'Inútil']).toContain(MinimaxPlayer.selectDiscard(discardState([useful, useless]), { depth: 2 }));
        });

        it('Lanza un error si la partida no está en estado de espera de descarte', () => {
            const state = buildState(board, 'red', { red: [useful, useless], blue: blueHand, neutral });
            expect(() => MinimaxPlayer.selectDiscard(state, { depth: 1 })).toThrowError('La partida no está esperando un descarte');
        });

        it('en modo heuristic, la elección la hace ApiPlayer.selectDiscard', () => {
            vi.spyOn(AiPlayer, 'selectDiscard').mockReturnValue('Útil');
            expect(MinimaxPlayer.selectDiscard(discardState([useful, useless]), { depth: 1, discardMode: 'heuristic' })).toBe('Útil');
        });
    });

    describe('Nodos de descarte forzados dentro del árbol de búsqueda', () => {
        const deckCard = (name: string): Card => ONITAMA_DECK.find(card => card.name === name) as Card;
        const columnState = (): GameState => {
            const board: Board = emptyBoard();
            for (const y of [0, 1, 3, 4]) board[y][4] = { type: 'student', color: 'red' };
            board[2][4] = { type: 'master', color: 'red' };
            board[2][2] = { type: 'master', color: 'blue' };
            
            return buildState(board, 'blue', { red: [deckCard('Tiger'), deckCard('Horse')], blue: [deckCard('Dragon'), deckCard('Frog')], neutral: deckCard('Rabbit') });
        };

        it('En modo search, explora las dos cartas de cada nodo de descarte', () => {
            const discardSpy = vi.spyOn(GameEngine, 'discardCard');

            MinimaxPlayer.selectMove(columnState(), { depth: 2, discardMode: 'search' });

            expect(discardSpy).toHaveBeenCalledTimes(12); // 3 nodos de descarte * 2 cartas * 2 turnos
        });

        it('En modo heuristic, solo explora una carta por nodo de descarte', () => {
            const discardSpy = vi.spyOn(GameEngine, 'discardCard');
            const heuristicSpy = vi.spyOn(AiPlayer, 'selectDiscard');

            MinimaxPlayer.selectMove(columnState(), { depth: 2, discardMode: 'heuristic' });

            expect(discardSpy).toHaveBeenCalledTimes(6); // 3 nodos de descarte * 1 carta * 2 turnos
            expect(heuristicSpy).toHaveBeenCalledTimes(6);
        });


    });

    describe('Partidas completas contra un rival que juega al azar', () => {
        const playGame = (minimaxColor: PlayerColor, discardMode: DiscardMode): GameState => {
            let state: GameState = { ...GameEngine.createNewGame('test-room'), status: 'in_progress' };

            for (let ply = 0; ply < 300 && state.status !== 'finished'; ply++) {
                const turn = state.currentTurn;
                const isMinimax = turn === minimaxColor;

                if (state.status === 'waiting_for_discard') {
                    const hand = state.cards[turn];
                    const cardName = isMinimax
                        ? MinimaxPlayer.selectDiscard(state, { depth: 3, discardMode })
                        : hand[Math.floor(Math.random() * hand.length)].name;
                    state = GameEngine.discardCard(state, cardName);
                } else {
                    const legalMoves = MoveArbitrator.generateLegalMoves(state.board, turn, state.cards[turn]);
                    const move = isMinimax
                        ? MinimaxPlayer.selectMove(state, { depth: 3, discardMode })
                        : legalMoves[Math.floor(Math.random() * legalMoves.length)];
                    state = GameEngine.processTurn(state, move.from, move.to, move.cardName);
                }
            }
            return state;
        };

        it.each(['search', 'heuristic'] as const)('En modo %s, termina todas las partidas sin errores y gana la mayoría de ellas', (discardMode) => {
            let wins = 0;

            for(let game = 0; game < 10; game++) {
                const minimaxColor: PlayerColor = game % 2 === 0 ? 'red' : 'blue';
                const finalState = playGame(minimaxColor, discardMode);

                expect(finalState.status).toBe('finished');
                if (finalState.winner === minimaxColor) wins++;
            }

            expect(wins).toBeGreaterThanOrEqual(9); 
        }, 30000); 
    });
    
});