import { Card, GameState, Position } from "../../../shared";
import { BoardGenerator } from "./BoardGenerator";
import { DeckManager } from "./DeckManager";
import { MoveArbitrator } from "./MoveArbitrator";
import { MovementManager } from "./MovementManager";
import { VictoryArbitrator } from "./VictoryArbitrator";

export class GameEngine {

    public createNewGame(roomId: string): GameState {
        const board = BoardGenerator.createInitialBoard();
        const deckResult = DeckManager.drawInitialCards();

        return {
            roomId, 
            status: 'waiting',
            currentTurn: deckResult.firstTurn,
            board,
            cards: deckResult.cards,
            winner: null,
            timeRemaining: {
                red: 600,
                blue: 600
            },
        };
    }

    //FEAT-08: Alternar el turno entre los jugadores
    public switchTurn(currentState: GameState): GameState {

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

    //Flujo de turno completo
    public processTurn(state: GameState, from: Position, to: Position, cardName: string): GameState {
        const newState: GameState = { ...state };

        //FEAT-06: Validar movimiento
        const hand = newState.currentTurn === 'red' ? newState.cards.red : newState.cards.blue;
        const cardUsed = hand.find(card => card.name === cardName);

        if (!cardUsed) throw new Error(`La carta ${cardName} no está en la mano del jugador ${newState.currentTurn}`);

        MoveArbitrator.validateMove(newState.board, from, to, newState.currentTurn,cardUsed);

        //FEAT-03/04: Ejecución del movimiento
        newState.board = MovementManager.movePiece(newState.board, from, to).newBoard;

        //FEAT-09: Verificar condiciones de victoria
        const winner = VictoryArbitrator.checkVictory(newState.board);

        if (winner) {
            newState.status = 'finished';
            newState.winner = winner;
            newState.lastMove = { from, to };
            return newState;
        }

        //FEAT-05: Rotación de cartas
        newState.cards = DeckManager.playCard(newState.cards, newState.currentTurn, cardName);

        //FEAT-08: Cambio de turno y detección de bloqueos
        const finalState =  this.switchTurn(newState);
        finalState.lastMove = { from, to };
        return finalState;
    }
}