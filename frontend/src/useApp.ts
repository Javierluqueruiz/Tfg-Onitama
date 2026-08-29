import { useState, useEffect } from "react";
import { useSocket } from "./contexts/SocketContext";
import type { GameState, PlayerColor, PlayerProfile } from '../../shared';
import { SocketEvents } from '../../shared';

export const useApp = () => {
    const { socket } = useSocket();
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [localColor, setLocalColor] = useState<PlayerColor | null>(null);
    const [playersProfile, setPlayersProfile] = useState<{ red: PlayerProfile, blue: PlayerProfile } | null>(null); 

    useEffect(() => {
        if (!socket) return;
   
        socket.on(SocketEvents.GAME_START, (data: { gameState: GameState, players: { red: PlayerProfile, blue: PlayerProfile } }) => {
            console.log('Partida iniciada:', data.gameState);
            localStorage.setItem('onitama_session', JSON.stringify({
                roomId: data.gameState.roomId,
                originalSocketId: socket.id
            }));
            setGameState(data.gameState);
            setPlayersProfile(data.players);

            if (socket.id === data.players.red.socketId) {
                setLocalColor('red');
            } else if (socket.id === data.players.blue.socketId) {
                setLocalColor('blue');
            }
        });

        socket.on(SocketEvents.RECONNECT_SUCCESS, (data: { gameState: GameState, players: { red: PlayerProfile, blue: PlayerProfile } }) => {
            localStorage.setItem('onitama_session', JSON.stringify({
                roomId: data.gameState.roomId,
                originalSocketId: socket.id
            }));
            setGameState(data.gameState);
            setPlayersProfile(data.players);

            if (socket.id === data.players.red.socketId) {
                setLocalColor('red');
            } else if (socket.id === data.players.blue.socketId) {
                setLocalColor('blue');
            }
        })
   
        socket.on(SocketEvents.GAME_UPDATE, (data: { gameState: GameState }) => {
            console.log('Actualización del estado del juego recibida:', data.gameState);
            setGameState(data.gameState);

            if (data.gameState.status === 'finished') {
                localStorage.removeItem('onitama_session');
            }
        });

        

   
        return () => {
            socket.off(SocketEvents.GAME_START); 
            socket.off(SocketEvents.GAME_UPDATE);
            socket.off(SocketEvents.RECONNECT_SUCCESS); 
        };
    }, [socket]);


    return {
        gameState,
        localColor,
        playersProfile,
    };
};