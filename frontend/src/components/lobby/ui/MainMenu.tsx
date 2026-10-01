import React from 'react';
import styles from './MainMenu.module.css';
import btnStyles from '../../shared/ui/Button.module.css';
import type { GameMode, AiDifficulty, AiEngine } from '../../../../../shared';
import { ToriiIcon, KeyIcon } from './ModeIcons';
import { MATCH_MODES } from './matchModes';
import { AI_DIFFICULTIES, AI_DIFFICULTY_LABELS, AI_ENGINES, AI_ENGINE_LABELS } from '../../../../../shared';

export type Tab = 'MATCHMAKING' | 'PRIVATE' | 'AI';

//FEAT 15 (Sub-15.4): escalera de niveles contra la IA
const AI_DESCRIPTIONS: Record<AiEngine, string> = {
    heuristic: 'Elige la jugada que deja mejor posición, sin mirar más allá de su turno.',
    minimax: 'Piensa varios turnos por delante, contando con tus respuestas.',
};

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

    const rowClass = (accent: string) => `${styles.row} ${styles[accent]} ${btnStyles.btnCarved} ${statusClass}`;

    return (
        <div className={styles.container}>
            <div className={styles.tabContainer}>
                {activeTab === 'MATCHMAKING' ? (
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Buscar partida</h3>
                        <p className={styles.sectionHint}>Te emparejamos con un rival de nivel parecido.</p>
                        <div className={styles.modeList}>
                            {MATCH_MODES.map(({ mode, icon, label, description, accent }) => (
                                <button
                                    key={mode}
                                    className={rowClass(accent)}
                                    onClick={() => onStartMatchmaking(mode)}
                                    disabled={!isConnected}
                                >
                                    <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
                                    <span className={styles.rowIcon} aria-hidden="true">{icon}</span>
                                    <span className={styles.rowText}>
                                        <span className={styles.rowName}>{label}</span>
                                        <span className={styles.rowDesc}>{description}</span>
                                    </span>
                                    <span className={styles.rowChevron} aria-hidden="true">›</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : activeTab === 'PRIVATE' ? (
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Jugar con amigos</h3>
                        <p className={styles.sectionHint}>Una sala privada, solo para vosotros.</p>
                        <div className={styles.modeList}>
                            <button
                                className={rowClass('accentCasual')}
                                onClick={onSelectCreate}
                                disabled={!isConnected}
                            >
                                <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
                                <span className={styles.rowIcon} aria-hidden="true"><ToriiIcon /></span>
                                <span className={styles.rowText}>
                                    <span className={styles.rowName}>Crear sala</span>
                                    <span className={styles.rowDesc}>Genera un código y compártelo con un amigo.</span>
                                </span>
                                <span className={styles.rowChevron} aria-hidden="true">›</span>
                            </button>

                            <button
                                className={rowClass('accentWood')}
                                onClick={onSelectJoin}
                                disabled={!isConnected}
                            >
                                <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
                                <span className={styles.rowIcon} aria-hidden="true"><KeyIcon /></span>
                                <span className={styles.rowText}>
                                    <span className={styles.rowName}>Unirse a sala</span>
                                    <span className={styles.rowDesc}>Introduce el código que te han pasado.</span>
                                </span>
                                <span className={styles.rowChevron} aria-hidden="true">›</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Jugar contra la IA</h3>
                        <p className={styles.sectionHint}>Sin reloj y sin prisa: ideal para practicar.</p>
                        <div className={styles.aiGrid}>
                            {AI_ENGINES.map(engine => (
                                <div key={engine} className={styles.aiEngine}>
                                    <h4 className={styles.aiEngineName}>{AI_ENGINE_LABELS[engine]}</h4>
                                    <p className={styles.aiEngineDesc}>{AI_DESCRIPTIONS[engine]}</p>
                                    {AI_DIFFICULTIES.map(difficulty => (
                                        <button
                                            key={difficulty}
                                            className={`${styles.level} ${styles[`btnDifficulty_${difficulty}`]} ${btnStyles.btnCarved} ${statusClass}`}
                                            onClick={() => onStartAiGame(engine, difficulty)}
                                            disabled={!isConnected}
                                            // El botón solo muestra "Fácil" (el motor lo da el título de la columna);
                                            // el nombre accesible incluye el motor.
                                            aria-label={`${AI_ENGINE_LABELS[engine]} · ${AI_DIFFICULTY_LABELS[difficulty]}`}
                                        >
                                            <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
                                            {AI_DIFFICULTY_LABELS[difficulty]}
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
