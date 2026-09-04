import { describe, it, expect } from 'vitest';
import { useRematchNegotiation } from './useRematchNegotiation';
import { createMockSocket } from '../../../test-utils/mockSocket';
import type { Socket } from 'socket.io-client';
import { renderHook, act } from '@testing-library/react';
import { SocketEvents } from '../../../../../shared';

describe('useRematchNegotiation', () => {
    it('Empieza sin ninguna negociación', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useRematchNegotiation(socket as unknown as Socket));
        
        expect(result.current.rematchState).toBe('none');
        expect(result.current.timesOffered).toBe(0);
    });

    it('Cuando el servidor manda un REMATCH_OFFERED, rematchState se pone a received', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useRematchNegotiation(socket as unknown as Socket));

        act(() => {
            socket.trigger(SocketEvents.REMATCH_OFFERED);
        });

        expect(result.current.rematchState).toBe('received');
    });

    it('offerRematch emite OFFER_REMATCH y suma 1 a timesOffered', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useRematchNegotiation(socket as unknown as Socket));

        act(() => {
            result.current.offerRematch();
        });

        expect(socket.emit).toHaveBeenCalledWith(SocketEvents.OFFER_REMATCH);
        expect(result.current.timesOffered).toBe(1);
        expect(result.current.rematchState).toBe('offered');
    });

    it('acceptRematch emite ACCEPT_REMATCH', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useRematchNegotiation(socket as unknown as Socket));

        act(() => {
            result.current.acceptRematch();
        });
        expect(socket.emit).toHaveBeenCalledWith(SocketEvents.ACCEPT_REMATCH);
    });

    it('rejectRematch emite REJECT_REMATCH y pone rematchState a rejected', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useRematchNegotiation(socket as unknown as Socket));

        act(() => {
            result.current.rejectRematch();
        });

        expect(socket.emit).toHaveBeenCalledWith(SocketEvents.REJECT_REMATCH);
        expect(result.current.rematchState).toBe('rejected');
    });

    it('Cuando el servidor manda un REJECT_REMATCH del oponente, rematchState se pone a rejected', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useRematchNegotiation(socket as unknown as Socket));
        
        act(() => {
            socket.trigger(SocketEvents.REMATCH_REJECTED);
        });

        expect(result.current.rematchState).toBe('rejected');
    });

    it('Cuando el servidor manda un GAME_START, todas las negociaciones se reinician', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useRematchNegotiation(socket as unknown as Socket));

        act(() => {
            socket.trigger(SocketEvents.REMATCH_OFFERED);
        });
        expect(result.current.rematchState).toBe('received');

        act(() => {
            socket.trigger(SocketEvents.GAME_START);
        });
        expect(result.current.rematchState).toBe('none');
        expect(result.current.timesOffered).toBe(0);
    });
});