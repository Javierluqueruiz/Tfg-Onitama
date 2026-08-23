import { useState, useEffect } from 'react';
import { SocketEvents } from '../../../shared';
import { useSocket } from '../contexts/SocketContext';

type MenuScreen = 'MAIN' | 'CREATE' | 'JOIN' | 'WAITING';

export const useLobby = () => {
    const { socket, isConnected } = useSocket();

    //Todos los estados
    const [currentScreen, setCurrentScreen] = useState<MenuScreen>('MAIN');
    const [playerName, setPlayerName] = useState<string>('');
    const [joinCode, setJoinCode] = useState<string>('');
    const [createdRoomCode, setCreatedRoomCode] = useState<string>('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    //Todos los effects
    useEffect(() => {
        if (!socket) return;

        socket.on(SocketEvents.ROOM_CREATED, (data: { roomCode: string }) => {
            setCreatedRoomCode(data.roomCode)
            setCurrentScreen('WAITING');
            setErrorMsg(null);
        });

        socket.on(SocketEvents.ERROR, (data: { message: string }) => {
            setErrorMsg(data.message);
        });

        return () => {
            socket.off(SocketEvents.ROOM_CREATED);
            socket.off(SocketEvents.ERROR);
        };
    }, [socket]);

    //Todos los handle
    const handleCreateRoom = () => {
        if (!playerName.trim()) return setErrorMsg('El nombre del jugador no puede estar vacío.');
        setErrorMsg(null);
        socket?.emit(SocketEvents.CREATE_ROOM, { hostName: playerName });
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

    return {
        isConnected,
        currentScreen,
        setCurrentScreen,
        playerName,
        setPlayerName,
        joinCode,
        setJoinCode,
        createdRoomCode,
        errorMsg,
        setErrorMsg,
        handleCreateRoom,
        handleJoinRoom
    };
};