import React from 'react';
import styles from './Modals.module.css';
import { GameDialog, type DialogTone } from './GameDialog';

interface GameOverModalProps {
    result: 'win' | 'lose' | 'draw';
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

export const GameOverModal: React.FC<GameOverModalProps> = ({ result, onCloseModal, onExit }) => {
    const { tone, seal, title, message } = CONTENT[result];

    return (
        // Escape o clic fuera equivalen a "Ver tablero final": cierran el modal sin salir de la sala.
        <GameDialog tone={tone} seal={seal} title={title} message={message} onDismiss={onCloseModal}>
            <button type="button" className={styles.btnGhost} onClick={onCloseModal}>
                Ver tablero final
            </button>
            <button type="button" className={styles.btnPrimary} onClick={onExit} autoFocus>
                Volver al menú
            </button>
        </GameDialog>
    )
};
