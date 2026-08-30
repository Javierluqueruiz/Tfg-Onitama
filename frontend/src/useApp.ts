import { useState } from "react";
import { useSocket } from "./contexts/SocketContext";
import type { GameState, PlayerColor, PlayerProfile } from '../../shared';
import { SocketEvents } from '../../shared';
import { useSocketEvent } from "./hooks/useSocketEvent";

type GameStartPayload = { gameState: GameState, players: { red: PlayerProfile, blue: PlayerProfile } };

export const useApp = () => {
    const { socket } = useSocket();
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [localColor, setLocalColor] = useState<PlayerColor | null>(null);
    const [playersProfile, setPlayersProfile] = useState<{ red: PlayerProfile, blue: PlayerProfile } | null>(null); 

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
    });

    useSocketEvent(socket, SocketEvents.RECONNECT_SUCCESS, handleGameStart);

    useSocketEvent(socket, SocketEvents.GAME_UPDATE, (data: { gameState: GameState }) => {
        console.log('Actualización del estado del juego recibida:', data.gameState);
        setGameState(data.gameState);

        if (data.gameState.status === 'finished') {
            localStorage.removeItem('onitama_session');
        }
    });

    return {
        gameState,
        localColor,
        playersProfile,
    };
};