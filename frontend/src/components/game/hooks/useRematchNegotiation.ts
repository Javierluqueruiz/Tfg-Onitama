import { useEffect, useState } from "react";
import { SocketEvents } from "../../../../../shared/index";
import type { Socket } from "socket.io-client";

export const useRematchNegotiation = (socket: Socket | null) => {
    const [rematchState, setRematchState] = useState<'none' | 'offered' | 'received' | 'rejected'>('none');
    const [timesOffered, setTimesOffered] = useState(0);
    useEffect(() => {
        if (!socket) return;

        const handleOffered = () => {
            console.log(`Jugador ${socket.id} ha ofrecido una revancha.`);
            setRematchState('received');
        };
        const handleRejected = () => {
            console.log(`Jugador ${socket.id} ha rechazado la solicitud de revancha.`);
            setRematchState('rejected');
        };
        const handleGameStart = () => setRematchState('none');

        socket.on(SocketEvents.REMATCH_OFFERED, handleOffered);
        socket.on(SocketEvents.REMATCH_REJECTED, handleRejected);
        socket.on(SocketEvents.GAME_START, handleGameStart);

        return () => {
            socket.off(SocketEvents.REMATCH_OFFERED, handleOffered);
            socket.off(SocketEvents.REMATCH_REJECTED, handleRejected);
            socket.off(SocketEvents.GAME_START, handleGameStart);
        };
    }, [socket]);

    const offerRematch = () => {
        socket?.emit(SocketEvents.OFFER_REMATCH);
        setTimesOffered(prev => prev + 1);
        setRematchState('offered');
    };

    const acceptRematch = () => {
        socket?.emit(SocketEvents.ACCEPT_REMATCH);
    };

    const rejectRematch = () => {
        socket?.emit(SocketEvents.REJECT_REMATCH);
        setRematchState('rejected');
    };

    return {
        rematchState,
        timesOffered,
        offerRematch,
        acceptRematch,
        rejectRematch
    };
};