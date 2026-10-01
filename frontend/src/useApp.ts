import { useState } from "react";
import { useSocket } from "./contexts/SocketContext";
import type { ChatMessage, GameState, PlayerColor, PlayerProfile } from '../../shared';
import { SocketEvents } from '../../shared';
import { useSocketEvent } from "./hooks/useSocketEvent";
import { useGameReconnection } from './components/game/hooks/useGameReconnection';
import type { RestoredSession } from './components/game/restoredSession';

type GameStartPayload = { gameState: GameState, players: { red: PlayerProfile, blue: PlayerProfile } };
type ReconnectSuccessPayload = GameStartPayload & { chatHistory?: ChatMessage[], drawOffered?: boolean, rematchOffered?: boolean };

export const useApp = () => {
    const { socket } = useSocket();
    const { isReconnecting } = useGameReconnection(socket);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [localColor, setLocalColor] = useState<PlayerColor | null>(null);
    const [playersProfile, setPlayersProfile] = useState<{ red: PlayerProfile, blue: PlayerProfile } | null>(null); 
    // Datos que trae la reconexión y que la pantalla de partida necesita al montarse (chat, ofertas pendientes).
    const [restored, setRestored] = useState<RestoredSession | null>(null);

    const handleGameStart = (data: GameStartPayload) => {
        localStorage.setItem('onitama_session', JSON.stringify({
            roomId: data.gameState.roomId,
            originalSocketId: socket?.id
        }));

        setGameState(data.gameState);
        setPlayersProfile(data.players);
        
        if (socket?.id === data.players.red.socketId) {
            setLocalColor('red');
        } else if (socket?.id === data.players.blue.socketId) { 
            setLocalColor('blue');
        }
    };
        
    useSocketEvent(socket, SocketEvents.GAME_START, (data: GameStartPayload) => {
        console.log('Partida iniciada:', data.gameState);
        handleGameStart(data);
        setRestored(null);
    });

    useSocketEvent(socket, SocketEvents.RECONNECT_SUCCESS, (data: ReconnectSuccessPayload) => {
        handleGameStart(data);
        setRestored({
            chatHistory: data.chatHistory ?? [],
            drawOffered: Boolean(data.drawOffered),
            rematchOffered: Boolean(data.rematchOffered),
        });
    });

    useSocketEvent(socket, SocketEvents.GAME_UPDATE, (data: { gameState: GameState }) => {
        console.log('Actualización del estado del juego recibida:', data.gameState);
        setGameState(data.gameState);
        // La sesión ya no se borra aquí al finalizar la partida: se mantiene para permitir reconectar
        // y ver el resultado, el chat y una posible revancha pendiente (ver useGameScreen.ts, handleExit).
    });

    return {
        gameState,
        localColor,
        playersProfile,
        restored,
        isReconnecting,
    };
};