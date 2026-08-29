import { useState, useEffect } from 'react';
import { SocketEvents } from '../../../../../shared';
import type { Socket } from 'socket.io-client';

//Sub-05.4: Gestión de la negociación de empate
export const useDrawNegotiation = (socket: Socket | null) => {
    
    const [drawOfferReceived, setDrawOfferReceived] = useState<boolean>(false);
    const [drawOfferSent, setDrawOfferSent] = useState<boolean>(false);
    const [drawRejectedMessage, setDrawRejectedMessage] = useState<boolean>(false);
    

    useEffect(() => {
            if (!socket) return;
    
            socket.on(SocketEvents.OFFER_DRAW, () => setDrawOfferReceived(true));
    
            socket.on(SocketEvents.REJECT_DRAW, () => {
                setDrawOfferSent(false);
                setDrawRejectedMessage(true);
                setTimeout(() => setDrawRejectedMessage(false), 4000);
            });

            const handleGameStart = () => {
                setDrawOfferReceived(false);
                setDrawOfferSent(false);
                setDrawRejectedMessage(false);
            };

            socket.on(SocketEvents.GAME_START, handleGameStart);

            return () => {
                socket.off(SocketEvents.OFFER_DRAW);
                socket.off(SocketEvents.REJECT_DRAW);
                socket.off(SocketEvents.GAME_START, handleGameStart);
            }
        }, [socket]);
    
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