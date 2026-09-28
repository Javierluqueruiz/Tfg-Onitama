import React from 'react';
import styles from './MainMenu.module.css';
import btnStyles from '../../shared/ui/Button.module.css';
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
}

export const MainMenu: React.FC<MainMenuProps> = ({ onSelectCreate, onSelectJoin, onStartMatchmaking, onStartAiGame, isConnected, activeTab }) => {
    const statusClass = isConnected ? styles.connected : styles.disconnected;

    return (
        <div className={styles.container}>
            <div className={styles.tabContainer}>
                {activeTab === 'MATCHMAKING' ? (
                    <div className={styles.matchmakingSection}>
                        <h3 className={styles.sectionTitle}>Buscar Partida</h3>
                        <div className={styles.modeButtons}>
                            <button
                                className={`${styles.btn} ${styles.btnCasual} ${btnStyles.btnCarved} ${statusClass}`}
                                onClick={() => onStartMatchmaking('casual')}
                                disabled={!isConnected}
                            >
                                <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
                                Casual
                            </button>

                            <button
                                className={`${styles.btn} ${styles.btnNormal} ${btnStyles.btnCarved} ${statusClass}`}
                                onClick={() => onStartMatchmaking('normal')}
                                disabled={!isConnected}
                            >
                                <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
                                Normal
                            </button>

                            <button
                                className={`${styles.btn} ${styles.btnFast} ${btnStyles.btnCarved} ${statusClass}`}
                                onClick={() => onStartMatchmaking('fast')}
                                disabled={!isConnected}
                            >
                                <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
                                Rápido
                            </button>
                        </div>
                    </div>
                ) : activeTab === 'PRIVATE' ? (
                    <div className={styles.privateSection}>
                        <h3 className={styles.sectionTitle}>Jugar con Amigos</h3>
                        <button 
                            className={`${styles.btn} ${styles.btnCreate} ${btnStyles.btnCarved} ${statusClass}`}
                            onClick={onSelectCreate}
                            disabled={!isConnected}
                        >
                            <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
                            Crear Sala
                        </button>

                        <button
                            className={`${styles.btn} ${styles.btnJoin} ${btnStyles.btnCarved} ${statusClass}`}
                            onClick={onSelectJoin}
                            disabled={!isConnected}
                        >
                            <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
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
                                    className={`${styles.btn} ${styles[`btnDifficulty_${difficulty}`]} ${btnStyles.btnCarved} ${statusClass}`}
                                    onClick={() => onStartAiGame(engine, difficulty)}
                                    disabled={!isConnected}
                                >
                                    <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
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