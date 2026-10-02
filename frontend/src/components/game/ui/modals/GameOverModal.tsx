import React from 'react';
import styles from './Modals.module.css';
import { GameDialog, type DialogTone } from './GameDialog';
import type { EloUpdate } from '../../../../../../shared';
import { getRankChange } from '../../rankChange';

interface GameOverModalProps {
    result: 'win' | 'lose' | 'draw';
    eloUpdate?: EloUpdate | null;
    onCloseModal: () => void;
    onExit: () => void;

}

// Kanji del sello: 勝 (shō, "victoria"), 敗 (hai, "derrota") y 和 (wa, "armonía", para el empate).
const CONTENT: Record<GameOverModalProps['result'], { tone: DialogTone; seal: string; title: string; message: string }> = {
    win: {
        tone: 'win', seal: '勝', title: '¡Victoria!',
        message: 'Has demostrado ser un verdadero Maestro. Tu honor prevalece.',
    },
    lose: {
        tone: 'lose', seal: '敗', title: 'Derrota',
        message: 'Tu templo ha caído. Levántate, aprende de tus errores y vuelve a intentarlo.',
    },
    draw: {
        tone: 'draw', seal: '和', title: 'Empate',
        message: 'La partida ha terminado en empate. Ambos jugadores han demostrado su habilidad.',
    },
};

const formatEloChange = (eloChange: number): string => {
    return `${eloChange > 0 ? '+' : eloChange < 0 ? '' : '±'}${eloChange} ELO`;
}

const EloSummary: React.FC<{ eloUpdate: EloUpdate | null }> = ({ eloUpdate }) => {
    const rankChange = eloUpdate ? getRankChange(eloUpdate) : null;

    return (
         <div className={styles.eloBox} aria-live="polite">
            {eloUpdate && !eloUpdate.ranked && (
                <p className={styles.eloNote}>Partida amistosa: no puntúa para el ELO.</p>
            )}
            {eloUpdate?.ranked && (
                <>
                    <p className={`${styles.eloDelta} ${eloUpdate.eloChange > 0 ? styles.eloUp : eloUpdate.eloChange < 0 ? styles.eloDown : ''}`}>
                        {formatEloChange(eloUpdate.eloChange)}
                    </p>
                    <p className={styles.eloNote}>Nuevo ELO: {eloUpdate.newElo}</p>
                    {rankChange && (
                        <p className={styles.eloRank}>
                            {rankChange.direction === 'up' ? 'Has subido a' : 'Has bajado a'} {rankChange.rank.name}
                        </p>
                    )}
                </>
            )}
        </div>
    );
};

export const GameOverModal: React.FC<GameOverModalProps> = ({ result, eloUpdate = null, onCloseModal, onExit }) => {
    const { tone, seal, title, message } = CONTENT[result];

    return (
        // Escape o clic fuera equivalen a "Ver tablero final": cierran el modal sin salir de la sala.
        <GameDialog tone={tone} seal={seal} title={title} message={message} detail={<EloSummary eloUpdate={eloUpdate} />} onDismiss={onCloseModal}>
            <button type="button" className={styles.btnGhost} onClick={onCloseModal}>
                Ver tablero final
            </button>
            <button type="button" className={styles.btnPrimary} onClick={onExit} autoFocus>
                Volver al menú
            </button>
        </GameDialog>
    )
};
