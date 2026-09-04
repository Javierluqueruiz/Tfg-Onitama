import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Socket } from 'socket.io-client';
import { useSocketEvent } from './useSocketEvent';
import { createMockSocket } from '../test-utils/mockSocket';

describe('useSocketEvent', () => {

    it('Se suscribe al evento cuando hay un socket', () => {
        const socket = createMockSocket();
        const handler = vi.fn();

        renderHook(() => useSocketEvent(socket as unknown as Socket, 'test_event', handler));

        expect(socket.on).toHaveBeenCalledWith('test_event', expect.any(Function));
        expect(socket.on).toHaveBeenCalledTimes(1);
    });

    it('Ejecuta el handler cuando se dispara el evento', () => {
        const socket = createMockSocket();
        const handler = vi.fn();

        renderHook(() => useSocketEvent(socket as unknown as Socket, 'test_event', handler));

        socket.trigger('test_event', { data: 'test' });

        expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });

    it('Si el handler cambia entre renders, se utiliza el nuevo handler', () => {
        const socket = createMockSocket();
        const handler1 = vi.fn();
        const handler2 = vi.fn();

        const { rerender } = renderHook(
            ({ handler }) => useSocketEvent(socket as unknown as Socket, 'test_event', handler),
            { initialProps: { handler: handler1 } }
        );

        expect(socket.on).toHaveBeenCalledTimes(1);

        rerender({ handler: handler2 });

        expect(socket.on).toHaveBeenCalledTimes(1); // No se vuelve a suscribir al evento
        expect(socket.off).not.toHaveBeenCalled(); // No se desuscribe del evento

        socket.trigger('test_event', { data: 'test' });

        expect(handler1).not.toHaveBeenCalled();
        expect(handler2).toHaveBeenCalledWith({ data: 'test' });
    });

    it('Se desuscribe del evento cuando el componente se desmonta', () => {
        const socket = createMockSocket();
        const handler = vi.fn();

        const { unmount } = renderHook(() => useSocketEvent(socket as unknown as Socket, 'test_event', handler));

        unmount();

        expect(socket.off).toHaveBeenCalledWith('test_event', expect.any(Function));
    });

    it('Se vuelve a suscribir al evento si el socket cambia', () => {
        const socketA = createMockSocket();
        const socketB = createMockSocket();
        const handler = vi.fn();

        const { rerender } = renderHook(
            ({ socket }) => useSocketEvent(socket as unknown as Socket, 'test_event', handler),
            { initialProps: { socket: socketA } }
        );

        expect(socketA.on).toHaveBeenCalledTimes(1);

        rerender({ socket: socketB });

        expect(socketA.off).toHaveBeenCalledTimes(1);
        expect(socketB.on).toHaveBeenCalledTimes(1);
    });

});