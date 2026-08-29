import React from 'react';
import styles from './Modals.module.css';

interface GameOverModalProps {
    result: 'win' | 'lose' | 'draw';
    onCloseModal: () => void;
    onExit: () => void;
    
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ result, onCloseModal, onExit }) => {

    const getHeaderClass = () => {
        if (result === 'win') return styles.modalHeaderWin;
        if (result === 'lose') return styles.modalHeaderLose;
        return styles.modalHeaderDraw;
    };

    const getTitle = () => {
        if (result === 'win') return '¡Victoria!';
        if (result === 'lose') return 'Derrota';
        return 'Empate';
    };

    const getMessage = () => {
        if (result === 'win') return 'Has demostrado ser un verdadero Maestro. Tu honor prevalece.';
        if (result === 'lose') return 'Tu templo ha caído. Levántate, aprende de tus errores y vuelve a intentarlo.';
        return 'La partida ha terminado en empate. Ambos jugadores han demostrado su habilidad.';
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.victoryModal}>
                <div className={`${styles.modalHeader} ${getHeaderClass()}`}>
                    <h2 className={styles.victoryTitle}>
                        {getTitle()}
                    </h2>        
                </div>
                <div className={styles.modalBody}>
                    <p className={styles.modalMessage}>
                        {getMessage()}
                    </p>       
                    <div className={styles.modalActions}>
                        <button 
                            className={styles.btnExit}
                            onClick={onCloseModal}
                        >
                            Ver Tablero final
                        </button>
                        <button 
                        className={styles.btnExit} 
                        onClick={onExit} 
                        >
                            Volver al Menú
                        </button>
                    </div> 
                    
                </div>
            </div>
        </div>
    )
};