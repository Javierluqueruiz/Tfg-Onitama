import { useState } from 'react';
import { SocketEvents } from '../../../../../shared';
import type { Socket } from 'socket.io-client';
import { useSocketEvent } from '../../../hooks/useSocketEvent';

//Sub-05.4: Gestión de la negociación de empate
export const useDrawNegotiation = (socket: Socket | null) => {
    
    const [drawOfferReceived, setDrawOfferReceived] = useState<boolean>(false);
    const [drawOfferSent, setDrawOfferSent] = useState<boolean>(false);
    const [drawRejectedMessage, setDrawRejectedMessage] = useState<boolean>(false);
    
    useSocketEvent(socket, SocketEvents.OFFER_DRAW, () => {
        setDrawOfferReceived(true);
    });

    // Sub-05.2: si al reconectar el servidor indica que hay una oferta de empate pendiente del rival,
    // se restaura el aviso como si se acabara de recibir.
    useSocketEvent(socket, SocketEvents.RECONNECT_SUCCESS, (data: { drawOffered?: boolean }) => {
        if (data.drawOffered) {
            setDrawOfferReceived(true);
        }
    });

    useSocketEvent(socket, SocketEvents.REJECT_DRAW, () => {
        setDrawOfferSent(false);
        setDrawRejectedMessage(true);
        setTimeout(() => setDrawRejectedMessage(false), 4000);
    });

    useSocketEvent(socket, SocketEvents.GAME_START, () => {
        setDrawOfferReceived(false);
        setDrawOfferSent(false);
        setDrawRejectedMessage(false);
    });

    const handleOfferDraw = () => {
        setDrawOfferSent(true);
        socket?.emit(SocketEvents.OFFER_DRAW);
    };

    const handleAcceptDraw = () => {
        setDrawOfferReceived(false);
        socket?.emit(SocketEvents.ACCEPT_DRAW);
    };

    const handleRejectDraw = () => {
        setDrawOfferReceived(false);
        socket?.emit(SocketEvents.REJECT_DRAW);
    };

    return {
        drawOfferReceived,
        drawOfferSent,
        drawRejectedMessage,
        handleOfferDraw,
        handleAcceptDraw,
        handleRejectDraw
    };
};