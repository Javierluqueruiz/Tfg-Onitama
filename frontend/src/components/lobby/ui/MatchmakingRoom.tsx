import React, { useEffect } from 'react';
import { SocketEvents, type GameMode, type MatchFoundPayload } from '../../../../../shared';
import { useSocket } from '../../../contexts/SocketContext';
import btnStyles from '../../shared/ui/Button.module.css';
import { getMatchMode } from './matchModes';
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

        const joinQueue = () => socket.emit(SocketEvents.JOIN_QUEUE, { mode });
        joinQueue();
        // Si la conexión se cae y vuelve, el servidor ya te ha sacado de la cola al desconectarte.
        socket.on('connect', joinQueue);

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
            socket.off('connect', joinQueue);
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

    const modeInfo = getMatchMode(mode);

    return (
        <div className={styles.room}>
            <div className={styles.modeChip}>
                <span className={styles.modeLabel}>{modeInfo.label}</span>
                <span className={styles.modeDesc}>{modeInfo.description}</span>
            </div>

            {/* Círculo de tinta (enso) que gira alrededor del icono del modo, con ondas hacia fuera. */}
            <div className={styles.seeker} aria-hidden="true">
                <span className={styles.ripple} />
                <span className={`${styles.ripple} ${styles.rippleLate}`} />
                <svg className={styles.enso} viewBox="0 0 100 100">
                    <circle className={styles.ensoTrack} cx="50" cy="50" r="42" />
                    <path className={styles.ensoStroke} d="M50 8 A42 42 0 1 1 22 81" />
                </svg>
                <span className={styles.seekerIcon}>{modeInfo.icon}</span>
            </div>

            <div className={styles.status} role="status">
                <h2 className={styles.heading}>Buscando rival<span className={styles.dots} aria-hidden="true" /></h2>
                <p className={styles.hint}>
                    Buscamos a alguien de nivel parecido y ampliamos la búsqueda poco a poco.
                </p>
            </div>

            <div className={styles.timerBox}>
                <span className={styles.timerLabel}>Tiempo de espera</span>
                <span className={styles.timer}>{formatTime(elapsedTime)}</span>
            </div>

            <button
                className={`${styles.cancelBtn} ${btnStyles.btnCarved}`}
                onClick={handleCancel}
            >
                <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
                Cancelar búsqueda
            </button>
        </div>
    )

}
