import { Board, Position } from '../../../shared/types';

export class MovementManager {

    //FEAT-03: Ejecuta el desplazamiento de una pieza. Devuelve una copia del tablero, protegiendo el estado original.

    public static movePiece(board: Board, from: Position, to: Position): Board {
    
        //1.Clonar el tablero
        const newBoard: Board = board.map(row => [...row]) as Board;

        //2. Validar que haya una pieza en la posición de origen
        const pieceToMove = newBoard[from.y][from.x];

        if (!pieceToMove) {
            throw new Error(`[FEAT-03] No hay pieza en la posición de origen (${from.x}, ${from.y})`);
        }

        //3. Mover la pieza
        newBoard[to.y][to.x] = pieceToMove; 
        newBoard[from.y][from.x] = null;

        return newBoard;
    }
}
