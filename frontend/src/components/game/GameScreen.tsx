import React from 'react';
import type { GameState, PlayerColor, PlayerProfile } from '../../../../shared';
import { BoardView } from './BoardView';
import { CardView } from './CardView';
import { PlayerInfo } from './PlayerInfo';
import styles from './GameScreen.module.css';

interface GameScreenProps {
    gameState: GameState;
    localColor: PlayerColor | null;
    playersProfile: { red: PlayerProfile, blue: PlayerProfile } | null;
}

export const GameScreen: React.FC<GameScreenProps> = ({ gameState, localColor, playersProfile })  => {
    const {board, currentTurn} = gameState;
    const redCards = gameState.cards.red;
    const blueCards = gameState.cards.blue;
    const neutralCard = gameState.cards.neutral;

    const isLocalRed = localColor === 'red';

    const opponentName = isLocalRed ? playersProfile?.blue.name : playersProfile?.red.name;
    const localName = isLocalRed ? playersProfile?.red.name : playersProfile?.blue.name;
    console.log("Players Profile:", playersProfile);
    console.log("Opponent Name:", opponentName);
    console.log("Local Name:", localName);
    
    //Cartas
    const myCards = isLocalRed ? redCards : blueCards;
    const opponentCards = isLocalRed ? blueCards : redCards;

    const boardRotation = isLocalRed ? 'rotate(180deg)' : 'rotate(0deg)';
    console.log("Local Color:", localColor);


    return (
        <div className={styles.screenContainer}>
            <div className={styles.header}>
                <h2 className={styles.title}>Sala de Juego</h2>
                <div className={`${styles.turnIndicator} ${currentTurn === localColor ? styles.turnRed : styles.turnBlue}`}>
                    {currentTurn === localColor ? 'Tu Turno' : 'Turno del Rival'}
                </div>
            </div>

            {/* Zona del Jugador Rival */}
            <div className={styles.playerZone}>
                <PlayerInfo
                    playerName={`Rival: ${opponentName}`}
                    color={isLocalRed ? 'blue' : 'red'}
                    isActive={currentTurn !== localColor}
                />
                <div className={styles.cardsRow}>
                    {opponentCards.map((card, index) => (
                        <CardView key={`opponent-card-${index}`} card={card} faction={isLocalRed ? 'blue' : 'red'} isFlipped={true} />
                    ))}
                </div>
            </div>

            {/* Zona Central: Tablero + Carta Neutral */}
            <div className={styles.centerZone}>
                <div style={{ transform: boardRotation, transition: 'transform 0.5s ease' }}>   
                    <BoardView board={board} isReversed={isLocalRed} />
                </div>
                
                {/* Contenedor para la carta neutral en la mesa */}
                <div className={styles.neutralZone}>
                    <span className={styles.neutralLabel}>
                        Mesa (Siguiente)
                    </span>
                    {neutralCard && (
                        <CardView card={neutralCard} faction="neutral" />
                    )}
                </div>
            </div>

            {/* Zona del Jugador Local */}
            <div className={styles.playerZone}>
                
                <div className={styles.cardsRow}>
                    {myCards.map((card, index) => (
                        <CardView key={`my-card-${index}`} card={card} faction={isLocalRed ? 'red' : 'blue'} />
                    ))}
                </div>

                <PlayerInfo
                    playerName={`Jugador: ${localName}`}
                    color={isLocalRed ? 'red' : 'blue'}
                    isActive={gameState.currentTurn === localColor}
                />
            </div>
        </div>

    );
};