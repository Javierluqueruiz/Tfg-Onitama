import React, { useEffect, useState } from 'react';
import styles from './PlayerZone.module.css'
import { useSocket } from '../../../../contexts/SocketContext';
import { SocketEvents } from '../../../../../../shared';


interface NetworkStatusProps {
    isOpponent?: boolean;
    isConnected: boolean;
    disconnectTimer: number | null;
    reconnectMessage?: boolean;
};

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ isOpponent, isConnected, disconnectTimer, reconnectMessage }) => 
    {
        const { socket } = useSocket(); // Solo extraemos el socket, NO el ping
        const [ping, setPing] = useState<number>(0);

        // Efecto aislado SOLO para calcular el ping de este componente
        useEffect(() => {
            if (!socket || isOpponent || !isConnected) return;
            
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
        }, [socket, isOpponent, isConnected]);

        // Determinar color
        let statusColor = '#4ade80';
        if (ping > 200) statusColor = '#f87171';
        else if (ping > 100) statusColor = '#fbbf24';

    return (
        <>
            {!isOpponent && !isConnected && (
                <div className={styles.disconnectBanner}>
                    Conexión perdida. Intentando reconectar...
                </div>
            )}
            {isOpponent && disconnectTimer !== null && disconnectTimer > 0 && (
                <div className={styles.disconnectBanner}>
                    El oponente se ha desconectado. Esperando reconexión... <strong>({disconnectTimer}s)</strong>
                </div>
            )}
            {isOpponent && reconnectMessage && (
                <div className={styles.reconnectBanner}>
                    El oponente se ha reconectado.
                </div>
            )}

            {!isOpponent && isConnected && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', marginTop: '4px' }}>
                    <div 
                        style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: ping > 0 ? statusColor : '#9ca3af',
                            boxShadow: ping > 0 ? `0 0 6px ${statusColor}` : 'none',
                            transition: 'background-color 0.3s ease'
                        }} 
                    />
                    <span style={{ fontSize: '0.85rem', color: '#000000', fontFamily: 'monospace' }}>
                        {ping > 0 ? `${ping} ms` : 'Calculando...'}
                    </span>
                </div>
            )}
        </>
    );
};

