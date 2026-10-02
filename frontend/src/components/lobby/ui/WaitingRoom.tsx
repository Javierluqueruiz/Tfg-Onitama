import React from 'react';
import styles from '../../shared/ui/FormKit.module.css';
import { FormHeader } from '../../shared/ui/FormHeader';
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
            <FormHeader icon={<ToriiIcon />} title="Sala creada" hint="Comparte este código con tu rival para empezar:" />

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
