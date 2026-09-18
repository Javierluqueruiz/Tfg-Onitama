import { Server } from "socket.io";
import { GameState, PlayerColor, RoomSession, SocketEvents } from "../../../shared";
import { RoomManager } from "./RoomManager";
import { AiPlayer } from "../ai/AiPlayer";

const AI_THINKING_DELAY = 750;

export class AiTurnRunner {

    public static maybePlayTurn(io: Server, roomId: string): void {
        const room = RoomManager.getRoomById(roomId);
        if (!room || room.gameState.status === 'finished') return;
        
        const aiColor: PlayerColor | null = this.getAiColor(room);
        if (!aiColor || room.gameState.currentTurn !== aiColor) return;

        setTimeout(() => this.playTurn(io, roomId, aiColor), AI_THINKING_DELAY);

    }

    private static getAiColor(room: RoomSession): PlayerColor | null {
        const players = room.players;
        if (players.red?.isAi) return 'red';
        if (players.blue?.isAi) return 'blue';
        return null;
    }

    private static playTurn(io: Server, roomId: string, aiColor: PlayerColor): void {
        const room = RoomManager.getRoomById(roomId);
        if (!room || room.gameState.status === 'finished' || room.gameState.currentTurn !== aiColor) return;

        const { board, cards, status } = room.gameState;
        let committedState: GameState | null;

        if (status === 'waiting_for_discard') {
            const cardToDiscard = AiPlayer.selectDiscard(board, aiColor, cards);
            committedState = RoomManager.applyDiscard(roomId, cardToDiscard);
        } else {
            const move = AiPlayer.selectMove(board, aiColor, cards);
            committedState = RoomManager.applyMove(roomId, move.from, move.to, move.cardName);
        }

        io.to(roomId).emit(SocketEvents.GAME_UPDATE, { gameState: committedState });
    }
}