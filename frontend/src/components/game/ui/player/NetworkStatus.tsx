import React from 'react';
import styles from './PlayerZone.module.css'


interface NetworkStatusProps {
    isOpponent?: boolean;
    isConnected: boolean;
    disconnectTimer: number | null;
    reconnectMessage?: boolean;
};

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ isOpponent, isConnected, disconnectTimer, reconnectMessage }) => 
    {
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
        </>
    );
};

