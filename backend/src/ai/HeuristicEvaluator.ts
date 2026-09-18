import { Board, GameState, PlayerColor, Position } from '../../../shared';
import { MoveArbitrator } from '../game/MoveArbitrator';
import { VictoryArbitrator, RED_MASTER_POSITION, BLUE_MASTER_POSITION } from '../game/VictoryArbitrator';

//Pesos relativos
const W_MATERIAL = 100;
const W_TEMPLE = 10;
const W_MOBILITY = 2;
const W_POSITION = 1;

export class HeuristicEvaluator {
    
    //FEAT-14 (Sub-14.2): Evalúa un tablero desde la perspectiva de un jugador.
    //Cuanto más alto, mejor está el jugador.
    public static evaluate(board: Board, player: PlayerColor, cards: GameState['cards']): number {
        const opponent: PlayerColor = player === 'red' ? 'blue' : 'red';

        const winner = VictoryArbitrator.checkVictory(board);
        if (winner === player) return Number.POSITIVE_INFINITY;
        if (winner === opponent) return Number.NEGATIVE_INFINITY;

        return W_MATERIAL * this.materialDiff(board, player, opponent) +
               W_TEMPLE * this.templeDiff(board, player, opponent) +
               W_MOBILITY * this.mobilityDiff(board, player, opponent, cards) +
               W_POSITION * this.positionalDiff(board, player, opponent);
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
}