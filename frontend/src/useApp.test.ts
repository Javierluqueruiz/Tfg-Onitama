import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { SocketEvents, type ChatMessage } from '../../shared';
import { createMockSocket } from './test-utils/mockSocket';
import { buildGameState, buildPlayers, buildReconnectPayload } from './test-utils/gameFixtures';
import { useSocket } from './contexts/SocketContext';
import { useApp } from './useApp';

vi.mock('./contexts/SocketContext');

const chatMessage = (text: string): ChatMessage => ({ socketId: 'rival-socket', name: 'Rival', message: text, timestamp: 1 });

describe('useApp: restauración de la partida al reconectar', () => {
    let socket: ReturnType<typeof createMockSocket>;

    beforeEach(() => {
        localStorage.clear();
        socket = createMockSocket();
        vi.mocked(useSocket).mockReturnValue({ socket, isConnected: true, lastError: null, setLastError: vi.fn() } as unknown as ReturnType<typeof useSocket>);
    });

    it('arranca sin partida ni datos restaurados', () => {
        const { result } = renderHook(() => useApp());

        expect(result.current.gameState).toBeNull();
        expect(result.current.restored).toBeNull();
    });

    it('al reconectar restaura la partida, el color del jugador y los datos que envía el servidor', () => {
        const { result } = renderHook(() => useApp());

        act(() => {
            socket.trigger(SocketEvents.RECONNECT_SUCCESS, buildReconnectPayload({
                chatHistory: [chatMessage('suerte')],
                drawOffered: true,
            }));
        });

        expect(result.current.gameState?.roomId).toBe('room-test');
        expect(result.current.localColor).toBe('blue');
        expect(result.current.restored).toEqual({
            chatHistory: [chatMessage('suerte')],
            drawOffered: true,
            rematchOffered: false,
        });
    });

    it('usa valores vacíos si la reconexión no trae historial ni ofertas', () => {
        const { result } = renderHook(() => useApp());

        act(() => {
            socket.trigger(SocketEvents.RECONNECT_SUCCESS, { gameState: buildGameState(), players: buildPlayers() });
        });

        expect(result.current.restored).toEqual({ chatHistory: [], drawOffered: false, rematchOffered: false });
    });

    it('una partida nueva (GAME_START) descarta los datos restaurados', () => {
        const { result } = renderHook(() => useApp());

        act(() => {
            socket.trigger(SocketEvents.RECONNECT_SUCCESS, buildReconnectPayload({ chatHistory: [chatMessage('viejo')] }));
        });
        expect(result.current.restored).not.toBeNull();

        act(() => {
            socket.trigger(SocketEvents.GAME_START, { gameState: buildGameState(), players: buildPlayers() });
        });

        expect(result.current.restored).toBeNull();
    });
});
