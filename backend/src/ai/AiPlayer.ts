import { Board, Card, GameState, PlayerColor } from "../../../shared";
import { MoveArbitrator, LegalMove } from "../game/MoveArbitrator";
import { MovementManager } from "../game/MovementManager";
import { DeckManager } from "../game/DeckManager";
import { HeuristicEvaluator } from "./HeuristicEvaluator";

export class AiPlayer {

    //FEAT-14 (Sub-14.2): Elige el movimiento legal con mejor puntuación heurística
    public static selectMove(board: Board, player: PlayerColor, cards: GameState['cards']): LegalMove {
        const handCards: Card[] = cards[player];
        const legalMoves: LegalMove[] = MoveArbitrator.generateLegalMoves(board, player, handCards);

        if (legalMoves.length === 0) {
            throw new Error(`[FEAT-14] No hay movimientos legales disponibles para el jugador ${player}`);
        }

        let bestMove =  legalMoves[0];
        let bestScore = this.scoreMove(board, player, cards, bestMove);

        for (let i = 1; i < legalMoves.length; i++) {
            const move = legalMoves[i];
            const score = this.scoreMove(board, player, cards, move);

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        return bestMove;
    }

    private static scoreMove(board: Board, player: PlayerColor, cards: GameState['cards'], move: LegalMove): number {
        const simulatedBoard = MovementManager.movePiece(board, move.from, move.to).newBoard;
        const simulatedCards = DeckManager.playCard(cards, player, move.cardName);

        return HeuristicEvaluator.evaluate(simulatedBoard, player, simulatedCards);
    }
}