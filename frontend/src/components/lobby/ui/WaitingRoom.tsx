import React from 'react';
import styles from './WaitingRoom.module.css';

interface WaitingRoomProps {
    roomCode: string;
    onCancel: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({ roomCode, onCancel }) => {
    return (
        <div className = {styles.container}>
            <h3 className={styles.title}>Sala Creada</h3>
            <p className={styles.subtitle}>
                Comparte este código con tu rival para empezar:
            </p>

            <div className={styles.codeBox}>
                {roomCode}
            </div>

            <p className = {styles.waitingText}>
                Esperando a que tu rival se una...
            </p>

            <button 
                className={styles.btnCancel}
                onClick={onCancel}
            >
                Cancelar y Salir
            </button>
        </div>
    );
};