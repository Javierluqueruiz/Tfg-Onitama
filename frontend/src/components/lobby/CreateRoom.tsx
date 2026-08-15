import React from 'react';
import styles from './Forms.module.css';

interface CreateRoomProps {
    playerName: string;
    setPlayerName: (name: string) => void;
    onCreateRoom: () => void;
    onBack: () => void;
}

export const CreateRoom: React.FC<CreateRoomProps> = ({ playerName, setPlayerName, onCreateRoom, onBack }) => {
    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Crear una nueva Partida</h3>
            <label className={styles.label}>
                Tu Nombre:
                <input
                    type="text"
                    className={styles.input}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Ej. Maestro Nuby"
                />
            </label>

            <button
                className={`${styles.btnSubmit} ${styles.btnCreate}`}
                onClick={onCreateRoom}
            >
                Crear y Esperar Rival
            </button>

            <button
                className={styles.btnBack}
                onClick={onBack}
            >
                ←Volver
            </button>
        </div>
    );
};