import { useState, useMemo } from 'react';
import { type Card, type Position, type PlayerColor, type GameState, SocketEvents, type PlayerProfile } from '../../../../../shared';
import { useSocket } from '../../../contexts/SocketContext';
import { useNetwork } from './useNetwork';
import { useDrawNegotiation } from './useDrawNegotiation';
import { useRematchNegotiation } from './useRematchNegotiation';



export const useGameScreen = (
        gameState: GameState, 
        localColor: PlayerColor | null, 
        playersProfile: { red: PlayerProfile, blue: PlayerProfile } | null
) => {
    const { socket, isConnected } = useSocket();
    const rematch = useRematchNegotiation(socket);

    const networkState = useNetwork(socket, gameState.status);
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

    //Destinos Válidos
    const validTargets = useMemo(() => {
        if (!selectedCard || !selectedPiece) return [];
        const multiplier = isLocalRed ? -1 : 1;

        return selectedCard.moves.map(move => ({
            x: selectedPiece.x + move.x * multiplier,
            y: selectedPiece.y + move.y * multiplier    
        })).filter(pos => 
            pos.x >= 0 && pos.x < 5 && pos.y >= 0 && pos.y < 5
        );
    }, [selectedCard, selectedPiece, isLocalRed]);

    //Gestión de Eventos
    const handleCellClick = (position: Position) => {
        if (isGameOver || !isMyTurn) return;

        const clickedCell = board[position.y][position.x];

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
        window.location.reload();
    };



    return {
        ...networkState, ...drawNegotiationState, board, currentTurn, isLocalRed, isMyTurn, isGameOver,
        opponentName, localName, myCards, opponentCards, neutralCard, boardRotation,
        lastMove, selectedCard, setSelectedCard, selectedPiece, setSelectedPiece,
        validTargets, handleCellClick, handleSurrender, handleExit, isModalOpen, setIsModalOpen, isConnected, gameResult, rematch
    };

}

