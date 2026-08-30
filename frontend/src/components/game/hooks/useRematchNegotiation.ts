import { useState } from "react";
import { SocketEvents } from "../../../../../shared/index";
import type { Socket } from "socket.io-client";
import { useSocketEvent } from "../../../hooks/useSocketEvent";

export const useRematchNegotiation = (socket: Socket | null) => {
    const [rematchState, setRematchState] = useState<'none' | 'offered' | 'received' | 'rejected'>('none');
    const [timesOffered, setTimesOffered] = useState(0);

    useSocketEvent(socket, SocketEvents.REMATCH_OFFERED, () => {
        console.log(`Jugador ${socket?.id} ha ofrecido una revancha.`);
        setRematchState('received');
    });

    useSocketEvent(socket, SocketEvents.REMATCH_REJECTED, () => {
        console.log(`Jugador ${socket?.id} ha rechazado la solicitud de revancha.`);
        setRematchState('rejected');
    });

    useSocketEvent(socket, SocketEvents.GAME_START, () => {
        setRematchState('none');
    });

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