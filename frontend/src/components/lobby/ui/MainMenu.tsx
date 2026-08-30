import React from 'react';
import styles from './MainMenu.module.css';
import type { GameMode } from '../../../../../shared';

interface MainMenuProps {
    onSelectCreate: () => void;
    onSelectJoin: () => void;
    onStartMatchmaking: (mode: GameMode) => void;
    isConnected: boolean;
}

type Tab = 'MATCHMAKING' | 'PRIVATE';

export const MainMenu: React.FC<MainMenuProps> = ({ onSelectCreate, onSelectJoin, onStartMatchmaking, isConnected }) => {
    const [activeTab, setActiveTab] = React.useState<Tab>('MATCHMAKING');
    const statusClass = isConnected ? styles.connected : styles.disconnected;
    
    return (
        <div className={styles.container}>
            <div className={styles.tabHeader}>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'MATCHMAKING' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('MATCHMAKING')}
                >
                    Partida Pública
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'PRIVATE' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('PRIVATE')}
                >
                    Partida Privada
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
                ) : (
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
                )}
            </div>
        </div>
    );
};