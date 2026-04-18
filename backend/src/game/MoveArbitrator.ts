import { Board, Card, PlayerColor, Position } from "../../../shared/types";


export class MoveArbitrator {

    private static isOutOfBounds(pos: Position): boolean {
        return pos.x < 0 || pos.x > 4 || pos.y < 0 || pos.y > 4;
    }

    public static validateMove(
        board: Board,
        from: Position,
        to: Position,
        player: PlayerColor,
        card: Card
    ): boolean {

        //Comprueba los límites
        if (this.isOutOfBounds(from) || this.isOutOfBounds(to)) {
            throw new Error(`[FEAT-06] Movimiento Ilegal: Las casillas están fuera de los límites del tablero.`);
        }

        const pieceToMove = board[from.y][from.x];
        const pieceDestination = board[to.y][to.x];

        //1. ¿Existe una pieza en el origen?
        if (!pieceToMove){
            throw new Error(`[FEAT-06] Movimiento Ilegal: no hay ninguna pieza en la casilla de origen`)
        }

        //2. ¿La pieza es del jugador?
        if(pieceToMove.color !== player){
            throw new Error(`[FEAT-06] Movimiento Ilegal: No puedes mover las piezas del rival`)
        }

        //3. ¿Hay una pieza tuya en el detino?
        if(pieceDestination && pieceDestination.color === player){
            throw new Error(`[FEAT-06] Movimiento Ilegal: La casilla de destino está ocupada por una pieza aliada`)
        }

        //4. Validación geométrica
        const dx = to.x - from.x;
        const dy = to.y - from.y;

        //Tenemos que ajustar la 'vista' del movimiento dependiendo del jugador activo
        const normalizedDx = player === 'red' ? -dx : dx;
        const normalizedDy = player === 'red' ? -dy : dy;

        const isValidCardMove = card.moves.some(
            move => move.x === normalizedDx && move.y === normalizedDy
        );

        if (!isValidCardMove){
            throw new Error(`[FEAT-06] Movimiento Ilegal: La carta ${card.name} no permite este desplazamiento`)
        }
        
        return true;

    }   
}