import React from 'react';
import styles from './PlayerInfo.module.css';

interface PlayerInfoProps {
    playerName: string;
    color: 'red' | 'blue';
    isActive: boolean;
}

export const PlayerInfo: React.FC<PlayerInfoProps> = ({ playerName, color, isActive }) => {
    const isRed = color === 'red';

    const activeClass = isActive ?
        (isRed ? styles.activeRed : styles.activeBlue) : '';

    const avatarBg = isRed ? styles.bgRed : styles.bgBlue;

    return (
        <div className={`${styles.playerContainer} ${activeClass}`}>
            <div className={`${styles.avatar} ${avatarBg}`}>
                {playerName ? playerName.charAt(0).toUpperCase() : '?'}
            </div>

            <div className={styles.details}>
                <p className={styles.name}>{playerName || `Maestro ${color}`}</p>
                <p className={`${styles.status} ${isActive ? styles.statusActive : ''}`}>
                        {isActive ? 'Turno Activo' : 'Esperando...'}
                </p>
            </div>
        </div>
    )
}
