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
        validTargets, handleCellClick, handleExit, handleSurrender, isModalOpen, setIsModalOpen, disconnectTimer, reconnectMessage, isConnected, timeRemaining,
        drawOfferReceived, drawOfferSent, handleOfferDraw, handleAcceptDraw, handleRejectDraw, drawRejectedMessage, gameResult
    } = useGameScreen(gameState, localColor, playersProfile);


    return (    
        <div className={styles.screenContainer}>
            <div className={styles.header}>
                <h2 className={styles.title}>Sala de Juego</h2>
                <div className={`${styles.turnIndicator} ${isMyTurn ? styles.turnRed : styles.turnBlue}`}>
                    {isMyTurn ? 'Tu Turno' : 'Turno del Rival'}
                </div>
            </div>

            {drawRejectedMessage && (
                <div className={styles.toastError}>
                    El oponente ha rechazado tu oferta de empate. La partida continúa.
                </div>
            )}

            {drawOfferReceived && ( 
                <div className={styles.drawBanner}>
                    <p>Tu oponente ha ofrecido un empate. ¿Aceptas?</p>
                    <div className={styles.drawActions}>
                        <button className={styles.btnAccept} onClick={handleAcceptDraw}>Aceptar</button>
                        <button className={styles.btnReject} onClick={handleRejectDraw}>Rechazar</button>
                    </div>
                </div>
            )}

            {/* Zona del Jugador Rival */}
            <div className={styles.playerZone}>
                <PlayerInfo
                    playerName={`Rival: ${opponentName}`}
                    color={isLocalRed ? 'blue' : 'red'}
                    isActive={!isMyTurn}
                    timeLeft={isLocalRed ? timeRemaining.blue : timeRemaining.red}
                />
                <div className={styles.cardsRow}>
                    {opponentCards.map((card, index) => (
                        <CardView key={`opponent-card-${index}`} card={card} faction={isLocalRed ? 'blue' : 'red'} isFlipped={true} />
                    ))}
                </div>

                {/* Sub-05.2: Desconexión */}
                {!isConnected && (
                    <div className={styles.disconnectBanner}>
                        Conexión perdida. Intentando reconectar...
                    </div>
                )}

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
                    timeLeft={isLocalRed ? timeRemaining.red : timeRemaining.blue}
                />
            </div>

            <div className={styles.gameControls}>
                {gameState.status !== 'finished' && (
                    <button
                        className={styles.btnOfferDraw}
                        onClick={handleOfferDraw}
                        disabled={drawOfferSent || drawOfferReceived || isGameOver}
                    >
                        {drawOfferSent ? 'Oferta de Empate Enviada' : 'Ofrecer Empate'}
                    </button>
                )}

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
                <GameOverModal result={gameResult} onExit={handleExit} onCloseModal={() => setIsModalOpen(false)} />
            )}
        </div>
    );
};