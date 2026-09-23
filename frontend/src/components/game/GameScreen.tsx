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
import { SurrenderConfirmModal } from './ui/modals/SurrenderConfirmModal';
import { DiscardBanner } from './ui/modals/DiscardBanner';

interface GameScreenProps {
    gameState: GameState;
    localColor: PlayerColor | null;
    playersProfile: { red: PlayerProfile, blue: PlayerProfile } | null;
    isReconnecting: boolean;
}

export const  GameScreen: React.FC<GameScreenProps> = ({ gameState, localColor, playersProfile, isReconnecting })  => {

    const { 
        board, currentTurn, isLocalRed, isMyTurn, isGameOver, 
        opponentName, localName, opponentElo, localElo, isVsAi, myCards, opponentCards, neutralCard, 
        boardRotation, lastMove, selectedCard, mustDiscard, handleSelectCard,  selectedPiece, 
        validTargets, handleCellClick, handleExit, handleSurrender, isModalOpen, setIsModalOpen, disconnectTimer, reconnectMessage, isConnected, timeRemaining,
        drawOfferReceived, drawOfferSent, handleOfferDraw, handleAcceptDraw, handleRejectDraw, drawRejectedMessage, gameResult, rematch, lastError, isSurrenderModalOpen, confirmSurrender, cancelSurrender
    } = useGameScreen(gameState, localColor, playersProfile, isReconnecting);


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
                elo={opponentElo}
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

            <DiscardBanner mustDiscard={mustDiscard} />

            {lastError && <div className={styles.toastError}>{lastError}</div>}

            {/* Zona del Jugador Local */}
            <PlayerZone 
                isOpponent={false}
                playerName={`Jugador: ${localName}`}
                elo={localElo}
                color={isLocalRed ? 'red' : 'blue'}
                isActive={isMyTurn}
                timeLeft={isLocalRed ? timeRemaining.red : timeRemaining.blue}
                cards={myCards}
                selectedCard={selectedCard}
                onSelectCard={handleSelectCard}
                isGameOver={isGameOver}
                isConnected={isConnected}
                disconnectTimer={disconnectTimer}
                isReconnecting={isReconnecting}
            />

            <GameControls
                status={gameState.status}
                isGameOver={isGameOver}
                isVsAi={isVsAi}
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

            {isSurrenderModalOpen && (
                <SurrenderConfirmModal onConfirm={confirmSurrender} onCancel={cancelSurrender} />
            )}
        </div>
    );
};