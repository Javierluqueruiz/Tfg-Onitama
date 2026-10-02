import React from 'react';
import styles from './PlayerInfo.module.css';
import { formatTime } from '../../hooks/useNetwork';

interface PlayerInfoProps {
    playerName: string;
    elo?: number;
    color: 'red' | 'blue';
    isActive: boolean;
    timeLeft?: number;
    children?: React.ReactNode;
    cardsSlot?: React.ReactNode;
}

export const PlayerInfo: React.FC<PlayerInfoProps> = ({ playerName, elo, color, isActive, timeLeft, children, cardsSlot }) => {
    const isRed = color === 'red';
    const isLowTime = timeLeft !== undefined && timeLeft <= 30;

    const activeClass = isActive ?
        (isRed ? styles.activeRed : styles.activeBlue) : '';

    const avatarBg = isRed ? styles.bgRed : styles.bgBlue;

    return (
        <div className={`${styles.playerContainer} ${activeClass}`}>
            <div className={`${styles.avatar} ${avatarBg}`}>
                {playerName ? playerName.charAt(0).toUpperCase() : '?'}
            </div>

            <div className={styles.details}>
                <p className={styles.name}>
                    {playerName || `Maestro ${color}`}
                    {elo !== undefined && <span className={styles.eloBadge}>ELO {elo}</span>}
                </p>
                <p className={`${styles.status} ${isActive ? styles.statusActive : ''}`}>
                        {isActive ? 'Turno Activo' : 'Esperando...'}
                </p>
                {timeLeft !== undefined && timeLeft > 0 && (
                    <span className={`${styles.timer} ${isLowTime ? styles.lowTime : ''}`}>
                    {formatTime(timeLeft)}
                    </span>
                )}
                {children}
            </div>

            {cardsSlot && <div className={styles.cardsSlot}>{cardsSlot}</div>}
        </div>
    )
}