import { Board, Piece, Position } from '../../../shared';

export interface MoveResult {
    newBoard: Board;
    capturedPiece: Piece | null;
}

export class MovementManager {

    //FEAT-03: Ejecuta el desplazamiento de una pieza. Devuelve una copia del tablero, protegiendo el estado original.

    public static movePiece(board: Board, from: Position, to: Position): MoveResult {
    
        //1.Validar las posiciones
        if (this.isOutOfBounds(from)) {
            throw new Error(`[FEAT-03] La posición de origen (${from.x}, ${from.y}) está fuera de los límites del tablero`);
        }
        if (this.isOutOfBounds(to)) {
            throw new Error(`[FEAT-03] La posición de destino (${to.x}, ${to.y}) está fuera de los límites del tablero`);
        }
        
        //2.Clonar el tablero
        const newBoard: Board = board.map(row => [...row]) as Board;

        //3. Validar que haya una pieza en la posición de origen
        const pieceToMove = newBoard[from.y][from.x];

        if (!pieceToMove) {
            throw new Error(`[FEAT-03] No hay pieza en la posición de origen (${from.x}, ${from.y})`);
        }

        const capturedPiece = newBoard[to.y][to.x]; 

        //4. Mover la pieza
        newBoard[to.y][to.x] = pieceToMove; 
        newBoard[from.y][from.x] = null;

        return {
            newBoard,
            capturedPiece
        };
    }

    private static isOutOfBounds(pos: Position): boolean {
        return pos.x < 0 || pos.x > 4 || pos.y < 0 || pos.y > 4;
    }
}
