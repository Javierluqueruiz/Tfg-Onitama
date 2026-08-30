import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Socket } from 'socket.io-client';
import { SocketEvents } from '../../../../../shared';
import { useNetwork } from './useNetwork';
import { createMockSocket } from '../../../test-utils/mockSocket';


describe('useNetwork', () => {

    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('Empieza con el temporizador de desconexión en null y el mensaje de reconexión en false', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useNetwork(socket as unknown as Socket, 'in_progress'));
        
        expect(result.current.disconnectTimer).toBeNull();
        expect(result.current.reconnectMessage).toBe(false);
        expect(result.current.timeRemaining).toEqual({ red: 0, blue: 0 });
    });

    it('Actualiza el temporizador de desconexión al recibir OPPONENT_DISCONNECTED', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useNetwork(socket as unknown as Socket, 'in_progress'));

        act(() => {
            socket.trigger(SocketEvents.OPPONENT_DISCONNECTED, { timeLimit: 30000 });
        });
        
        expect(result.current.disconnectTimer).toBe(30);

    });

    it('El temporizador de desconexión disminuye cada segundo', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useNetwork(socket as unknown as Socket, 'in_progress'));

        act(() => {
            socket.trigger(SocketEvents.OPPONENT_DISCONNECTED, { timeLimit: 3000 });
        });
        expect(result.current.disconnectTimer).toBe(3);

        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(result.current.disconnectTimer).toBe(2);

        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(result.current.disconnectTimer).toBe(0);
    });

    it('OPPONENT_RECONNECTED resetea el temporizador de desconexión y muestra el mensaje de reconexión', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useNetwork(socket as unknown as Socket, 'in_progress'));
        act(() => {
            socket.trigger(SocketEvents.OPPONENT_DISCONNECTED, { timeLimit: 30000 });
        });

        act(() => {
            socket.trigger(SocketEvents.OPPONENT_RECONNECTED);
        });

        expect(result.current.disconnectTimer).toBeNull();
        expect(result.current.reconnectMessage).toBe(true);

        act(() => {
            vi.advanceTimersByTime(3000);
        });
        expect(result.current.reconnectMessage).toBe(false);
    });

    it('TIME_TICK actualiza el tiempo restante', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useNetwork(socket as unknown as Socket, 'in_progress'));

        act(() => {
            socket.trigger(SocketEvents.TIME_TICK, { timeRemaining: { red: 120, blue: 90 } });
        });
        expect(result.current.timeRemaining).toEqual({ red: 120, blue: 90 });
    });

    it('GAME_START sincroniza el tiempo de la partida y limpia el estado de desconexión', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useNetwork(socket as unknown as Socket, 'in_progress'));

        act(() => {
            socket.trigger(SocketEvents.OPPONENT_DISCONNECTED, { timeLimit: 30000 });
        });
        expect(result.current.disconnectTimer).toBe(30);

        act(() => {
            socket.trigger(SocketEvents.GAME_START, { gameState: { timeRemaining: { red: 300, blue: 300 } } });
        });

        expect(result.current.timeRemaining).toEqual({ red: 300, blue: 300 });
        expect(result.current.disconnectTimer).toBeNull();
        expect(result.current.reconnectMessage).toBe(false);
    });

    it('Limpia la sesión al finalizar la partida', () => {
        localStorage.setItem('onitama_session', JSON.stringify({ some: 'data' }));
        const socket = createMockSocket();
        const { rerender} = renderHook(({ status }) => useNetwork(socket as unknown as Socket, status), { initialProps: { status: 'in_progress' } });

        expect(localStorage.getItem('onitama_session')).not.toBeNull();

        rerender({ status: 'finished' });

        expect(localStorage.getItem('onitama_session')).toBeNull();
    });
});