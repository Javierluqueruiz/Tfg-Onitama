import React from 'react';
import styles from './Forms.module.css';
import btnStyles from '../../shared/ui/Button.module.css';
import type { GameMode } from '../../../../../shared';

interface CreateRoomProps {
    playerName: string;
    setPlayerName: (name: string) => void;
    accountName?: string;
    onCreateRoom: (mode: GameMode) => void;
    onBack: () => void;
}

export const CreateRoom: React.FC<CreateRoomProps> = ({ playerName, setPlayerName, accountName, onCreateRoom, onBack }) => {
    const [selectedMode, setSelectedMode] = React.useState<GameMode>('normal');
    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Crear una nueva Partida</h3>
            {accountName ? (
                <></>
            ) : (
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
            )}

            <div className={styles.modeSelection}>
                <p className={styles.label}>Modo de Juego:</p>
                <div className={styles.modeButtonsRow}>
                    <button
                        className={`${styles.modeBtn} ${selectedMode === 'fast' ? styles.activeFast : ''} ${btnStyles.btnCarved}`}
                        onClick={() => setSelectedMode('fast')}
                    >
                        <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
                        5 min
                    </button>
                    <button
                        className={`${styles.modeBtn} ${selectedMode === 'normal' ? styles.activeNormal : ''} ${btnStyles.btnCarved}`}
                        onClick={() => setSelectedMode('normal')}
                    >
                        <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
                        10 min
                    </button>
                    <button
                        className={`${styles.modeBtn} ${selectedMode === 'casual' ? styles.activeCasual : ''} ${btnStyles.btnCarved}`}
                        onClick={() => setSelectedMode('casual')}
                    >
                        <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
                        Casual
                    </button>
                </div>
            </div>

            <div className={styles.buttonGroup}>
                <button className={`${styles.btnBack} ${btnStyles.btnCarved}`} onClick={onBack }>
                    <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
                    Volver
                </button>
                <button className={`${styles.btnSubmit} ${styles.btnCreate} ${btnStyles.btnCarved}`} onClick={() => onCreateRoom(selectedMode)}>
                    <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
                    Crear Sala
                </button>
            </div>
        </div>
    );
};