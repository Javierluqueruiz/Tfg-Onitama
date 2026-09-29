import React, { useState } from 'react';
import styles from './GameSidePanel.module.css';
import { ChatBox } from '../chat/ChatBox';
import { GameControls } from './GameControls';

type SideTab = 'chat' | 'historial';

interface GameSidePanelProps {
    status: string;
    isGameOver: boolean;
    isVsAi: boolean;
    drawOfferSent: boolean;
    drawOfferReceived: boolean;
    onOfferDraw: () => void;
    onSurrender: () => void;
    onExit: () => void;
}

export const GameSidePanel: React.FC<GameSidePanelProps> = ({
    status, isGameOver, isVsAi, drawOfferSent, drawOfferReceived, onOfferDraw, onSurrender, onExit
}) => {
    const [activeTab, setActiveTab] = useState<SideTab>('chat');

    return (
        <div className={styles.sidebar}>
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'chat' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('chat')}
                >
                    Chat
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'historial' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('historial')}
                >
                    Historial
                </button>
            </div>

            <div className={styles.tabBody}>
                {activeTab === 'chat' ? (
                    <ChatBox />
                ) : (
                    <div className={styles.historialStub}>
                        Historial de jugadas — próximamente.
                    </div>
                )}
            </div>

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
        </div>
    );
};
