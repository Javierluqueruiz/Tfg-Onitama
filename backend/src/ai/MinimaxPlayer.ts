import { GameState, PlayerColor } from '../../../shared';
import { GameEngine } from '../game/GameEngine';
import { LegalMove, MoveArbitrator } from '../game/MoveArbitrator';
import { AiPlayer } from './AiPlayer';
import { EvaluatorWeights, DEFAULT_EVALUATOR_WEIGHTS, HeuristicEvaluator } from './HeuristicEvaluator';

export type DiscardMode = 'search' | 'heuristic';
//Sub-15.2
export type SearchAlgorithm = 'minimax' | 'alphabeta' | 'alphabeta-ordered';

export interface SearchStats {
    nodes: number;
}

export interface MinimaxOptions {
    depth: number;
    algorithm?: SearchAlgorithm;
    discardMode?: DiscardMode;
    random?: () => number;
    weights?: EvaluatorWeights;
    stats?: SearchStats;
}

interface SearchContext {
    player: PlayerColor;
    weights: EvaluatorWeights;
    discardMode: DiscardMode;
    prune?: boolean;
    order?: boolean;
    stats?: SearchStats;
}

export class MinimaxPlayer {

    //FEAT-15 (Sub-15.1)
    public static selectMove(state: GameState, options: MinimaxOptions): LegalMove {
        const { depth, algorithm='alphabeta-ordered', weights = DEFAULT_EVALUATOR_WEIGHTS, discardMode = 'search', random = Math.random, stats } = options;
        this.validateDepth(depth);

        const player = state.currentTurn;
        const context: SearchContext = { player, weights, discardMode, prune: algorithm !== 'minimax', order: algorithm === 'alphabeta-ordered', stats };
        const legalMoves = MoveArbitrator.generateLegalMoves(state.board, player, state.cards[player]);

        if ( legalMoves.length === 0 ) {
            throw new Error('No hay movimientos legales disponibles para el jugador actual');
        } 

        //Sub-15.2: poda alfa-beta ordenada
        const scoredMoves = legalMoves.map(move => ({
            move,
            child: GameEngine.processTurn(state, move.from, move.to, move.cardName),
            score: 0
        }));
        let alpha = -Infinity;
        const toSearch = depth > 1 ? this.inSearchOrder(scoredMoves, scored => scored.child, true, context) : scoredMoves;
        for (const scored of toSearch) {
            scored.score = this.search(scored.child, depth - 1, alpha, Infinity, context);
            alpha = Math.max(alpha, scored.score);
        }

        const winningMove = scoredMoves.find(scored => scored.child.status === 'finished' && scored.child.winner === player);
        if (winningMove) return winningMove.move;

        return this.pickBest(scoredMoves, random).move;
    }

    public static selectDiscard(state: GameState, options: MinimaxOptions): string {
        const { depth, algorithm='alphabeta-ordered', weights = DEFAULT_EVALUATOR_WEIGHTS, discardMode = 'search', random = Math.random, stats } = options;
        this.validateDepth(depth);

        if (state.status !== 'waiting_for_discard') {
            throw new Error('La partida no está esperando un descarte');
        }

        const context: SearchContext = { player: state.currentTurn, weights, discardMode, prune: algorithm !== 'minimax', order: algorithm === 'alphabeta-ordered', stats };
        const scoredCards = this.discardOptions(state, discardMode).map(cardName => ({
            cardName,
            child: GameEngine.discardCard(state, cardName),
            score: 0
        }));

        let alpha = -Infinity;
        const toSearch = depth > 1 ? this.inSearchOrder(scoredCards, scored => scored.child, true, context) : scoredCards;
        for (const scored of toSearch) {
            scored.score = this.search(scored.child, depth - 1, alpha, Infinity, context);
            alpha = Math.max(alpha, scored.score);
        }

        return this.pickBest(scoredCards, random).cardName;
    }

    private static validateDepth(depth: number): void {
        if (!Number.isInteger(depth) || depth < 1) {
            throw new Error('La profundidad debe ser un entero mayor o igual a 1');
        }
    }

    private static search(state: GameState, depth: number, alpha: number, beta: number, context: SearchContext): number {
        if (context.stats) context.stats.nodes++;
        if (depth === 0 || state.status === 'finished') {
            return HeuristicEvaluator.evaluate(state.board, context.player, state.cards, context.weights);
        }

        const maximizing = state.currentTurn === context.player;
        let best = maximizing ? -Infinity : Infinity;

        const children = this.successors(state, context.discardMode);
        const toSearch = depth > 1 ? this.inSearchOrder(children, child => child, maximizing, context) : children;
        for (const child of toSearch) {
            const score = this.search(child, depth - 1, alpha, beta, context);

            if (maximizing) {
                best = Math.max(best, score);
                alpha = Math.max(alpha, best);
            } else {
                best = Math.min(best, score);
                beta = Math.min(beta, best);
            }

            if (context.prune && alpha > beta) break;
        }

        return best;
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

    //Sub-15.2: poda alfa-beta ordenada
    private static inSearchOrder<T>(items: T[], stateOf: (item: T) => GameState, maximizing: boolean, context: SearchContext): T[] {
        if (!context.order) return items;

        const descending = (a: { value: number }, b: { value: number }) => a.value === b.value ?
            0 : (a.value > b.value ? -1 : 1);

        return items
            .map(item => ({ item, value: HeuristicEvaluator.evaluate(stateOf(item).board, context.player, stateOf(item).cards, context.weights) }))
            .sort(maximizing ? descending : (a, b) => descending(b, a))
            .map(entry => entry.item);
    }
}

