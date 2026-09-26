import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Server } from 'socket.io';
import { AiDifficulty, AiEngine, PlayerColor, PlayerProfile, SocketEvents } from '../../../shared/index';
import { AiTurnRunner } from '../../src/network/AiTurnRunner';
import { RoomManager } from '../../src/network/RoomManager';
import { GameEngine } from '../../src/game/GameEngine';
import { MoveArbitrator } from '../../src/game/MoveArbitrator';
import { AiPlayer } from '../../src/ai/AiPlayer';
import { MinimaxPlayer } from '../../src/ai/MinimaxPlayer';

describe('FEAT-14 (Sub-14.3): AiTurnRunner', () => {
    const hostProfile: PlayerProfile = { socketId: 'hostSocket', name: 'Host' };
    let emit: ReturnType<typeof vi.fn>;
    let io: Server;

    const createAiGame = (difficulty: AiDifficulty = 'hard', engine: AiEngine = 'heuristic') => {
        const room = RoomManager.createAiRoom(hostProfile, engine, difficulty);
        const aiColor: PlayerColor = room.players.red?.isAi ? 'red' : 'blue';
        const humanColor: PlayerColor = aiColor === 'red' ? 'blue' : 'red';
        return { room, aiColor, humanColor };
    };

    beforeEach(() => {
        vi.useFakeTimers();
        RoomManager.clearActiveRooms();
        emit = vi.fn();
        io = { to: vi.fn(() => ({ emit })) } as unknown as Server;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('Debe esperar un tiempo antes de ejecutar el turno del AI', () => {
        const { room, aiColor, humanColor } = createAiGame();
        room.gameState.currentTurn = aiColor;

        AiTurnRunner.maybePlayTurn(io, room.roomId);
        expect(emit).not.toHaveBeenCalled();

        vi.runOnlyPendingTimers();

        expect(io.to).toHaveBeenCalledWith(room.roomId);
        expect(emit).toHaveBeenCalledTimes(1);
        expect(emit).toHaveBeenCalledWith(SocketEvents.GAME_UPDATE, { gameState: room.gameState });
        expect(room.gameState.currentTurn).toBe(humanColor);
        expect(room.gameState.lastMove).toBeDefined();
    });

    it('Debe descartar una carta cuando la IA no tiene movimientos legales', () => {
        const { room, aiColor, humanColor } = createAiGame();
        room.gameState.currentTurn = aiColor;
        room.gameState.status = 'waiting_for_discard';
        const previousNeutral = room.gameState.cards.neutral;
        const previousHandsNames = room.gameState.cards[aiColor].map(card => card.name);
        
        AiTurnRunner.maybePlayTurn(io, room.roomId);
        vi.runOnlyPendingTimers();

        const { cards } = room.gameState;
        expect(previousHandsNames).toContain(cards.neutral.name);
        expect(cards[aiColor].map(card => card.name)).toContain(previousNeutral.name);
        expect(room.gameState.currentTurn).toBe(humanColor);
        expect(room.gameState.lastMove).toBeUndefined();
        expect(emit).toHaveBeenCalledTimes(1);
    });

    it('No debe hacer nada si no es el turno de la IA', () => {
        const { room, humanColor } = createAiGame();
        room.gameState.currentTurn = humanColor;

        AiTurnRunner.maybePlayTurn(io, room.roomId);

        expect(emit).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('No debe hacer nada si la partida es entre dos humanos', () => {
        const room = RoomManager.createRoom(hostProfile, 'casual');
        const guest: PlayerProfile = { socketId: 'guestSocket', name: 'Guest' };
        if (room.players.red) room.players.blue = guest; else room.players.red = guest;
        room.gameState = GameEngine.createNewGame(room.roomId);

        AiTurnRunner.maybePlayTurn(io, room.roomId);

        expect(emit).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('No debe hacer nada si la partida termina mientras la IA piensa', () => {
        const { room, aiColor } = createAiGame();
        room.gameState.currentTurn = aiColor;

        AiTurnRunner.maybePlayTurn(io, room.roomId);
        room.gameState.status = 'finished';
        vi.runOnlyPendingTimers();

        expect(emit).not.toHaveBeenCalled();
    });

    it('No debe fallar si la sala es destruida mientras la IA piensa', () => {
        const { room, aiColor } = createAiGame();
        room.gameState.currentTurn = aiColor;

        AiTurnRunner.maybePlayTurn(io, room.roomId);
        RoomManager.deleteRoom(room.roomId);
        expect(() => vi.runOnlyPendingTimers()).not.toThrow();
        expect(emit).not.toHaveBeenCalled();
    });

    const playGamesAgainstRandomHuman = (games: number, difficulty: AiDifficulty, engine: AiEngine) => {
        for (let game = 0; game < games; game++) {
            const { room, humanColor } = createAiGame(difficulty, engine);

            for (let step = 0; step < 300 && room.gameState.status !== 'finished'; step++) {
                const state = room.gameState;

                if (state.currentTurn === humanColor) {
                    if (state.status === 'waiting_for_discard') {
                        RoomManager.applyDiscard(room.roomId, state.cards[humanColor][0].name);
                    } else {
                        const moves = MoveArbitrator.generateLegalMoves(state.board, humanColor, state.cards[humanColor]);
                        const move = moves[Math.floor(Math.random() * moves.length)];
                        RoomManager.applyMove(room.roomId, move.from, move.to, move.cardName);
                    }
                } else {
                    AiTurnRunner.maybePlayTurn(io, room.roomId);
                    vi.runOnlyPendingTimers();
                }
            }

            expect(room.gameState.status).toBe('finished');
            expect(room.gameState.winner).not.toBeNull();
        }
    }

    it('Debe completar partidas enteras contra un humano que juega al azar, sin erores ni bloqueos', () => {
        playGamesAgainstRandomHuman(20, 'hard', 'heuristic');
    });
    
    it('Debe guardar la dificultad elegida en el perfil de la IA', () => {
        const { room, aiColor, humanColor } = createAiGame('medium');

        expect(room.players[aiColor]?.isAi).toBe(true);
        expect(room.players[aiColor]?.aiDifficulty).toBe('medium');
        expect(room.players[humanColor]?.aiDifficulty).toBeUndefined();
    });

    it.each([
        { engine: 'heuristic', difficulty: 'easy' }, { engine: 'heuristic', difficulty: 'medium' }, { engine: 'heuristic', difficulty: 'hard' },
        { engine: 'minimax', difficulty: 'easy' }, { engine: 'minimax', difficulty: 'medium' }, { engine: 'minimax', difficulty: 'hard' }
    ] as const)('Debe guardar el motor $engine y la dificultad $difficulty elegidos en el perfil de la IA', ({ engine, difficulty }) => {
        const { room, aiColor, humanColor } = createAiGame(difficulty, engine);

        expect(room.players[aiColor]?.aiEngine).toBe(engine);
        expect(room.players[aiColor]?.aiDifficulty).toBe(difficulty);
        expect(room.players[humanColor]?.aiEngine).toBeUndefined();
    });

    it.each([
        { engine: 'heuristic', difficulty: 'easy', name : 'IA Heurística (Fácil)' },
        { engine: 'minimax', difficulty: 'hard', name : 'IA Minimax (Difícil)' }
    ] as const)('Debe usar el nombre "$name" para el perfil de la IA en partidas de dificultad "$difficulty"', ({ engine, difficulty, name }) => {
        const { room, aiColor } = createAiGame(difficulty, engine);

        expect(room.players[aiColor]?.name).toBe(name);
    });

    it.each(['easy', 'medium', 'hard'] as const)('Debe jugar con la dificultad %s correctamente', (difficulty) => {
        const selectMove = vi.spyOn(AiPlayer, 'selectMove');
        const { room, aiColor } = createAiGame(difficulty);
        room.gameState.currentTurn = aiColor;

        AiTurnRunner.maybePlayTurn(io, room.roomId);
        vi.runOnlyPendingTimers();

        expect(selectMove).toHaveBeenCalledTimes(1);
        expect(selectMove).toHaveBeenCalledWith(expect.anything(), aiColor, expect.anything(), { difficulty });
    });

    //FEAT-15 (Sub-15.4)
    const MINIMAX_LEVELS = [
        { difficulty: 'easy', depth: 2 },
        { difficulty: 'medium', depth: 3 },
        { difficulty: 'hard', depth: 4 }
    ] as const;

    it.each(MINIMAX_LEVELS)('Con Minimax en dificultad $difficulty, debe usar profundidad $depth', ({ difficulty, depth }) => {
        const minimaxMove = vi.spyOn(MinimaxPlayer, 'selectMove');
        const heuristicMove = vi.spyOn(AiPlayer, 'selectMove');
        const { room, aiColor } = createAiGame(difficulty, 'minimax');
        room.gameState.currentTurn = aiColor;

        AiTurnRunner.maybePlayTurn(io, room.roomId);
        vi.runOnlyPendingTimers();

        expect(minimaxMove).toHaveBeenCalledTimes(1);
        expect(minimaxMove).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ depth }));
        expect(heuristicMove).not.toHaveBeenCalled();
    });

    it.each(['easy', 'medium', 'hard'] as const)('Con la heurística en dificultad %s, no debe usar Minimax', (difficulty) => {
        const minimaxMove = vi.spyOn(MinimaxPlayer, 'selectMove');
        const heuristicMove = vi.spyOn(AiPlayer, 'selectMove');
        const { room, aiColor } = createAiGame(difficulty, 'heuristic');

        room.gameState.currentTurn = aiColor;
        AiTurnRunner.maybePlayTurn(io, room.roomId);
        vi.runOnlyPendingTimers();

        room.gameState.currentTurn = aiColor;
        room.gameState.status = 'waiting_for_discard';
        AiTurnRunner.maybePlayTurn(io, room.roomId);
        vi.runOnlyPendingTimers();

        expect(heuristicMove).toHaveBeenCalled();
        expect(minimaxMove).not.toHaveBeenCalled();
    });

    it.each(MINIMAX_LEVELS)('Con Minimax en dificultad $difficulty, debe usar profundidad $depth al descartar', ({ difficulty, depth }) => {
        const minimaxDiscard = vi.spyOn(MinimaxPlayer, 'selectDiscard');
        const heuristicDiscard = vi.spyOn(AiPlayer, 'selectDiscard');
        const { room, aiColor, humanColor } = createAiGame(difficulty, 'minimax');
        room.gameState.currentTurn = aiColor;
        room.gameState.status = 'waiting_for_discard';

        AiTurnRunner.maybePlayTurn(io, room.roomId);
        vi.runOnlyPendingTimers();

        expect(minimaxDiscard).toHaveBeenCalledTimes(1);
        expect(minimaxDiscard).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ depth }));
        expect(heuristicDiscard).not.toHaveBeenCalled();
        expect(room.gameState.currentTurn).toBe(humanColor);
    });

    it.each(MINIMAX_LEVELS)('Debe completar partidas enteras con Minimax en dificultad $difficulty contra un humano que juega al azar, sin erores ni bloqueos', ({ difficulty }) => {
        playGamesAgainstRandomHuman(5, difficulty, 'minimax');
    }, 30_000);

    it('Con Minimax y sin dificultad en el perfil, la IA busca a produndidad 4 ("hard") por defecto', () => {
        const minimaxMove = vi.spyOn(MinimaxPlayer, 'selectMove');
        const { room, aiColor } = createAiGame('easy', 'minimax');
        room.players[aiColor]!.aiDifficulty = undefined;
        room.gameState.currentTurn = aiColor;

        AiTurnRunner.maybePlayTurn(io, room.roomId);
        vi.runOnlyPendingTimers();

        expect(minimaxMove).toHaveBeenCalledTimes(1);
        expect(minimaxMove).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ depth: 4 }));
    });
});