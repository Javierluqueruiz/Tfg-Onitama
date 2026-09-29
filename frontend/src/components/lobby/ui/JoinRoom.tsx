import React from 'react';
import styles from './RoomForms.module.css';
import { BrushInput } from '../../shared/ui/BrushInput';
import { KeyIcon } from './ModeIcons';

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
        <form
            className={styles.form}
            onSubmit={(event) => {
                event.preventDefault();
                onJoinRoom();
            }}
        >
            <div className={styles.header}>
                <span className={styles.badge} aria-hidden="true"><KeyIcon /></span>
                <h3 className={styles.title}>Unirse a una sala</h3>
                <p className={styles.hint}>Escribe el código de 5 caracteres que te ha pasado tu rival.</p>
            </div>

            {!accountName && (
                <label className={styles.label}>
                    Tu nombre
                    <BrushInput
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Ej. Maestro Nuby"
                    />
                </label>
            )}

            <label className={`${styles.label} ${styles.labelCenter}`}>
                Código de la sala
                <BrushInput
                    variant="code"
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="ABC12"
                    maxLength={5}
                    autoComplete="off"
                    spellCheck={false}
                />
            </label>

            <div className={styles.actions}>
                <button type="submit" className={styles.primary}>Unirse a la sala</button>
                <button type="button" className={styles.ghost} onClick={onBack}>← Volver</button>
            </div>
        </form>
    );
};
