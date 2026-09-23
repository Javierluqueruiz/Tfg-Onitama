import { type GameState, type PlayerColor, SocketEvents } from "../../../../../shared";
import { type Socket } from "socket.io-client";

//Sub-14.1
export const useDiscardPrompt = (socket: Socket | null, gameState: GameState, localPlayerColor: PlayerColor | null) => {
    const mustDiscard = gameState.status === 'waiting_for_discard' && gameState.currentTurn === localPlayerColor;

    const handleDiscard = (cardName: string) => {
        socket?.emit(SocketEvents.DISCARD_CARD, { cardName });
    };

    return { mustDiscard, handleDiscard };
};