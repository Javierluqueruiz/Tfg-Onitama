import { useState } from 'react';
import type { Socket } from 'socket.io-client';
import { SocketEvents, type ReconnectPayload } from '../../../../../shared';
import { useSocketEvent } from '../../../hooks/useSocketEvent';

//Sub-05.2: Reconexión de la partida tras una caída de conexión.
export const useGameReconnection = (socket: Socket | null) => {
    const [isReconnecting, setIsReconnecting] = useState(false);

    useSocketEvent(socket, 'connect', () => {
        const savedSession = localStorage.getItem('onitama_session');

        if (savedSession) {
            setIsReconnecting(true);
            const { roomId, originalSocketId } = JSON.parse(savedSession);
            const payload: ReconnectPayload = { roomId, originalSocketId };
            socket?.emit(SocketEvents.RECONNECT_ATTEMPT, payload);
        }
    });

    useSocketEvent(socket, SocketEvents.RECONNECT_SUCCESS, () => {
        setIsReconnecting(false);
    });

    useSocketEvent(socket, SocketEvents.RECONNECT_FAILED, () => {
        localStorage.removeItem('onitama_session');
        setIsReconnecting(false);
    });

    return { isReconnecting };
};