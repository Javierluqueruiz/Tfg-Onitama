import { Board, Piece, Position, isOutOfBounds, getCellAt, setCellAt } from '../../../shared';

export interface MoveResult {
    newBoard: Board;
    capturedPiece: Piece | null;
}

export class MovementManager {

    //FEAT-03: Ejecuta el desplazamiento de una pieza. Devuelve una copia del tablero, protegiendo el estado original.

    public static movePiece(board: Board, from: Position, to: Position): MoveResult {
    
        //1.Validar las posiciones
        if (isOutOfBounds(from)) {
            throw new Error(`[FEAT-03] La posición de origen (${from.x}, ${from.y}) está fuera de los límites del tablero`);
        }
        if (isOutOfBounds(to)) {
            throw new Error(`[FEAT-03] La posición de destino (${to.x}, ${to.y}) está fuera de los límites del tablero`);
        }
        
        //2.Clonar el tablero
        const newBoard: Board = board.map(row => [...row]) as Board;

        //3. Validar que haya una pieza en la posición de origen
        const pieceToMove = getCellAt(newBoard, from);

        if (!pieceToMove) {
            throw new Error(`[FEAT-03] No hay pieza en la posición de origen (${from.x}, ${from.y})`);
        }

        const capturedPiece = getCellAt(newBoard, to); 

        //4. Mover la pieza
        setCellAt(newBoard, to, pieceToMove);
        setCellAt(newBoard, from, null);

        return {
            newBoard,
            capturedPiece
        };
    }
}
