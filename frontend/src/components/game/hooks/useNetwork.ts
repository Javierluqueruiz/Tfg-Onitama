import { useEffect, useState } from 'react';
import { SocketEvents } from '../../../../../shared';
import type { Socket } from 'socket.io-client';
import { useSocketEvent } from '../../../hooks/useSocketEvent';

export const useNetwork = (socket: Socket | null) => {

    //Sub-05.2: Reconexión
    const [disconnectTimer, setDisconnectTimer] = useState<number | null>(null);
    const [reconnectMessage, setReconnectMessage] = useState<boolean>(false);

    //Sub-05.3: Temporizador de juego
    const [timeRemaining, setTimeRemaining] = useState<{ red: number; blue: number }>({ red: 0, blue: 0 });

    // La sesión ya NO se borra automáticamente al finalizar la partida (gameStateStatus === 'finished'):
    // la sala se mantiene en memoria para permitir revancha, y el jugador debe poder reconectarse tras
    // el final de la partida para ver el resultado, el chat y una posible oferta de revancha pendiente.
    // La sesión se limpia explícitamente al salir de la partida (ver useGameScreen.ts, handleExit) o si
    // el servidor rechaza la reconexión (useGameReconnection.ts, RECONNECT_FAILED).

    //Sub-05.2: Gestión de eventos de desconexión y reconexión del oponente
    useSocketEvent(socket, SocketEvents.OPPONENT_DISCONNECTED, (data: { timeLimit: number }) => {
        setDisconnectTimer(data.timeLimit / 1000);
        setReconnectMessage(false);
    });

    useSocketEvent(socket, SocketEvents.OPPONENT_RECONNECTED, () => {
        setDisconnectTimer(null);
        setReconnectMessage(true);

        setTimeout(() => setReconnectMessage(false), 3000);
    });

    //Sub-05.2: Temporizador de desconexión
    useEffect(() => {
        if (disconnectTimer === null || disconnectTimer <= 0) return;

        const interval = setInterval(() => {
            setDisconnectTimer((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(interval);
    }, [disconnectTimer])

    //Sub-05.3: Gestión del temporizador de juego
    useSocketEvent(socket, SocketEvents.TIME_TICK, (data: { timeRemaining: { red: number; blue: number } }) => {
        setTimeRemaining(data.timeRemaining);
    });

    useSocketEvent(socket, SocketEvents.GAME_START, (data: { gameState: { timeRemaining: { red: number; blue: number } } }) => {
        setTimeRemaining(data.gameState.timeRemaining ?? { red: 0, blue: 0 });
        setDisconnectTimer(null);
        setReconnectMessage(false);
    });

    return {
        disconnectTimer,
        reconnectMessage,
        timeRemaining
    };
};

export const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};