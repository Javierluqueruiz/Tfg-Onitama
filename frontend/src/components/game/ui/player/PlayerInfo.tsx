import React from 'react';
import styles from './PlayerInfo.module.css';
import { formatTime } from '../../hooks/useNetwork';

interface PlayerInfoProps {
    playerName: string;
    color: 'red' | 'blue';
    isActive: boolean;
    timeLeft: number;
}

export const PlayerInfo: React.FC<PlayerInfoProps> = ({ playerName, color, isActive, timeLeft }) => {
    const isRed = color === 'red';
    const isLowTime = timeLeft <= 30;

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
                <span className={`${styles.timer} ${isLowTime ? styles.lowTime : ''}`}>
                    {formatTime(timeLeft)}
                </span>
            </div>
        </div>
    )
}
