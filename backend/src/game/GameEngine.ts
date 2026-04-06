import { GameState } from "../../../shared/types";
import { BoardGenerator } from "./BoardGenerator";
import { DeckManager } from "./DeckManager";

export class GameEngine {

    public static createNewGame(roomId: string): GameState {
        const board = BoardGenerator.createInitialBoard();
        const deckResult = DeckManager.drawInitialCards();

        return {
            roomId,
            status: 'waiting',
            currentTurn: deckResult.firstTurn,
            board, 
            cards: deckResult.cards,
            winner: null
        };

    }

}