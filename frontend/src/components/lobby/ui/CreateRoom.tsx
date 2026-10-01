import React from 'react';
import styles from '../../shared/ui/FormKit.module.css';
import { FormHeader } from '../../shared/ui/FormHeader';
import { BrushInput } from '../../shared/ui/BrushInput';
import { ToriiIcon, TeaBowlIcon, HourglassIcon, BoltIcon } from './ModeIcons';
import type { GameMode } from '../../../../../shared';

interface CreateRoomProps {
    playerName: string;
    setPlayerName: (name: string) => void;
    accountName?: string;
    onCreateRoom: (mode: GameMode) => void;
    onBack: () => void;
}

// Ritmo de la sala: mismo orden y colores que el menú principal.
const ROOM_MODES: { mode: GameMode; label: string; detail: string; icon: React.ReactNode; className: string }[] = [
    { mode: 'casual', label: 'Casual', detail: 'Sin reloj', icon: <TeaBowlIcon />, className: styles.optionCasual },
    { mode: 'normal', label: 'Normal', detail: '10 min', icon: <HourglassIcon />, className: styles.optionNormal },
    { mode: 'fast', label: 'Rápido', detail: '5 min', icon: <BoltIcon />, className: styles.optionFast },
];

export const CreateRoom: React.FC<CreateRoomProps> = ({ playerName, setPlayerName, accountName, onCreateRoom, onBack }) => {
    const [selectedMode, setSelectedMode] = React.useState<GameMode>('normal');

    return (
        <form
            className={styles.form}
            onSubmit={(event) => {
                event.preventDefault();
                onCreateRoom(selectedMode);
            }}
        >
            <FormHeader icon={<ToriiIcon />} title="Crear sala" hint="Elige el ritmo de la partida y comparte el código con tu rival." />

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

            <fieldset className={styles.group}>
                <legend className={styles.groupLabel}>Modo de juego</legend>
                <div className={styles.options} role="radiogroup" aria-label="Modo de juego">
                    {ROOM_MODES.map(({ mode, label, detail, icon, className }) => (
                        <button
                            key={mode}
                            type="button"
                            role="radio"
                            aria-checked={selectedMode === mode}
                            className={`${styles.option} ${className} ${selectedMode === mode ? styles.optionSelected : ''}`}
                            onClick={() => setSelectedMode(mode)}
                        >
                            <span className={styles.optionIcon} aria-hidden="true">{icon}</span>
                            <span className={styles.optionName}>{label}</span>
                            <span className={styles.optionDetail}>{detail}</span>
                        </button>
                    ))}
                </div>
            </fieldset>

            <div className={styles.actions}>
                <button type="submit" className={styles.primary}>Crear sala</button>
                <button type="button" className={styles.ghost} onClick={onBack}>← Volver</button>
            </div>
        </form>
    );
};
