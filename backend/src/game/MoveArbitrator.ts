import { Board, Card, PlayerColor, Position, isOutOfBounds, getCellAt } from "../../../shared";

export interface LegalMove {
    from: Position;
    to: Position;
    cardName: string;
}

export class MoveArbitrator {

    private static getIllegalMoveReason(
        board: Board,
        from: Position,
        to: Position,
        player: PlayerColor,
        card: Card
    ): string | null {
        
        //Comprueba los límites
        if (isOutOfBounds(from) || isOutOfBounds(to)) {
            return `[FEAT-06] Movimiento Ilegal: Las casillas están fuera de los límites del tablero.`;
        }

        const pieceToMove = getCellAt(board, from);
        const pieceDestination = getCellAt(board, to);

        //1. ¿Existe una pieza en el origen?
        if (!pieceToMove){
            return `[FEAT-06] Movimiento Ilegal: no hay ninguna pieza en la casilla de origen`;
        }

        //2. ¿La pieza es del jugador?
        if(pieceToMove.color !== player){
            return `[FEAT-06] Movimiento Ilegal: No puedes mover las piezas del rival`;
        }

        //3. ¿Hay una pieza tuya en el detino?
        if(pieceDestination && pieceDestination.color === player){
            return `[FEAT-06] Movimiento Ilegal: La casilla de destino está ocupada por una pieza aliada`;
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
            return `[FEAT-06] Movimiento Ilegal: La carta ${card.name} no permite este desplazamiento`;
        }
        
        return null;

    }

    public static validateMove(
        board: Board,
        from: Position,
        to: Position,
        player: PlayerColor,
        card: Card
    ): boolean {
        const reason = this.getIllegalMoveReason(board, from, to, player, card);

        if (reason) {
            throw new Error(reason);
        }

        return true;
    }   

    //FEAT-14 (Sub-14.2)
    public static generateLegalMoves(board: Board, player: PlayerColor, handCards: Card[]): LegalMove[] {
        const legalMoves: LegalMove[] = [];

        for(let y = 0; y < board.length; y++){
            for(let x = 0; x < board[y].length; x++){
                const piece = board[y][x];

                if(piece && piece.color === player){
                    const from: Position = { x, y };

                    for(const card of handCards){
                        for(const move of card.moves){
                            const dx = player === 'red' ? -move.x : move.x;
                            const dy = player === 'red' ? -move.y : move.y;
                            const to: Position = { x: from.x + dx, y: from.y + dy };

                            if(this.getIllegalMoveReason(board, from, to, player, card) === null){
                                legalMoves.push({ from, to, cardName: card.name });
                            }
                        }
                    }   
                }    
            }
        }
        return legalMoves;
    }

    //FEAT-07: Método para detectar la ausencia de movimientos válidos para un jugador
    public static hasValidMoves(board: Board, player: PlayerColor, handCards: Card[]): boolean {
        return this.generateLegalMoves(board, player, handCards).length > 0;
    }
}