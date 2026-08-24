import React, { useEffect } from 'react';
import { SocketEvents, type GameMode, type MatchFoundPayload } from '../../../../shared';
import { useSocket } from '../../contexts/SocketContext';
import styles from './MatchmakingRoom.module.css';


interface MatchmakingRoomProps {
    onCancel: () => void;
    onMatchFound: (roomId: string, roomCode: string) => void;
    mode: GameMode;
}

export const MatchmakingRoom: React.FC<MatchmakingRoomProps> = ({ onCancel, onMatchFound, mode }) => {
    const { socket } = useSocket();
    const [elapsedTime, setElapsedTime] = React.useState(0);

    useEffect(() => {
        if (!socket) return;

        socket.emit(SocketEvents.JOIN_QUEUE, { mode });

        socket.on(SocketEvents.MATCH_FOUND, (payload: MatchFoundPayload) => {
            onMatchFound(payload.roomId, payload.roomCode);
        });

        const timer  = setInterval(() => {
            setElapsedTime((prev) => prev + 1);
        }, 1000);

        return () => {
            clearInterval(timer);
            socket.emit(SocketEvents.LEAVE_QUEUE);
            socket.off(SocketEvents.MATCH_FOUND);
        };
    }, [socket, mode, onMatchFound]);

    const handleCancel = () => {
        socket?.emit(SocketEvents.LEAVE_QUEUE);
        onCancel();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };


    return (
        <div className={styles.waitingContainer}>
            <h2>Buscando partida...</h2>
            <p className={styles.modeText}>Modo: {mode.toUpperCase()}</p>

            <div className={styles.spinner}></div>

            <p className={styles.timer}>Tiempo transcurrido: {formatTime(elapsedTime)}</p>

            <button 
                className={styles.cancelBtn}
                onClick={handleCancel}
            >
                Cancelar búsqueda
            </button>
        </div>
    )

}
