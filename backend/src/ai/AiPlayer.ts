import { Board, Card, GameState, PlayerColor, AiDifficulty } from "../../../shared";
import { MoveArbitrator, LegalMove } from "../game/MoveArbitrator";
import { MovementManager } from "../game/MovementManager";
import { DeckManager } from "../game/DeckManager";
import { HeuristicEvaluator, EvaluatorWeights, DEFAULT_EVALUATOR_WEIGHTS } from "./HeuristicEvaluator";

export const DIFFICULTY_EPSILON: Record<AiDifficulty, number> = {
    easy: 0.85,
    medium: 0.45,
    hard: 0
};

export interface SelectMoveOptions {
    difficulty?: AiDifficulty;
    random?: () => number;
    weights?: EvaluatorWeights;
}

export class AiPlayer {

    //FEAT-14 (Sub-14.2): Elige el movimiento legal con mejor puntuación heurística
    public static selectMove(board: Board, player: PlayerColor, cards: GameState['cards'], options: SelectMoveOptions = {}): LegalMove {
        const { difficulty = 'hard', random = Math.random, weights = DEFAULT_EVALUATOR_WEIGHTS } = options;

        const handCards: Card[] = cards[player];
        const legalMoves: LegalMove[] = MoveArbitrator.generateLegalMoves(board, player, handCards);

        if (legalMoves.length === 0) {
            throw new Error(`[FEAT-14] No hay movimientos legales disponibles para el jugador ${player}`);
        }

        const scoredMoves = legalMoves.map(move => ({ move, score: this.scoreMove(board, player, cards, move, weights) }));
        const winningMove = scoredMoves.find(scored => scored.score === Number.POSITIVE_INFINITY);

        if (winningMove) return winningMove.move;

        const epsilon = DIFFICULTY_EPSILON[difficulty];
        if (epsilon > 0 && random() < epsilon) {
            return legalMoves[Math.floor(random() * legalMoves.length)];
        }

        return scoredMoves.reduce((best, scored) => scored.score > best.score ? scored : best).move;
    }

    private static scoreMove(board: Board, player: PlayerColor, cards: GameState['cards'], move: LegalMove, weights: EvaluatorWeights): number {
        const simulatedBoard = MovementManager.movePiece(board, move.from, move.to).newBoard;
        const simulatedCards = DeckManager.playCard(cards, player, move.cardName);

        return HeuristicEvaluator.evaluate(simulatedBoard, player, simulatedCards, weights);
    }

    //FEAT-14 (Sub-14.3): Elige qué carta descartar
    public static selectDiscard(board: Board, player: PlayerColor, cards: GameState['cards']): string {
        const hand: Card[] = cards[player];

        let bestCard = hand[0];
        let bestScore = this.scoreDiscard(board, player, cards, bestCard.name);

        for (let i = 1; i < hand.length; i++) {
            const candidate = hand[i];
            const score = this.scoreDiscard(board, player, cards, candidate.name);

            if (score > bestScore || (score === bestScore && candidate.moves.length < bestCard.moves.length)) {
                bestScore = score;
                bestCard = candidate;
            }
        }

        return bestCard.name;
    }

    private static scoreDiscard(board: Board, player: PlayerColor, cards: GameState['cards'], cardToDiscard: string): number {
        const simulatedCards = DeckManager.playCard(cards, player, cardToDiscard);
        return HeuristicEvaluator.evaluate(board, player, simulatedCards);
    }
}