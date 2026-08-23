import React from 'react';
import styles from './Forms.module.css';

interface JoinRoomProps {
    playerName: string;
    setPlayerName: (name: string) => void;
    joinCode: string;
    setJoinCode: (code: string) => void;
    onJoinRoom: () => void;
    onBack: () => void;
}

export const JoinRoom: React.FC<JoinRoomProps> = ({ playerName, setPlayerName, joinCode, setJoinCode, onJoinRoom, onBack }) => {
    return (
    <div className={styles.container}>
        <h3 className={styles.title}>Unirse a una Partida</h3>

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
        <label className={styles.label}>
            Código de la Sala:
            <input
                type="text"
                className={`${styles.input} ${styles.inputCode}`}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Ej. ABC12"
                maxLength={5}
            />
        </label>

        <button className={`${styles.btnSubmit} ${styles.btnJoin}`} 
            onClick={onJoinRoom}>
            Unirse a la Sala
        </button>

        <button className={styles.btnBack} onClick={onBack}>
            ←Volver
        </button>
    </div>
);

};
