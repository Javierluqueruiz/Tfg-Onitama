import React from 'react';
import styles from './Modals.module.css';

interface SurrenderConfirmModalProps {
    onConfirm: () => void;
    onCancel: () => void;
}

export const SurrenderConfirmModal: React.FC<SurrenderConfirmModalProps> = ({ onConfirm, onCancel }) => {
    return (
        <div className={styles.overlay}>
            <div className={styles.victoryModal}>
                <div className={`${styles.modalHeader} ${styles.modalHeaderLose}`}>
                    <h2 className={styles.victoryTitle}>¿Rendirte?</h2>
                </div>
                <div className={styles.modalBody}>
                    <p className={styles.modalMessage}>Tu oponente ganará automáticamente. Esta acción no se puede deshacer.</p>
                    <div className={styles.modalActions}>
                        <button className={styles.btnExit} onClick={onCancel}>Seguir jugando</button>
                        <button className={styles.btnExit} onClick={onConfirm}>Rendirse</button>
                    </div>
                </div>
            </div>
        </div>
    );
};