import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Server } from 'socket.io';
import { PlayerColor, PlayerProfile, SocketEvents } from '../../../shared/index';
import { AiTurnRunner } from '../../src/network/AiTurnRunner';
import { RoomManager } from '../../src/network/RoomManager';
import { GameEngine } from '../../src/game/GameEngine';
import { MoveArbitrator } from '../../src/game/MoveArbitrator';

describe('FEAT-14 (Sub-14.3): AiTurnRunner', () => {
    const hostProfile: PlayerProfile = { socketId: 'hostSocket', name: 'Host' };
    let emit: ReturnType<typeof vi.fn>;
    let io: Server;

    const createAiGame = () => {
        const room = RoomManager.createAiRoom(hostProfile);
        const aiColor: PlayerColor = room.players.red?.isAi ? 'red' : 'blue';
        const humanColor: PlayerColor = aiColor === 'red' ? 'blue' : 'red';
        return { room, aiColor, humanColor };
        expect(room.players[aiColor]?.isAi).toBe(true);
    };

    beforeEach(() => {
        vi.useFakeTimers();
        RoomManager.clearActiveRooms();
        emit = vi.fn();
        io = { to: vi.fn(() => ({ emit })) } as unknown as Server;
    });

    afterEach(() => {
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

    it('Debe completar partidas enteras contra un humano que juega al azar, sin erores ni bloqueos', () => {
        for (let game = 0; game < 20; game++) {
            const { room, humanColor } = createAiGame();

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
    });

});