import { useState, useMemo } from 'react';
import { type Card, type Position, type PlayerColor, type GameState, SocketEvents, type PlayerProfile, getCellAt } from '../../../../../shared';
import { useSocket } from '../../../contexts/SocketContext';
import { useNetwork } from './useNetwork';
import { useDrawNegotiation } from './useDrawNegotiation';
import { useRematchNegotiation } from './useRematchNegotiation';
import { useGameReconnection } from './useGameReconnection';
import { useSocketEvent } from '../../../hooks/useSocketEvent';
import { getValidTargets } from '../logic/getValidTargets';

export const useGameScreen = (
        gameState: GameState, 
        localColor: PlayerColor | null, 
        playersProfile: { red: PlayerProfile, blue: PlayerProfile } | null
) => {
    const { socket, isConnected, lastError } = useSocket();
    const { isReconnecting } = useGameReconnection(socket);
    const rematch = useRematchNegotiation(socket);

    const networkState = useNetwork(socket);
    const drawNegotiationState = useDrawNegotiation(socket);

    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);

    //Estado global
    const [isModalOpen, setIsModalOpen] = useState(true);
    const {board, currentTurn, cards, winner, lastMove} = gameState;
    const isLocalRed = localColor === 'red';
    const isMyTurn = currentTurn === localColor;
    const isGameOver = winner !== null;

    //Perfiles y nombres
    const opponentName = isLocalRed ? playersProfile?.blue.name : playersProfile?.red.name;
    const localName = isLocalRed ? playersProfile?.red.name : playersProfile?.blue.name;
    
    //Cartas
    const myCards = isLocalRed ? cards.red : cards.blue;
    const opponentCards = isLocalRed ? cards.blue : cards.red;
    const neutralCard = cards.neutral;
    const boardRotation = isLocalRed ? 'rotate(180deg)' : 'rotate(0deg)';

    let gameResult: 'win' | 'lose' | 'draw' = 'lose';

    if (gameState.winner === localColor) {
        gameResult = 'win';
    } else if (gameState.winner === 'draw') {
        gameResult = 'draw';
    }

    
    useSocketEvent(socket, SocketEvents.GAME_START, () => {
        setIsModalOpen(true);
        setSelectedCard(null);
        setSelectedPiece(null);
    });

    //Destinos Válidos
    //Destinos Válidos
    const validTargets = useMemo(
        () => getValidTargets(board, selectedCard, selectedPiece, localColor, isLocalRed),
        [selectedCard, selectedPiece, isLocalRed, board, localColor]
    );  

    //Gestión de Eventos
    const handleCellClick = (position: Position) => {
        if (isGameOver || !isMyTurn || isReconnecting) return;

        const clickedCell = getCellAt(board, position);

        if (clickedCell && clickedCell.color === localColor) {
            if (!selectedCard) {
                console.log("Selecciona una carta primero")
            return;
            }
            return setSelectedPiece(position);
        }
    
        const isTarget = validTargets.some(t=>t.x === position.x && t.y === position.y);
        if (isTarget && selectedPiece && selectedCard) {
            const moveData = {
                from: selectedPiece,
                to : position,
                cardName: selectedCard.name
            };

            socket?.emit(SocketEvents.PLAYER_MOVE, moveData);

            setSelectedCard(null);
            setSelectedPiece(null);
        }
    };

    const handleSurrender = () => {
        if (!isGameOver) {
            const confirmSurrender = window.confirm("¿Estás seguro de que deseas abandonar la partida? Tu oponente ganará automáticamente.");
            if (confirmSurrender) {
                socket?.emit(SocketEvents.SURRENDER);
            }
        }
    };

    const handleExit = () => {
        socket?.emit(SocketEvents.LEAVE_ROOM);
        localStorage.removeItem('onitama_session');
        window.location.reload();
    };



    return {
        ...networkState, ...drawNegotiationState, board, currentTurn, isLocalRed, isMyTurn, isGameOver,
        opponentName, localName, myCards, opponentCards, neutralCard, boardRotation,
        lastMove, selectedCard, setSelectedCard, selectedPiece, setSelectedPiece,
        validTargets, handleCellClick, handleSurrender, handleExit, isModalOpen, setIsModalOpen, isConnected, gameResult, rematch, isReconnecting, lastError
    };

}

