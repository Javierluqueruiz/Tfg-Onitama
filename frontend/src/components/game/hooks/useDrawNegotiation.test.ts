import { describe, it, expect } from 'vitest';
import { useDrawNegotiation } from './useDrawNegotiation';
import { createMockSocket } from '../../../test-utils/mockSocket';
import type { Socket } from 'socket.io-client';
import { renderHook, act } from '@testing-library/react';
import { SocketEvents } from '../../../../../shared';


describe('useDrawNegotiation', () => {
    it('Empieza sin ninguna negociación', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useDrawNegotiation(socket as unknown as Socket));

        expect(result.current.drawOfferReceived).toBe(false);
        expect(result.current.drawOfferSent).toBe(false);
    });

    it('Cuando el servidor manda un OFFER_DRAW, drawOfferReceived se pone a true', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useDrawNegotiation(socket as unknown as Socket));

        act(() => {
            socket.trigger(SocketEvents.OFFER_DRAW);
        });

        expect(result.current.drawOfferReceived).toBe(true);
    });

    it('handleOfferDraw emite OFFER_DRAW y pone drawOfferSent a true', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useDrawNegotiation(socket as unknown as Socket));

        act(() => {
            result.current.handleOfferDraw();
        });

        expect(socket.emit).toHaveBeenCalledWith(SocketEvents.OFFER_DRAW);
        expect(result.current.drawOfferSent).toBe(true);
    });

    it('Cuando el servidor manda un REJECT_DRAW, drawOfferSent se pone a false y drawRejectedMessage a true', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useDrawNegotiation(socket as unknown as Socket));

        act(() => {
            result.current.handleOfferDraw();
        });

        expect(result.current.drawOfferSent).toBe(true);

        act(() => {
            socket.trigger(SocketEvents.REJECT_DRAW);
        });

        expect(result.current.drawOfferSent).toBe(false);
        expect(result.current.drawRejectedMessage).toBe(true);
    });

    it('Cuando el servidor manda un GAME_START, todas las negociaciones se reinician', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useDrawNegotiation(socket as unknown as Socket));

        act(() => {
            socket.trigger(SocketEvents.OFFER_DRAW);
        });
        expect(result.current.drawOfferReceived).toBe(true);

        act(() => {
            socket.trigger(SocketEvents.GAME_START);
        });
        expect(result.current.drawOfferReceived).toBe(false);
        expect(result.current.drawOfferSent).toBe(false);
        expect(result.current.drawRejectedMessage).toBe(false);
    });
});