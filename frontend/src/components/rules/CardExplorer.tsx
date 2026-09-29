import React, { useState } from 'react';
import { ONITAMA_DECK } from '../../../../shared';
import { CardView } from '../game/ui/cards/CardView';
import { getValidTargets } from '../game/logic/getValidTargets';
import { MiniBoard } from './MiniBoard';
import { buildBoard } from './rulesBoards';
import styles from './CardExplorer.module.css';

const CENTER = { x: 2, y: 2 };
const EXPLORER_BOARD = buildBoard([{ ...CENTER, type: 'master', color: 'blue' }]);

// Galería de las 16 cartas: al elegir una, un tablero con una sola pieza en el
// centro ilumina a dónde puede ir. Siempre se ve desde el lado del jugador (arriba
// es hacia el rival), que es como se leen las cartas en partida.
export const CardExplorer: React.FC = () => {
    const [selectedName, setSelectedName] = useState(ONITAMA_DECK[0].name);

    const card = ONITAMA_DECK.find(c => c.name === selectedName) ?? ONITAMA_DECK[0];
    const targets = getValidTargets(EXPLORER_BOARD, card, CENTER, 'blue', false);

    return (
        <div className={styles.explorer}>
            <div className={styles.gallery}>
                {ONITAMA_DECK.map(deckCard => (
                    <button
                        key={deckCard.name}
                        type="button"
                        className={`${styles.cardButton} ${deckCard.name === selectedName ? styles.cardButtonActive : ''}`}
                        aria-pressed={deckCard.name === selectedName}
                        aria-label={`Carta ${deckCard.name}`}
                        onClick={() => setSelectedName(deckCard.name)}
                    >
                        <CardView card={deckCard} faction={deckCard.color} />
                    </button>
                ))}
            </div>

            <aside className={styles.panel} aria-live="polite">
                <h4 className={styles.panelTitle}>{card.name}</h4>
                <p className={styles.panelText}>
                    {card.moves.length} movimientos posibles desde la casilla central.
                </p>

                <MiniBoard
                    board={EXPLORER_BOARD}
                    label={`Movimientos de la carta ${card.name}`}
                    selectedPiece={CENTER}
                    validTargets={targets}
                    scale={0.72}
                />

                <p className={styles.panelHint}>
                    Las cartas se leen desde tu lado del tablero: arriba es hacia el rival.
                </p>
            </aside>
        </div>
    );
};
