import { useState, useEffect } from 'react';
import { SocketEvents, type GameMode } from '../../../../../shared';
import { useSocket } from '../../../contexts/SocketContext';

type MenuScreen = 'MAIN' | 'CREATE' | 'JOIN' | 'WAITING' | 'MATCHMAKING';

export const useLobby = () => {
    const { socket, isConnected, lastError: errorMsg, setLastError: setErrorMsg } = useSocket();

    //Todos los estados
    const [currentScreen, setCurrentScreen] = useState<MenuScreen>('MAIN');
    const [selectMode, setSelectMode] = useState<GameMode | null>(null);
    const [playerName, setPlayerName] = useState<string>('');
    const [joinCode, setJoinCode] = useState<string>('');
    const [createdRoomCode, setCreatedRoomCode] = useState<string>('');

    //Todos los effects
    useEffect(() => {
        if (!socket) return;

        socket.on(SocketEvents.ROOM_CREATED, (data: { roomCode: string }) => {
            setCreatedRoomCode(data.roomCode)
            setCurrentScreen('WAITING');
            setErrorMsg(null);
        });

        return () => {
            socket.off(SocketEvents.ROOM_CREATED);
        };
    }, [socket, setErrorMsg]);

    //Todos los handle
    const handleCreateRoom = (mode: GameMode) => {
        if (!playerName.trim()) return setErrorMsg('El nombre del jugador no puede estar vacío.');
        setErrorMsg(null);
        socket?.emit(SocketEvents.CREATE_ROOM, { hostName: playerName, mode });
    };

    const handleJoinRoom = () => {
        if (!playerName.trim()) return setErrorMsg('El nombre del jugador no puede estar vacío.');
        if (!joinCode.trim()) return setErrorMsg('El código de la sala no puede estar vacío.');
        setErrorMsg(null);
        socket?.emit(SocketEvents.JOIN_ROOM, { 
            roomCode: joinCode.trim().toUpperCase(),
            guestName: playerName
        });
    };

    const startMatchmaking = (mode: GameMode) => {
        setErrorMsg(null);
        setSelectMode(mode);
        setCurrentScreen('MATCHMAKING');
    };

    return {
        isConnected,
        currentScreen,
        setCurrentScreen,
        selectMode,
        playerName,
        setPlayerName,
        joinCode,
        setJoinCode,
        createdRoomCode,
        errorMsg,
        setErrorMsg,
        handleCreateRoom,
        handleJoinRoom,
        startMatchmaking,
        setSelectMode
    };
};