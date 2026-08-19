import React from 'react';
import styles from './GameScreen.module.css';

interface GameOverModalProps {
    isWinner: boolean;
    onExit: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ isWinner, onExit }) => {
    return (
        <div className={styles.overlay}>
            <div className={styles.victoryModal}>
                <div className={`${styles.modalHeader} ${isWinner ? styles.modalHeaderWin : styles.modalHeaderLose}`}>
                    <h2 className={styles.victoryTitle}>
                        {isWinner ? '¡Victoria!' : 'Derrota'}
                    </h2>        
                </div>
                <div className={styles.modalBody}>
                    <p className={styles.modalMessage}>
                        {isWinner 
                            ? 'Has demostrado ser un verdadero Maestro. Tu honor prevalece.' 
                            : 'Tu templo ha caído. Levántate, aprende de tus errores y vuelve a intentarlo.'}
                    </p>        
                    <button 
                        className={styles.btnExit} 
                        onClick={onExit} 
                    >
                        Volver al Menú
                    </button>
                </div>
            </div>
        </div>
    )
};