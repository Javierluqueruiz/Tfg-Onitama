import React, { useEffect } from 'react';
import styles from './Modals.module.css';

export type DialogTone = 'win' | 'lose' | 'draw';

interface GameDialogProps {
    tone: DialogTone;
    // Kanji del sello (ver comentarios en cada modal para su significado).
    seal: string;
    title: string;
    message: string;
    // Se llama al pulsar Escape o al hacer clic fuera del cuadro.
    onDismiss: () => void;
    children: React.ReactNode;
}

const SEAL_CLASS: Record<DialogTone, string> = {
    win: styles.sealWin,
    lose: styles.sealLose,
    draw: styles.sealDraw,
};

// Marco común de los modales de la partida (fin de partida y rendición): sello con
// kanji, título, mensaje y una fila de acciones. Cierra con Escape.
export const GameDialog: React.FC<GameDialogProps> = ({ tone, seal, title, message, onDismiss, children }) => {
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onDismiss();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onDismiss]);

    return (
        <div className={styles.overlay} onClick={onDismiss}>
            <div
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby="game-dialog-title"
                onClick={(event) => event.stopPropagation()}
            >
                <span className={`${styles.seal} ${SEAL_CLASS[tone]}`} aria-hidden="true">{seal}</span>
                <h2 id="game-dialog-title" className={styles.dialogTitle}>{title}</h2>
                <p className={styles.dialogText}>{message}</p>
                <div className={styles.dialogActions}>{children}</div>
            </div>
        </div>
    );
};
