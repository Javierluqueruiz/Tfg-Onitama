import { GameState, PlayerColor } from '../../../shared';
import { GameEngine } from '../game/GameEngine';
import { LegalMove, MoveArbitrator } from '../game/MoveArbitrator';
import { AiPlayer } from './AiPlayer';
import { EvaluatorWeights, DEFAULT_EVALUATOR_WEIGHTS, HeuristicEvaluator } from './HeuristicEvaluator';

export type DiscardMode = 'search' | 'heuristic';

export interface MinimaxOptions {
    depth: number;
    discardMode?: DiscardMode;
    random?: () => number;
    weights?: EvaluatorWeights;
}

interface SearchContext {
    player: PlayerColor;
    weights: EvaluatorWeights;
    discardMode: DiscardMode;
}

export class MinimaxPlayer {

    //FEAT-15 (Sub-15.1)
    public static selectMove(state: GameState, options: MinimaxOptions): LegalMove {
        const { depth, weights = DEFAULT_EVALUATOR_WEIGHTS, discardMode = 'search', random = Math.random } = options;
        this.validateDepth(depth);

        const player = state.currentTurn;
        const context: SearchContext = { player, weights, discardMode };
        const legalMoves = MoveArbitrator.generateLegalMoves(state.board, player, state.cards[player]);

        if ( legalMoves.length === 0 ) {
            throw new Error('No hay movimientos legales disponibles para el jugador actual');
        } 

        const scoredMoves = legalMoves.map(move => {
            const child = GameEngine.processTurn(state, move.from, move.to, move.cardName);
            return { move, child, score: this.search(child, depth - 1, context) };
        });

        const winningMove = scoredMoves.find(scored => scored.child.status === 'finished' && scored.child.winner === player);
        if (winningMove) return winningMove.move;

        return this.pickBest(scoredMoves, random).move;
    }

    public static selectDiscard(state: GameState, options: MinimaxOptions): string {
        const { depth, weights = DEFAULT_EVALUATOR_WEIGHTS, discardMode = 'search', random = Math.random } = options;
        this.validateDepth(depth);

        if (state.status !== 'waiting_for_discard') {
            throw new Error('La partida no está esperando un descarte');
        }

        const context: SearchContext = { player: state.currentTurn, weights, discardMode };
        const scoredCards = this.discardOptions(state, discardMode).map(cardName => ({
            cardName,
            score: this.search(GameEngine.discardCard(state, cardName), depth - 1, context)
        }));

        return this.pickBest(scoredCards, random).cardName;
    }

    private static validateDepth(depth: number): void {
        if (!Number.isInteger(depth) || depth < 1) {
            throw new Error('La profundidad debe ser un entero mayor o igual a 1');
        }
    }

    private static search(state: GameState, depth: number, context: SearchContext): number {
        if (depth === 0 || state.status === 'finished') {
            return HeuristicEvaluator.evaluate(state.board, context.player, state.cards, context.weights);
        }

        const scores = this.successors(state, context.discardMode).map(child => this.search(child, depth - 1, context));

        return state.currentTurn === context.player ? Math.max(...scores) : Math.min(...scores);
    }

    private static successors(state: GameState, discardMode: DiscardMode): GameState[] {
        const turn = state.currentTurn;

        if (state.status === 'waiting_for_discard') {
            return this.discardOptions(state, discardMode).map(cardName => GameEngine.discardCard(state, cardName));
        }

        return MoveArbitrator.generateLegalMoves(state.board, turn, state.cards[turn])
            .map(move => GameEngine.processTurn(state, move.from, move.to, move.cardName));
    }

    private static discardOptions(state: GameState, discardMode: DiscardMode): string[] {
        if (discardMode === 'heuristic') {
            return [AiPlayer.selectDiscard(state.board, state.currentTurn, state.cards)];
        }

        return state.cards[state.currentTurn].map(card => card.name);
    }

    private static pickBest<T extends { score: number }>(scored: T[], random: () => number): T {
        const bestScore = Math.max(...scored.map(item => item.score));
        const best = scored.filter(item => item.score === bestScore);

        return best[Math.floor(random() * best.length)];
    }
}

