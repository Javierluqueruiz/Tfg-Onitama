import React from 'react';
import styles from './RoomForms.module.css';
import { ToriiIcon } from './ModeIcons';

interface WaitingRoomProps {
    roomCode: string;
    onCancel: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({ roomCode, onCancel }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(roomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Sin permiso de portapapeles: el código sigue visible para copiarlo a mano.
        }
    };

    return (
        <div className={styles.form}>
            <div className={styles.header}>
                <span className={styles.badge} aria-hidden="true"><ToriiIcon /></span>
                <h3 className={styles.title}>Sala creada</h3>
                <p className={styles.hint}>Comparte este código con tu rival para empezar:</p>
            </div>

            <ul className={styles.code} aria-label={`Código de la sala: ${roomCode.split('').join(' ')}`}>
                {roomCode.split('').map((char, index) => (
                    <li key={index} className={styles.tile} aria-hidden="true">{char}</li>
                ))}
            </ul>

            <button
                type="button"
                className={`${styles.copy} ${copied ? styles.copyDone : ''}`}
                onClick={handleCopy}
                aria-live="polite"
            >
                {copied ? '¡Copiado!' : 'Copiar código'}
            </button>

            <p className={styles.waiting} role="status">
                <span className={styles.pulse} aria-hidden="true"><span /><span /><span /></span>
                Esperando a que tu rival se una...
            </p>

            <div className={styles.actions}>
                <button type="button" className={`${styles.ghost} ${styles.ghostDanger}`} onClick={onCancel}>
                    Cancelar y salir
                </button>
            </div>
        </div>
    );
};
