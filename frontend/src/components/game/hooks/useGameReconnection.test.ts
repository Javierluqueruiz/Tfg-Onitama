import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Socket } from 'socket.io-client';
import { SocketEvents } from '../../../../../shared';
import { useGameReconnection } from './useGameReconnection';
import { createMockSocket } from '../../../test-utils/mockSocket';

describe('useGameReconnection', () => {

    beforeEach(() => {
        localStorage.clear();
    });

    it('No intenta reconectar si no hay una sesión guardada', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useGameReconnection(socket as unknown as Socket));

        act(() => {
            socket.trigger('connect');
        });

        expect(socket.emit).not.toHaveBeenCalledWith();
        expect(result.current.isReconnecting).toBe(false);
    });

    it('Intenta reconectar si hay una sesión guardada', () => {
        const socket = createMockSocket();
        localStorage.setItem('onitama_session', JSON.stringify({ roomId: 'room123', originalSocketId: 'socket456'
        }));

        const { result } = renderHook(() => useGameReconnection(socket as unknown as Socket));

        act(() => {
            socket.trigger('connect');
        });

        expect(socket.emit).toHaveBeenCalledWith(SocketEvents.RECONNECT_ATTEMPT, { roomId: 'room123', originalSocketId: 'socket456' });
        expect(result.current.isReconnecting).toBe(true);
    });

    it('RECONNECT_SUCCESS actualiza el estado correctamente', () => {
        localStorage.setItem('onitama_session', JSON.stringify({ roomId: 'room123', originalSocketId: 'socket456' }));
        const socket = createMockSocket();
        const { result } = renderHook(() => useGameReconnection(socket as unknown as Socket));

        act(() => {
            socket.trigger('connect');
        });
        expect(result.current.isReconnecting).toBe(true);
        
        act(() => {
            socket.trigger(SocketEvents.RECONNECT_SUCCESS);
        });

        expect(result.current.isReconnecting).toBe(false);
    });

    it('RECONNECT_FAILED elimina la sesión guardada y actualiza el estado correctamente', () => {
        localStorage.setItem('onitama_session', JSON.stringify({ roomId: 'room123', originalSocketId: 'socket456' }));
        const socket = createMockSocket();
        const { result } = renderHook(() => useGameReconnection(socket as unknown as Socket));

        act(() => {
            socket.trigger('connect');
        });
        expect(result.current.isReconnecting).toBe(true);

        act(() => {
            socket.trigger(SocketEvents.RECONNECT_FAILED);
        });

        expect(localStorage.getItem('onitama_session')).toBeNull();
        expect(result.current.isReconnecting).toBe(false);
    });
});