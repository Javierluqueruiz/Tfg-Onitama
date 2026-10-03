import React, { useEffect, useState } from 'react';
import styles from '../Lobby.module.css';

// A partir de este tiempo sin conexión se avisa de que el servidor tarda. En el plan gratuito del
// despliegue el servidor puede tardar casi un minuto en despertar tras un rato sin uso.
const SLOW_CONNECTION_MS = 8000;

interface ServerStatusProps {
    isConnected: boolean;
}

// Con conexión basta un punto (el texto queda para lectores de pantalla y como tooltip): no gasta
// una píldora entera de la cabecera cuando todo va bien. Sin conexión sí se explica lo que pasa.
export const ServerStatus: React.FC<ServerStatusProps> = ({ isConnected }) => {
    const [waitedLong, setWaitedLong] = useState(false);

    useEffect(() => {
        if (isConnected) return;

        const timer = setTimeout(() => setWaitedLong(true), SLOW_CONNECTION_MS);
        // Al reconectar (o desmontar) se apaga el temporizador y se pone el aviso a cero, para que el
        // siguiente corte vuelva a empezar por «Conectando...».
        return () => {
            clearTimeout(timer);
            setWaitedLong(false);
        };
    }, [isConnected]);

    const label = isConnected
        ? 'Servidor online'
        : waitedLong
            ? 'El servidor tarda en responder...'
            : 'Conectando...';

    return (
        <span
            className={isConnected ? styles.serverOk : styles.serverPill}
            role="status"
            title={isConnected ? label : undefined}
        >
            <span className={`${styles.dot} ${isConnected ? styles.dotConnected : styles.dotDisconnected}`} />
            <span className={isConnected ? styles.srOnly : undefined}>{label}</span>
        </span>
    );
};