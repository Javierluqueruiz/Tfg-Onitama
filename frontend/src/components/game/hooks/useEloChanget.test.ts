import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Socket } from 'socket.io-client';
import { SocketEvents } from '../../../../../shared';
import { createMockSocket } from '../../../test-utils/mockSocket';
import { useEloChange } from './useEloChange';

describe('useEloChange', () => {
    const setUp = () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useEloChange(socket as unknown as Socket));
        return { result, socket };
    };

    it('empieza sin ninguna variación de ELO', () => {
        const { result } = setUp();

        expect(result.current).toBeNull();
    });

    it('guarda la variación que le pasa el servidor', () => {
        const { socket, result } = setUp();

        act(() => socket.trigger(SocketEvents.ELO_UPDATED, { ranked: true, eloChange: 16, newElo: 1016 }));

        expect(result.current).toEqual({ ranked: true, eloChange: 16, newElo: 1016 });
    });

    it('guarda el aviso de que la partida no puntúa', () => {
        const { socket, result } = setUp();

        act(() => socket.trigger(SocketEvents.ELO_UPDATED, { ranked: false }));

        expect(result.current).toEqual({ ranked: false });
    });

    it('una revancha descarta la variación anterior', () => {
        const { socket, result } = setUp();
        act(() => socket.trigger(SocketEvents.ELO_UPDATED, { ranked: true, eloChange: 16, newElo: 1016 }));
        act(() => socket.trigger(SocketEvents.GAME_START));

        expect(result.current).toBeNull();
    });

    it('si llega otra variación, sustituye la anterior', () => {
        const { socket, result } = setUp();
        act(() => socket.trigger(SocketEvents.ELO_UPDATED, { ranked: true, eloChange: 16, newElo: 1016 }));
        act(() => socket.trigger(SocketEvents.ELO_UPDATED, { ranked: true, eloChange: -16, newElo: 984 }));

        expect(result.current).toEqual({ ranked: true, eloChange: -16, newElo: 984 });
    });
});