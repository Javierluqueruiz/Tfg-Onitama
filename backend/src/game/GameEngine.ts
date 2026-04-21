import { Card, GameState } from "../../../shared/types";
import { BoardGenerator } from "./BoardGenerator";
import { DeckManager } from "./DeckManager";
import { MoveArbitrator } from "./MoveArbitrator";

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

    //FEAT-08: Alternar el turno entre los jugadores
    public static switchTurn(currentState: GameState): GameState {

        const newState: GameState = {
            ...currentState,
            cards: {
                red: [...currentState.cards.red],
                blue: [...currentState.cards.blue],
                neutral: { ...currentState.cards.neutral }
            }
        } ;

        newState.currentTurn = currentState.currentTurn === 'red' ? 'blue' : 'red';

        //Preparamos los datos para realizar la validación de movimientos válidos (FEAT-07)
        const handCards: [Card, Card] = newState.currentTurn === 'red' ? newState.cards.red : newState.cards.blue;

        const hasValidMove: boolean = MoveArbitrator.hasValidMoves(newState.board, newState.currentTurn, handCards as [Card, Card]);

        if (!hasValidMove) {
            newState.status = 'waiting_for_discard';
            console.log(`[FEAT-08] El jugador ${newState.currentTurn} no tiene movimientos válidos. Esperando a que descarte una carta...`);
        } else {
            newState.status = 'in_progress';
        }

        return newState;
    }
}