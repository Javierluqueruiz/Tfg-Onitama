import React from 'react';
import styles from './MainMenu.module.css';
import type { GameMode, AiDifficulty, AiEngine } from '../../../../../shared';
import { AI_DIFFICULTIES, AI_DIFFICULTY_LABELS, AI_ENGINES, AI_ENGINE_LABELS } from '../../../../../shared';

export type Tab = 'MATCHMAKING' | 'PRIVATE' | 'AI';

//FEAT 15 (Sub-15.4): escalera de niveles contra la IA
const AI_LEVELS = AI_ENGINES.flatMap(engine => AI_DIFFICULTIES.map(difficulty => ({ engine, difficulty })));

interface MainMenuProps {
    onSelectCreate: () => void;
    onSelectJoin: () => void;
    onStartMatchmaking: (mode: GameMode) => void;
    onStartAiGame: (engine: AiEngine, difficulty: AiDifficulty) => void;
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
                            {AI_LEVELS.map(({ engine, difficulty }) => (
                                <button 
                                    key={`${engine}-${difficulty}`}
                                    className={`${styles.btn} ${styles[`btnDifficulty_${difficulty}`]} ${statusClass}`}
                                    onClick={() => onStartAiGame(engine, difficulty)}
                                    disabled={!isConnected}
                                >
                                    {AI_ENGINE_LABELS[engine]} · {AI_DIFFICULTY_LABELS[difficulty]}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};