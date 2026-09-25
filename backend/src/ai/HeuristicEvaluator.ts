import { Board, GameState, PlayerColor, Position } from '../../../shared';
import { MoveArbitrator } from '../game/MoveArbitrator';
import { MovementManager } from '../game/MovementManager';
import { VictoryArbitrator, RED_MASTER_POSITION, BLUE_MASTER_POSITION } from '../game/VictoryArbitrator';

export interface EvaluatorWeights {
    material: number;
    position: number;
    temple: number;
    mobility: number;
    threat: number;
}

export const DEFAULT_EVALUATOR_WEIGHTS: EvaluatorWeights = {
    material: 100,
    position: 1,
    temple: 10,
    mobility: 2,
    threat: 1000
}

export class HeuristicEvaluator {
    
    //FEAT-14 (Sub-14.2): Evalúa un tablero desde la perspectiva de un jugador.
    //Cuanto más alto, mejor está el jugador.
    public static evaluate(board: Board, player: PlayerColor, cards: GameState['cards'], weights: EvaluatorWeights = DEFAULT_EVALUATOR_WEIGHTS, turn?: PlayerColor): number {
        const opponent: PlayerColor = player === 'red' ? 'blue' : 'red';

        const winner = VictoryArbitrator.checkVictory(board);
        if (winner === player) return Number.POSITIVE_INFINITY;
        if (winner === opponent) return Number.NEGATIVE_INFINITY;

        return weights.material * this.materialDiff(board, player, opponent) +
               weights.temple * this.templeDiff(board, player, opponent) +
               weights.mobility * this.mobilityDiff(board, player, opponent, cards) +
               weights.position * this.positionalDiff(board, player, opponent) +
               weights.threat * this.inmediateWin(board, player, opponent, cards, turn ?? opponent);
    }

    //Si llegamos a este punto, significa que ambos maestros están vivos, por lo que su valor no cuenta aquí
    private static materialDiff(board: Board, player: PlayerColor, opponent: PlayerColor): number {
        let diff = 0;

        for (const row of board) {
            for (const piece of row) {
                if (!piece || piece.type === 'master') continue;
                if (piece.color === player) diff++;
                else if (piece.color === opponent) diff--;
            }
        }

        return diff;
    }

    private static positionalDiff(board: Board, player: PlayerColor, opponent: PlayerColor): number {
        let diff = 0;

        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[y].length; x++) {
                const piece = board[y][x];
                if (!piece) continue;

                const value = this.centerBonus(x) + this.advanceBonus(y, piece.color);

                if (piece.color === player) diff += value;
                else if (piece.color === opponent) diff -= value;
            }
        }

        return diff;
    }

    private static centerBonus(x: number): number {
        return 2 - Math.abs(x - 2); // 2 puntos para la columna central, 1 para las adyacentes, 0 para las esquinas
    }

    private static advanceBonus(y: number, color: PlayerColor): number {
        return color === 'red' ? y : 4-y; // 4 puntos para la fila más cercana al oponente, 0 para la más cercana a uno mismo
    }

    private static templeDiff(board: Board, player: PlayerColor, opponent: PlayerColor): number {
        const myMaster = this.findMaster(board, player)!;
        const opponentMaster = this.findMaster(board, opponent)!;

        const myTemple = player === 'red' ? RED_MASTER_POSITION : BLUE_MASTER_POSITION;
        const opponentTemple = opponent === 'red' ? RED_MASTER_POSITION : BLUE_MASTER_POSITION;

        const myDistanceToGoal = this.manhattanDistance(myMaster, opponentTemple);
        const opponentDistanceToGoal = this.manhattanDistance(opponentMaster, myTemple);

        return opponentDistanceToGoal - myDistanceToGoal; // cuanto más cerca esté el jugador de la meta, mejor
    }

    private static findMaster(board: Board, color: PlayerColor): Position | null {
        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[y].length; x++) {
                const piece = board[y][x];
                if (piece && piece.color === color && piece.type === 'master') return { x, y };
            }
        }
        return null;
    }

    private static manhattanDistance(a: Position, b: Position): number {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    private static mobilityDiff(board: Board, player: PlayerColor, opponent: PlayerColor, cards: GameState['cards']): number {
        const myMoves = MoveArbitrator.generateLegalMoves(board, player, cards[player]).length;
        const opponentMoves = MoveArbitrator.generateLegalMoves(board, opponent, cards[opponent]).length;

        return myMoves - opponentMoves;
    }

    //Sub-15.3

    private static inmediateWin(board: Board, player: PlayerColor, opponent: PlayerColor, cards: GameState['cards'], turn: PlayerColor): number {
        if (turn === player) return this.canWinNow(board, player, cards) ? 1: 0;

        return this.canWinNow(board, opponent, cards) ? -1: 0;
    }

    private static canWinNow(board: Board, color: PlayerColor, cards: GameState['cards']): boolean {
        return MoveArbitrator.generateLegalMoves(board, color, cards[color]).some(move => {
            return VictoryArbitrator.checkVictory(MovementManager.movePiece(board, move.from, move.to).newBoard) === color;
        });
    }
}