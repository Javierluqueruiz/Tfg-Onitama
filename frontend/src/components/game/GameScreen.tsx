import { type GameState, type PlayerColor, type PlayerProfile } from '../../../../shared';
import { BoardView } from './ui/board/BoardView';
import { CardView } from './ui/cards/CardView';
import styles from './GameScreen.module.css';
import { useGameScreen } from './hooks/useGameScreen';
import { GameOverModal } from './ui/modals/GameOverModal';
import { GameControls } from './ui/layout/GameControls';
import { DrawBanner } from './ui/modals/DrawBanner';
import { PlayerZone } from './ui/player/PlayerZone';
import { RematchBanner } from './ui/modals/RematchBanner';
import { ChatBox } from './ui/chat/ChatBox';
import './theme.css';

interface GameScreenProps {
    gameState: GameState;
    localColor: PlayerColor | null;
    playersProfile: { red: PlayerProfile, blue: PlayerProfile } | null;
}

export const  GameScreen: React.FC<GameScreenProps> = ({ gameState, localColor, playersProfile })  => {

    const { 
        board, currentTurn, isLocalRed, isMyTurn, isGameOver, 
        opponentName, localName, myCards, opponentCards, neutralCard, 
        boardRotation, lastMove, selectedCard, setSelectedCard, selectedPiece, 
        validTargets, handleCellClick, handleExit, handleSurrender, isModalOpen, setIsModalOpen, disconnectTimer, reconnectMessage, isConnected, timeRemaining,
        drawOfferReceived, drawOfferSent, handleOfferDraw, handleAcceptDraw, handleRejectDraw, drawRejectedMessage, gameResult, rematch, lastError, isReconnecting
    } = useGameScreen(gameState, localColor, playersProfile);


    return (    
        <div className={`${styles.screenContainer} gameTheme`}>
            {/*<div className={styles.header}>
                <h2 className={styles.title}>Sala de Juego</h2>
                <div className={`${styles.turnIndicator} ${isMyTurn ? styles.turnRed : styles.turnBlue}`}>
                    {isMyTurn ? 'Tu Turno' : 'Turno del Rival'}
                </div>
            </div>*/}
        
           
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
                <div
                    className={styles.boardWrapper} 
                    style={{ transform: boardRotation, transition: 'transform 0.5s ease' }}>   
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

            <div className={styles.chatArea}>
                <ChatBox />
            </div>

            <DrawBanner
                drawOfferReceived={drawOfferReceived}
                drawRejectedMessage={drawRejectedMessage}
                onAcceptDraw={handleAcceptDraw}
                onRejectDraw={handleRejectDraw}
            />

            {lastError && <div className={styles.toastError}>{lastError}</div>}

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
                isReconnecting={isReconnecting}
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

            {/* NUEVO: Banner de Revancha que flota sobre el tablero finalizado */}
            {gameState.status === 'finished' && isGameOver && !isModalOpen && (
                <RematchBanner 
                    rematchState={rematch.rematchState}
                    onOfferRematch={rematch.offerRematch}
                    onAcceptRematch={rematch.acceptRematch}
                    onRejectRematch={rematch.rejectRematch}
                />
            )}

        
            {gameState.status === 'finished' && isGameOver && isModalOpen && (
                <GameOverModal result={gameResult} onExit={handleExit} onCloseModal={() => setIsModalOpen(false)} />
            )}
        </div>
    );
};