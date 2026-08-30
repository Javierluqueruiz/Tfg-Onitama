import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';

export function useSocketEvent<T = unknown>(
    socket: Socket | null,
    event: string,
    handler: (payload: T) => void
): void {
    const handlerRef = useRef(handler);
    useEffect(() => {
        handlerRef.current = handler;
    });

    useEffect(() => {
        if (!socket) return;

        const listener = (payload: T) => handlerRef.current(payload);
        socket.on(event, listener);

        return () => {
            socket.off(event, listener);
        };
    }, [socket, event]);
}