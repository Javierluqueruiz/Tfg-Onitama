import { type GameState, type PlayerColor, type PlayerProfile } from '../../../../shared';
import { BoardView } from './BoardView';
import { CardView } from './CardView';
import { PlayerInfo } from './PlayerInfo';
import styles from './GameScreen.module.css';
import { useGameScreen } from './hooks/useGameScreen';
import { GameOverModal } from './GameOverModal';
import { GameControls } from './GameControls';
import { DrawBanner } from './DrawBanner';
import { PlayerZone } from './PlayerZone';

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
        
           
            {/* Zona del Jugador Rival */}
            <PlayerZone 
                isOpponent={true}
                playerName={`Rival: ${opponentName}`}
                color={isLocalRed ? 'blue' : 'red'}
                isActive={!isMyTurn}
                timeLeft={isLocalRed ? timeRemaining.blue : timeRemaining.red}
                cards={opponentCards}
                disconnectTimer={disconnectTimer}
                reconnectMessage={reconnectMessage}
            />

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

             <DrawBanner
                drawOfferReceived={drawOfferReceived}
                drawRejectedMessage={drawRejectedMessage}
                onAcceptDraw={handleAcceptDraw}
                onRejectDraw={handleRejectDraw}
            />


            {/* Zona del Jugador Local */}
            <PlayerZone 
                isOpponent={false}
                playerName={`Jugador: ${localName}`}
                color={isLocalRed ? 'red' : 'blue'}
                isActive={isMyTurn}
                timeLeft={isLocalRed ? timeRemaining.red : timeRemaining.blue}
                cards={myCards}
                selectedCard={selectedCard}
                onSelectCard={setSelectedCard}
                isGameOver={isGameOver}
                isConnected={isConnected}
                disconnectTimer={disconnectTimer}
            />

            <GameControls
                status={gameState.status}
                isGameOver={isGameOver}
                drawOfferSent={drawOfferSent}
                drawOfferReceived={drawOfferReceived}
                onOfferDraw={handleOfferDraw}
                onSurrender={handleSurrender}
                onExit={handleExit}
            />

        
            {gameState.status === 'finished' && isGameOver && isModalOpen && (
                <GameOverModal result={gameResult} onExit={handleExit} onCloseModal={() => setIsModalOpen(false)} />
            )}
        </div>
    );
};