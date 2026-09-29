import React from 'react';
import type { ChatMessage, PlayerColor } from '../../../../../../shared';
import styles from './GameSidePanel.module.css';
import { ChatBox } from '../chat/ChatBox';
import { GameControls } from './GameControls';

interface GameSidePanelProps {
    status: string;
    localColor: PlayerColor | null;
    initialChat?: ChatMessage[];
    // Avisos que necesitan respuesta (descarte, empate, revancha). Se muestran entre el chat
    // y las acciones, para que no desplacen ni tapen el tablero y las cartas.
    notices?: React.ReactNode;
    isGameOver: boolean;
    isVsAi: boolean;
    drawOfferSent: boolean;
    drawOfferReceived: boolean;
    onOfferDraw: () => void;
    onSurrender: () => void;
    onExit: () => void;
}

// Panel lateral de la partida: chat arriba, avisos en medio y acciones (tablas, rendirse, salir) abajo.
export const GameSidePanel: React.FC<GameSidePanelProps> = ({
    status, localColor, initialChat, notices, isGameOver, isVsAi, drawOfferSent, drawOfferReceived, onOfferDraw, onSurrender, onExit
}) => {
    return (
        <aside className={styles.sidebar} aria-label="Chat y acciones de la partida">
            <ChatBox localColor={localColor} initialMessages={initialChat} />

            <div className={styles.notices}>{notices}</div>

            <div className={styles.controlsFooter}>
                <GameControls
                    status={status}
                    isGameOver={isGameOver}
                    isVsAi={isVsAi}
                    drawOfferSent={drawOfferSent}
                    drawOfferReceived={drawOfferReceived}
                    onOfferDraw={onOfferDraw}
                    onSurrender={onSurrender}
                    onExit={onExit}
                />
            </div>
        </aside>
    );
};
