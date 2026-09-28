import React from 'react';
import styles from './Forms.module.css';
import btnStyles from '../../shared/ui/Button.module.css';
import fieldStyles from "../../shared/ui/Input.module.css";

interface JoinRoomProps {
    playerName: string;
    setPlayerName: (name: string) => void;
    accountName?: string;
    joinCode: string;
    setJoinCode: (code: string) => void;
    onJoinRoom: () => void;
    onBack: () => void;
}

export const JoinRoom: React.FC<JoinRoomProps> = ({ playerName, setPlayerName, accountName, joinCode, setJoinCode, onJoinRoom, onBack }) => {
    return (
    <div className={styles.container}>
        <h3 className={styles.title}>Unirse a una Partida</h3>

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

        <button className={`${styles.btnSubmit} ${styles.btnJoin} ${btnStyles.btnCarved}`} 
            onClick={onJoinRoom}>
            <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
            Unirse a la Sala
        </button>

        <button className={`${styles.btnBack} ${btnStyles.btnCarved}`} onClick={onBack}>
            <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
            ←Volver
        </button>
    </div>
);

};
