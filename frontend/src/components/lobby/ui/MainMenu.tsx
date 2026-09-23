import React from 'react';
import styles from './MainMenu.module.css';
import type { GameMode, AiDifficulty } from '../../../../../shared';
import { AI_DIFFICULTIES, AI_DIFFICULTY_LABELS } from '../../../../../shared';

export type Tab = 'MATCHMAKING' | 'PRIVATE' | 'AI';

interface MainMenuProps {
    onSelectCreate: () => void;
    onSelectJoin: () => void;
    onStartMatchmaking: (mode: GameMode) => void;
    onStartAiGame: (difficulty: AiDifficulty) => void;
    isConnected: boolean;
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onSelectCreate, onSelectJoin, onStartMatchmaking, onStartAiGame, isConnected, activeTab, onTabChange }) => {
    const statusClass = isConnected ? styles.connected : styles.disconnected;

    return (
        <div className={styles.container}>
            <div className={styles.tabHeader}>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'MATCHMAKING' ? styles.activeTab : ''}`}
                    onClick={() => onTabChange('MATCHMAKING')}
                >
                    Partida Pública
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'PRIVATE' ? styles.activeTab : ''}`}
                    onClick={() => onTabChange('PRIVATE')}
                >
                    Partida Privada
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'AI' ? styles.activeTab : ''}`}
                    onClick={() => onTabChange('AI')}
                >
                    Partida contra IA
                </button>
            </div>

            <div className={styles.tabContainer}>
                {activeTab === 'MATCHMAKING' ? (
                    <div className={styles.matchmakingSection}>
                        <h3 className={styles.sectionTitle}>Buscar Partida</h3>
                        <div className={styles.modeButtons}>
                            <button
                                className={`${styles.btn} ${styles.btnCasual} ${statusClass}`}
                                onClick={() => onStartMatchmaking('casual')}
                                disabled={!isConnected}
                            >
                                Casual
                            </button>

                            <button
                                className={`${styles.btn} ${styles.btnNormal} ${statusClass}`}
                                onClick={() => onStartMatchmaking('normal')}
                                disabled={!isConnected}
                            >
                                Normal
                            </button>

                            <button
                                className={`${styles.btn} ${styles.btnFast} ${statusClass}`}
                                onClick={() => onStartMatchmaking('fast')}
                                disabled={!isConnected}
                            >
                                Rápido
                            </button>
                        </div>
                    </div>
                ) : activeTab === 'PRIVATE' ? (
                    <div className={styles.privateSection}>
                        <h3 className={styles.sectionTitle}>Jugar con Amigos</h3>
                        <button 
                            className={`${styles.btn} ${styles.btnCreate} ${statusClass}`}
                            onClick={onSelectCreate}
                            disabled={!isConnected}
                        >
                            Crear Sala
                        </button>

                        <button
                            className={`${styles.btn} ${styles.btnJoin} ${statusClass}`}
                            onClick={onSelectJoin}
                            disabled={!isConnected}
                        >
                            Unirse a Sala
                        </button>
                    </div>
                ) : (
                    <div className={styles.aiSection}>
                        <h3 className={styles.sectionTitle}>Jugar contra IA</h3>
                        <div className={styles.modeButtons}>
                            {AI_DIFFICULTIES.map((difficulty) => (
                                <button 
                                    key={difficulty}
                                    className={`${styles.btn} ${styles[`btnDifficulty_${difficulty}`]} ${statusClass}`}
                                    onClick={()=> onStartAiGame(difficulty)}
                                    disabled={!isConnected}
                                >
                                    {AI_DIFFICULTY_LABELS[difficulty]}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};