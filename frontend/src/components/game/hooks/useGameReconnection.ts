import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { SocketEvents, type ReconnectPayload } from '../../../../../shared';

//Sub-05.2: Reconexión de la partida tras una caída de conexión.
export const useGameReconnection = (socket: Socket | null) => {
    const [isReconnecting, setIsReconnecting] = useState(false);

    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            const savedSession = localStorage.getItem('onitama_session');

            if (savedSession) {
                setIsReconnecting(true);
                const { roomId, originalSocketId } = JSON.parse(savedSession);
                const payload: ReconnectPayload = { roomId, originalSocketId };
                socket.emit(SocketEvents.RECONNECT_ATTEMPT, payload);
            }
        };

        const handleReconnectSuccess = () => {
            setIsReconnecting(false);
        };

        const handleReconnectFailed = () => {
            localStorage.removeItem('onitama_session');
            setIsReconnecting(false);
        };

        socket.on('connect', handleConnect);
        socket.on(SocketEvents.RECONNECT_SUCCESS, handleReconnectSuccess);
        socket.on(SocketEvents.RECONNECT_FAILED, handleReconnectFailed);

        return () => {
            socket.off('connect', handleConnect);
            socket.off(SocketEvents.RECONNECT_SUCCESS, handleReconnectSuccess);
            socket.off(SocketEvents.RECONNECT_FAILED, handleReconnectFailed);
        };
    }, [socket]);

    return { isReconnecting };
};