import React, {useState, useMemo} from 'react';
import { type GameState, type PlayerColor, type PlayerProfile, type Card, type Position, SocketEvents } from '../../../../shared';
import { BoardView } from './BoardView';
import { CardView } from './CardView';
import { PlayerInfo } from './PlayerInfo';
import styles from './GameScreen.module.css';
import { useSocket } from '../../contexts/SocketContext';

interface GameScreenProps {
    gameState: GameState;
    localColor: PlayerColor | null;
    playersProfile: { red: PlayerProfile, blue: PlayerProfile } | null;
}

export const GameScreen: React.FC<GameScreenProps> = ({ gameState, localColor, playersProfile })  => {
    const { socket } = useSocket();
    const {board, currentTurn} = gameState;
    const redCards = gameState.cards.red;
    const blueCards = gameState.cards.blue;
    const neutralCard = gameState.cards.neutral;

    const isLocalRed = localColor === 'red';

    const opponentName = isLocalRed ? playersProfile?.blue.name : playersProfile?.red.name;
    const localName = isLocalRed ? playersProfile?.red.name : playersProfile?.blue.name;

    
    //Cartas
    const myCards = isLocalRed ? redCards : blueCards;
    const opponentCards = isLocalRed ? blueCards : redCards;

    const boardRotation = isLocalRed ? 'rotate(180deg)' : 'rotate(0deg)';

    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);

    // Ganador
    const isGameOver = gameState.winner !== null;
    const isWinner = gameState.winner === localColor;

    const validTargets = useMemo(() => {
        if (!selectedCard || !selectedPiece) return [];

        return selectedCard.moves.map(move => {
            const multiplier = isLocalRed ? -1 : 1;
            return{
                x: selectedPiece.x + move.x * multiplier,
                y: selectedPiece.y + move.y * multiplier    
            };
        }).filter(pos => 
            pos.x >= 0 && pos.x < 5 && pos.y >= 0 && pos.y < 5
        );
    }, [selectedCard, selectedPiece, isLocalRed]);

    const handleCellClick = (position: Position) => {
        if (isGameOver || currentTurn !== localColor) return;

        const clickedCell = board[position.y][position.x];
        const isMyPiece = clickedCell && clickedCell.color === localColor;

        if (isMyPiece) {
            if (!selectedCard) {
                console.log("Selecciona una carta primero")
                return;
            }
            setSelectedPiece(position);
            return;
        }

        const isTarget = validTargets.some(t=>t.x === position.x && t.y === position.y);
        if (isTarget && selectedPiece && selectedCard) {
            const moveData = {
                from: { x: selectedPiece.x, y: selectedPiece.y},
                to : { x: position.x, y: position.y},
                cardName: selectedCard.name
            };

            console.log("Movimiento realizado:", moveData);
            socket?.emit(SocketEvents.PLAYER_MOVE, moveData);

            setSelectedCard(null);
            setSelectedPiece(null);
        }
    }

    const handleExit = () => {
        socket?.emit(SocketEvents.LEAVE_ROOM);
        window.location.reload();
    }

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
                    <BoardView 
                        board={board} 
                        isReversed={isLocalRed}
                        localColor={localColor}
                        currentTurn={currentTurn}
                        selectedPiece={selectedPiece}
                        validTargets={validTargets}
                        onCellClick={handleCellClick}
                        lastMove={gameState.lastMove}
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
                        const isCardSelected = selectedCard?.name === card.name;
                        return (
                            <CardView key={`my-card-${index}`} card={card} faction={isLocalRed ? 'red' : 'blue'} isSelected={isCardSelected} onClick={() => setSelectedCard(card)} />
                        )
})}
                </div>

                <PlayerInfo
                    playerName={`Jugador: ${localName}`}
                    color={isLocalRed ? 'red' : 'blue'}
                    isActive={gameState.currentTurn === localColor}
                />
            </div>

            {isGameOver && (
                <div className={styles.overlay}>
                    <div className={styles.victoryModal}>
                        <h2 className={`${styles.victoryTitle} ${isWinner ? styles.victoryWin : styles.defeatLose}`}>
                        {isWinner ? '¡Victoria!' : 'Derrota'}
                    </h2>
                    <p>{isWinner ? '¡Felicidades! Has ganado la partida.' : 'No te rindas, ¡inténtalo de nuevo!'}</p>

                    <button 
                        className={styles.btnExit}
                        onClick={handleExit}
                    >
                        Volver al Menú
                    </button>
                    </div>
                </div>
            )}
        </div>

        

    );
};