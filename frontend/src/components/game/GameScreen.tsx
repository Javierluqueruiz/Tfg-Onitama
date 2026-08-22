import { type GameState, type PlayerColor, type PlayerProfile } from '../../../../shared';
import { BoardView } from './BoardView';
import { CardView } from './CardView';
import { PlayerInfo } from './PlayerInfo';
import styles from './GameScreen.module.css';
import { useGameScreen } from './useGameScreen';
import { GameOverModal } from './GameOverModal';

interface GameScreenProps {
    gameState: GameState;
    localColor: PlayerColor | null;
    playersProfile: { red: PlayerProfile, blue: PlayerProfile } | null;
}

export const  GameScreen: React.FC<GameScreenProps> = ({ gameState, localColor, playersProfile })  => {

    const { 
        board, currentTurn, isLocalRed, isMyTurn, isGameOver, isWinner,
        opponentName, localName, myCards, opponentCards, neutralCard, 
        boardRotation, lastMove, selectedCard, setSelectedCard, selectedPiece, 
        validTargets, handleCellClick, handleExit, handleSurrender, isModalOpen, setIsModalOpen, disconnectTimer, reconnectMessage
    } = useGameScreen(gameState, localColor, playersProfile);

    return (    
        <div className={styles.screenContainer}>
            <div className={styles.header}>
                <h2 className={styles.title}>Sala de Juego</h2>
                <div className={`${styles.turnIndicator} ${isMyTurn ? styles.turnRed : styles.turnBlue}`}>
                    {isMyTurn ? 'Tu Turno' : 'Turno del Rival'}
                </div>
            </div>

            {/* Zona del Jugador Rival */}
            <div className={styles.playerZone}>
                <PlayerInfo
                    playerName={`Rival: ${opponentName}`}
                    color={isLocalRed ? 'blue' : 'red'}
                    isActive={!isMyTurn}
                />
                <div className={styles.cardsRow}>
                    {opponentCards.map((card, index) => (
                        <CardView key={`opponent-card-${index}`} card={card} faction={isLocalRed ? 'blue' : 'red'} isFlipped={true} />
                    ))}
                </div>

                {/* Sub-05.2: Desconexión */}
                {disconnectTimer !== null && disconnectTimer > 0 && (
                    <div className={styles.disconnectBanner}>
                        El oponente se ha desconectado. Esperando reconexión... <strong>({disconnectTimer}s)</strong>
                    </div>
                )}

                {/* Sub-05.2: Reconexión */}
                {reconnectMessage && (
                    <div className={styles.reconnectBanner}>
                        El oponente se ha reconectado.
                    </div>
                )}
            </div>

            {/* Zona Central: Tablero + Carta Neutral */}
            <div className={styles.centerZone}>
                <div style={{ transform: boardRotation, transition: 'transform 0.5s ease' }}>   
                    <BoardView 
                        board={board} 
                        isReversed={isLocalRed}
                        localColor={localColor}
                        currentTurn={currentTurn}
                        selectedPiece={selectedPiece}
                        validTargets={validTargets}
                        onCellClick={handleCellClick}
                        lastMove={lastMove}
                     />
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
                    {myCards.map((card, index) => {
                        const isCardSelected = selectedCard?.name === card.name && !isGameOver;
                        return (
                            <CardView 
                                key={`my-card-${index}`} 
                                card={card} 
                                faction={isLocalRed ? 'red' : 'blue'} 
                                isSelected={isCardSelected} 
                                onClick={() => setSelectedCard(card)} 
                            />
                        )
                    })}
                </div>
                <PlayerInfo
                    playerName={`Jugador: ${localName}`}
                    color={isLocalRed ? 'red' : 'blue'}
                    isActive={isMyTurn}
                />
            </div>

            <div className={styles.gameControls}>
                {gameState.status === 'finished' ? (
                    <button 
                        className={styles.btnExit}
                        onClick={handleExit}>
                        Salir de la Partida
                    </button>
                ) : (

                    <button
                        className={styles.btnSurrender}
                        onClick={handleSurrender}
                        disabled={isGameOver}
                    >
                        Rendirse
                    </button>
                )}
            </div>
            

            {gameState.status === 'finished' && isGameOver && isModalOpen && (
                <GameOverModal isWinner={isWinner} onExit={handleExit} onCloseModal={() => setIsModalOpen(false)} />
            )}
        </div>
    );
};