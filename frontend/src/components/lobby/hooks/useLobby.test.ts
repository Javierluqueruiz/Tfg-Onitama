import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Socket } from 'socket.io-client';
import { SocketEvents } from '../../../../../shared';
import { createMockSocket } from '../../../test-utils/mockSocket';
import { useSocket } from '../../../contexts/SocketContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useLobby } from './useLobby';

vi.mock('../../../contexts/SocketContext');
vi.mock('../../../contexts/AuthContext');

describe('useLobby', () => {
    const setUp = () => {
        const socket = createMockSocket();
        const setLastError = vi.fn();
        vi.mocked(useSocket).mockReturnValue({ socket: socket as unknown as Socket, isConnected: true, lastError: null, setLastError });
        vi.mocked(useAuth).mockReturnValue({
            user: null, isAuthenticated: false, isLoading: false,
            login: vi.fn(), logout: vi.fn(), register: vi.fn(), updateUser: vi.fn()
        });

        const { result } = renderHook(() => useLobby());
        return { socket, setLastError, result };
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    //FEAT-15 (Sub-15.4)
    it.each([
        { engine: 'heuristic', difficulty: 'easy' },
        { engine: 'minimax', difficulty: 'hard' }
    ] as const)('startAiGame emite CREATE_AI_ROOM con engine $engine y dificultad $difficulty', ({ engine, difficulty }) => {
        const { socket, setLastError, result } = setUp();

        act(() => {
            result.current.startAiGame(engine, difficulty);
        });

        expect(socket.emit).toHaveBeenCalledWith(SocketEvents.CREATE_AI_ROOM, { engine, difficulty });
        expect(setLastError).toHaveBeenCalledWith(null);
    });
});