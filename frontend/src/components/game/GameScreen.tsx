import { type GameState, type PlayerColor, type PlayerProfile } from '../../../../shared';
import { BoardView } from './ui/board/BoardView';
import { CardView } from './ui/cards/CardView';
import styles from './GameScreen.module.css';
import { useGameScreen } from './hooks/useGameScreen';
import { GameOverModal } from './ui/modals/GameOverModal';
import { GameSidePanel } from './ui/layout/GameSidePanel';
import { DrawBanner, DrawRejectedToast } from './ui/modals/DrawBanner';
import { PlayerInfo } from './ui/player/PlayerInfo';
import { NetworkStatus } from './ui/player/NetworkStatus';
import { PingIndicator } from './ui/player/PingIndicator';
import { RematchBanner } from './ui/modals/RematchBanner';
import './theme.css';
import { SurrenderConfirmModal } from './ui/modals/SurrenderConfirmModal';
import { DiscardBanner } from './ui/modals/DiscardBanner';
import type { RestoredSession } from './restoredSession';

interface GameScreenProps {
    gameState: GameState;
    localColor: PlayerColor | null;
    playersProfile: { red: PlayerProfile, blue: PlayerProfile } | null;
    // Datos restaurados al reconectar tras recargar la página (chat y ofertas pendientes).
    restored?: RestoredSession | null;
    isReconnecting: boolean;
}

export const  GameScreen: React.FC<GameScreenProps> = ({ gameState, localColor, playersProfile, restored = null, isReconnecting })  => {

    const { 
        board, currentTurn, isLocalRed, isMyTurn, isGameOver, 
        opponentName, localName, opponentElo, localElo, isVsAi, myCards, opponentCards, neutralCard, 
        boardRotation, lastMove, selectedCard, mustDiscard, handleSelectCard,  selectedPiece, 
        validTargets, handleCellClick, handleExit, handleSurrender, isModalOpen, setIsModalOpen, disconnectTimer, reconnectMessage, isConnected, timeRemaining,
        drawOfferReceived, drawOfferSent, handleOfferDraw, handleAcceptDraw, handleRejectDraw, drawRejectedMessage, gameResult, rematch, lastError, isSurrenderModalOpen, confirmSurrender, cancelSurrender
    } = useGameScreen(gameState, localColor, playersProfile, isReconnecting, restored);


    return (
        <div className={`${styles.screenContainer} gameTheme`}>
            <div className={styles.playRow}>
                <div className={styles.boardColumn}>
                    <div className={styles.cardsRow}>
                        {opponentCards.map((card, index) => (
                            <CardView key={`opponent-card-${index}`} card={card} faction={isLocalRed ? 'blue' : 'red'} isFlipped />
                        ))}
                    </div>

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

                        <div className={styles.neutralZone}>
                            <PlayerInfo
                                playerName={`Rival: ${opponentName}`}
                                elo={opponentElo}
                                color={isLocalRed ? 'blue' : 'red'}
                                isActive={!isMyTurn}
                                timeLeft={isLocalRed ? timeRemaining.blue : timeRemaining.red}
                            />
                            <NetworkStatus
                                isOpponent={true}
                                isConnected={isConnected}
                                disconnectTimer={disconnectTimer}
                                reconnectMessage={reconnectMessage}
                            />

                            <div className={styles.neutralCard}>
                                <span className={styles.neutralLabel}>Mesa (Siguiente)</span>
                                {neutralCard && <CardView card={neutralCard} faction="neutral" />}
                            </div>

                            <PlayerInfo
                                playerName={`Jugador: ${localName}`}
                                elo={localElo}
                                color={isLocalRed ? 'red' : 'blue'}
                                isActive={isMyTurn}
                                timeLeft={isLocalRed ? timeRemaining.red : timeRemaining.blue}
                            >
                                <PingIndicator isConnected={isConnected} />
                            </PlayerInfo>
                            <NetworkStatus
                                isConnected={isConnected}
                                disconnectTimer={disconnectTimer}
                                isReconnecting={isReconnecting}
                            />
                        </div>
                    </div>

                    <div className={styles.cardsRow}>
                        {myCards.map((card, index) => (
                            <CardView
                                key={`my-card-${index}`}
                                card={card}
                                faction={isLocalRed ? 'red' : 'blue'}
                                isSelected={!isGameOver && selectedCard?.name === card.name}
                                onClick={() => handleSelectCard(card)}
                            />
                        ))}
                    </div>
                </div>

                <GameSidePanel
                    status={gameState.status}
                    localColor={localColor}
                    initialChat={restored?.chatHistory}
                    notices={
                        <>
                            <DiscardBanner mustDiscard={mustDiscard} />

                            <DrawBanner
                                drawOfferReceived={drawOfferReceived}
                                onAcceptDraw={handleAcceptDraw}
                                onRejectDraw={handleRejectDraw}
                            />

                            {gameState.status === 'finished' && isGameOver && !isModalOpen && (
                                <RematchBanner
                                    rematchState={rematch.rematchState}
                                    onOfferRematch={rematch.offerRematch}
                                    onAcceptRematch={rematch.acceptRematch}
                                    onRejectRematch={rematch.rejectRematch}
                                />
                            )}
                        </>
                    }
                    isGameOver={isGameOver}
                    isVsAi={isVsAi}
                    drawOfferSent={drawOfferSent}
                    drawOfferReceived={drawOfferReceived}
                    onOfferDraw={handleOfferDraw}
                    onSurrender={handleSurrender}
                    onExit={handleExit}
                />
            </div>

            {drawRejectedMessage && <DrawRejectedToast />}

            {lastError && <div className={styles.errorToast}>{lastError}</div>}

            {gameState.status === 'finished' && isGameOver && isModalOpen && (
                <GameOverModal result={gameResult} onExit={handleExit} onCloseModal={() => setIsModalOpen(false)} />
            )}

            {isSurrenderModalOpen && (
                <SurrenderConfirmModal onConfirm={confirmSurrender} onCancel={cancelSurrender} />
            )}
        </div>
    );
};