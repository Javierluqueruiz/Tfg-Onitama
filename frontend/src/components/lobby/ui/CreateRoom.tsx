import React from 'react';
import styles from './Forms.module.css';
import type { GameMode } from '../../../../../shared';

interface CreateRoomProps {
    playerName: string;
    setPlayerName: (name: string) => void;
    onCreateRoom: (mode: GameMode) => void;
    onBack: () => void;
}

export const CreateRoom: React.FC<CreateRoomProps> = ({ playerName, setPlayerName, onCreateRoom, onBack }) => {
    const [selectedMode, setSelectedMode] = React.useState<GameMode>('normal');
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

            <div className={styles.modeSelection}>
                <p className={styles.label}>Modo de Juego:</p>
                <div className={styles.modeButtonsRow}>
                    <button 
                        className={`${styles.modeBtn} ${selectedMode === 'fast' ? styles.activeFast : ''}`}
                        onClick={() => setSelectedMode('fast')}
                    >
                        ⚡ 5 min
                    </button>
                    <button 
                        className={`${styles.modeBtn} ${selectedMode === 'normal' ? styles.activeNormal : ''}`}
                        onClick={() => setSelectedMode('normal')}
                    >
                        ⏱️ 10 min
                    </button>
                    <button 
                        className={`${styles.modeBtn} ${selectedMode === 'casual' ? styles.activeCasual : ''}`}
                        onClick={() => setSelectedMode('casual')}
                    >
                        ☕ Casual
                    </button>
                </div>
            </div>

            <div className={styles.buttonGroup}>
                <button className={styles.btnBack} onClick={onBack}>Volver</button>
                <button className={`${styles.btnSubmit} ${styles.btnCreate}`} onClick={() => onCreateRoom(selectedMode)}>
                    Crear Sala
                </button>
            </div>
        </div>
    );
};