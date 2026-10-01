import React from 'react';
import styles from './Modals.module.css';
import { GameDialog } from './GameDialog';

interface SurrenderConfirmModalProps {
    onConfirm: () => void;
    onCancel: () => void;
}

// Sello 降 (kō, "rendirse"). La opción segura, "Seguir jugando", recibe el foco y es
// lo que hace Escape: rendirse exige una pulsación deliberada.
export const SurrenderConfirmModal: React.FC<SurrenderConfirmModalProps> = ({ onConfirm, onCancel }) => {
    return (
        <GameDialog
            tone="lose"
            seal="降"
            title="¿Rendirte?"
            message="Tu oponente ganará automáticamente. Esta acción no se puede deshacer."
            onDismiss={onCancel}
        >
            <button type="button" className={styles.btnDanger} onClick={onConfirm}>
                Rendirse
            </button>
            <button type="button" className={styles.btnPrimary} onClick={onCancel} autoFocus>
                Seguir jugando
            </button>
        </GameDialog>
    );
};
