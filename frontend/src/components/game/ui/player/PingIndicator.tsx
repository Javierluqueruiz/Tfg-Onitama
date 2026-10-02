import React, { useEffect, useState } from 'react';
import { useSocket } from '../../../../contexts/SocketContext';
import { SocketEvents } from '../../../../../../shared';
import styles from './PlayerInfo.module.css';

interface PingIndicatorProps {
    isConnected: boolean;
}

export const PingIndicator: React.FC<PingIndicatorProps> = ({ isConnected }) => {
    const { socket } = useSocket();
    const [ping, setPing] = useState<number>(0);

    useEffect(() => {
        if (!socket || !isConnected) return;

        const interval = setInterval(() => {
            socket.emit(SocketEvents.PING, Date.now());
        }, 2000);

        const handlePong = (clientTimestamp: number) => {
            setPing(Date.now() - clientTimestamp);
        };

        socket.on(SocketEvents.PONG, handlePong);

        return () => {
            clearInterval(interval);
            socket.off(SocketEvents.PONG, handlePong);
        };
    }, [socket, isConnected]);

    if (!isConnected) return null;

    let statusColor = '#4ade80';
    if (ping > 200) statusColor = '#f87171';
    else if (ping > 100) statusColor = '#fbbf24';

    return (
        <div className={styles.pingRow}>
            <div
                className={styles.pingDot}
                style={{
                    backgroundColor: ping > 0 ? statusColor : '#9ca3af',
                    boxShadow: ping > 0 ? `0 0 6px ${statusColor}` : 'none',
                }}
            />
            <span className={styles.pingText}>
                {ping > 0 ? `${ping} ms` : 'Calculando...'}
            </span>
        </div>
    );
};
