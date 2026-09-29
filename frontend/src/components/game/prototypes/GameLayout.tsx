import React from 'react';
import styles from './GameLayout.module.css';
import '../theme.css';

/**
 * PROTOTIPO DE MAQUETACIÓN -- sin lógica de juego.
 *
 * Solo explora la distribución en grid de 3 columnas (sidebar izq. / tablero
 * central / chat) pedida para la nueva pantalla de partida. No está montado
 * en ninguna ruta real: es un boceto para validar el layout antes de
 * conectarlo a useGameScreen y a los componentes reales (BoardView, CardView,
 * ChatBox...).
 */
export const GameLayout: React.FC = () => {
    return (
        <div className={`${styles.layout} gameTheme`}>
            {/* --- SIDEBAR IZQUIERDA: estado y menú --- */}
            <aside className={styles.leftSidebar}>
                <div className={styles.profileCard}>
                    <div className={`${styles.avatar} ${styles.avatarBlue}`}>R</div>
                    <div className={styles.profileInfo}>
                        <span className={styles.profileName}>Rival</span>
                        <span className={styles.profileMeta}>ELO 1200 · Esperando...</span>
                    </div>
                </div>

                <div className={styles.neutralCard}>
                    <span className={styles.neutralLabel}>Carta Neutral</span>
                    <div className={styles.neutralCardFace}>MANTIS</div>
                </div>

                <div className={styles.selfBlock}>
                    <div className={styles.profileCard}>
                        <div className={`${styles.avatar} ${styles.avatarRed}`}>J</div>
                        <div className={styles.profileInfo}>
                            <span className={styles.profileName}>Jugador</span>
                            <span className={styles.profileMeta}>ELO 1450 · Turno activo</span>
                        </div>
                    </div>

                    <div className={styles.actionRow}>
                        <button className={styles.actionBtn}>
                            <span aria-hidden="true">🏳️</span> Rendirse
                        </button>
                        <button className={styles.actionBtn}>
                            <span aria-hidden="true">🤝</span> Empate
                        </button>
                    </div>
                </div>
            </aside>

            {/* --- CENTRO: cartas del rival, tablero, mis cartas --- */}
            <main className={styles.centerColumn}>
                <div className={styles.cardRow}>
                    <div className={styles.cardPlaceholder}>FROG</div>
                    <div className={styles.cardPlaceholder}>HORSE</div>
                </div>

                <div className={styles.boardPlaceholder}>
                    <span>Tablero 5×5</span>
                    <span className={styles.boardHint}>500 × 500</span>
                </div>

                <div className={styles.cardRow}>
                    <div className={styles.cardPlaceholder}>ROOSTER</div>
                    <div className={styles.cardPlaceholder}>COBRA</div>
                </div>
            </main>

            {/* --- SIDEBAR DERECHA: chat de partida (panel cristal) --- */}
            <aside className={styles.rightSidebar}>
                <h3 className={styles.chatTitle}>Chat de Partida</h3>

                <div className={styles.chatMessages}>
                    <div className={styles.chatBubbleOpponent}>Suerte, maestro.</div>
                    <div className={styles.chatBubbleOwn}>Que gane el mejor.</div>
                </div>

                <div className={styles.chatInputRow}>
                    <input
                        className={styles.chatInput}
                        placeholder="Escribe un mensaje..."
                        disabled
                    />
                    <button className={styles.chatSendBtn} disabled>Enviar</button>
                </div>
            </aside>
        </div>
    );
};
