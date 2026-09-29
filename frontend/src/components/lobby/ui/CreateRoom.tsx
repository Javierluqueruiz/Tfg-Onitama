import React from 'react';
import styles from './Forms.module.css';
import btnStyles from '../../shared/ui/Button.module.css';
import fieldStyles from "../../shared/ui/Input.module.css";
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
                    <div className={fieldStyles.fieldWrap}>
                        <input
                            type="text"
                            className={`${fieldStyles.field} ${fieldStyles.fieldBrush}`}
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="Ej. Maestro Nuby"
                        />
                        <svg className={fieldStyles.brush} viewBox="0 0 320 10" preserveAspectRatio="none" aria-hidden="true">
                            <path d="M2 6 C8 2,22 1,36 3 C58 6,80 7,102 4 C130 1,158 2,186 5 C214 8,242 7,266 4 C284 1,304 1,316 4 C304 8,282 9,258 8 C230 6,202 9,174 7 C146 5,116 8,88 8 C58 7,28 9,10 8 C4 7,2 7,2 6 Z"/>
                        </svg>
                    </div>
                </label>
            )}

            <div className={styles.modeSelection}>
                <p className={styles.label}>Modo de Juego:</p>
                <div className={styles.modeButtonsRow}>
                    <button
                        className={`${styles.modeBtn} ${selectedMode === 'fast' ? styles.activeFast : ''} ${btnStyles.btnCarved}`}
                        onClick={() => setSelectedMode('fast')}
                    >
                        5 min
                    </button>
                    <button
                        className={`${styles.modeBtn} ${selectedMode === 'normal' ? styles.activeNormal : ''} ${btnStyles.btnCarved}`}
                        onClick={() => setSelectedMode('normal')}
                    >
                        10 min
                    </button>
                    <button
                        className={`${styles.modeBtn} ${selectedMode === 'casual' ? styles.activeCasual : ''} ${btnStyles.btnCarved}`}
                        onClick={() => setSelectedMode('casual')}
                    >
                        Casual
                    </button>
                </div>
            </div>

            <div className={styles.buttonGroup}>
                <button className={`${styles.btnBack} ${btnStyles.btnCarved}`} onClick={onBack }>
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