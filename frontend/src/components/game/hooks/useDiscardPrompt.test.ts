import { describe, it, expect } from 'vitest';
import { useDiscardPrompt } from './useDiscardPrompt';
import { createMockSocket } from '../../../test-utils/mockSocket';
import type { Socket } from 'socket.io-client';
import { renderHook } from '@testing-library/react';
import { SocketEvents, type GameState, type Board, type Card } from '../../../../../shared';

const mockCard: Card = { name: 'Tiger', description: '', color: 'red', moves: [] };

const createMockGameState = (overrides: Partial<GameState> = {}): GameState => ({
    roomId: 'test-room',
    board: Array(5).fill(null).map(() => Array(5).fill(null)) as Board,
    cards: { 
        red: [mockCard, mockCard],
        blue: [mockCard, mockCard],
        neutral: mockCard
    },
    currentTurn: 'red',
    status: 'in_progress',
    winner: null,
    timeRemaining: { red: 600, blue: 600 },
    ...overrides
});


describe('useDiscardPrompt', () => {
    it('mustDiscard es verdadero cuando la partida espera un descarte y el jugador actual es el que debe descartar', () => {
        const socket = createMockSocket();
        const gameState = createMockGameState({ status: 'waiting_for_discard', currentTurn: 'red' });
        const { result } = renderHook(() => useDiscardPrompt(socket as unknown as Socket, gameState, 'red'));

        expect(result.current.mustDiscard).toBe(true);
    });

    it('mustDiscard es falso cuando la partida no espera un descarte', () => {
        const socket = createMockSocket();
        const gameState = createMockGameState({ status: 'in_progress', currentTurn: 'red' });
        const { result } = renderHook(() => useDiscardPrompt(socket as unknown as Socket, gameState, 'red'));

        expect(result.current.mustDiscard).toBe(false);
    });

    it('mustDiscard es falso cuando la partida espera un descarte pero el jugador actual no es el que debe descartar', () => {
        const socket = createMockSocket();
        const gameState = createMockGameState({ status: 'waiting_for_discard', currentTurn: 'blue' });

        const { result } = renderHook(() => useDiscardPrompt(socket as unknown as Socket, gameState, 'red'));

        expect(result.current.mustDiscard).toBe(false);
    });

    it('handleDiscard emite DISCARD_CARD con el nombre de la carta', () => {
        const socket = createMockSocket();
        const gameState = createMockGameState({ status: 'waiting_for_discard', currentTurn: 'red' });
        const { result } = renderHook(() => useDiscardPrompt(socket as unknown as Socket, gameState, 'red'));

        result.current.handleDiscard('Tiger');
        expect(socket.emit).toHaveBeenCalledWith(SocketEvents.DISCARD_CARD, { cardName: 'Tiger' });
    });
});
