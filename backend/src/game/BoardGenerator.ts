import { Board, BoardRow, Piece, PieceType, PlayerColor } from '../../../shared';

export class BoardGenerator {

    public static createInitialBoard(): Board {
        return [
            this.createHomeRow('red'),
            this.createEmptyRow(),
            this.createEmptyRow(),
            this.createEmptyRow(),
            this.createHomeRow('blue'),
        ]
    }

    private static createHomeRow(color: PlayerColor): BoardRow {
        return [
            this.createPiece('student', color),
            this.createPiece('student', color),
            this.createPiece('master', color),
            this.createPiece('student', color),
            this.createPiece('student', color),
        ]
    }


    private static createEmptyRow(): BoardRow {
        return [null, null, null, null, null];
    }



    private static createPiece(type: PieceType, color: PlayerColor): Piece {
        return { type, color };

    }
}