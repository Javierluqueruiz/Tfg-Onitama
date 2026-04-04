import { Board, BoardRow, Piece } from '../../../shared/types';

export class BoardGenerator {

    public static createInitialBoard(): Board {
        return [
            this.createRedRow(),
            this.createEmptyRow(),
            this.createEmptyRow(),
            this.createEmptyRow(),
            this.createBlueRow(),
        ]
    }

    private static createRedRow(): BoardRow {
        return [
            this.createPiece('student', 'red'),
            this.createPiece('student', 'red'),
            this.createPiece('master', 'red'),
            this.createPiece('student', 'red'),
            this.createPiece('student', 'red'),
        ]
    }

    private static createBlueRow(): BoardRow {
        return [
            this.createPiece('student', 'blue'),
            this.createPiece('student', 'blue'),
            this.createPiece('master', 'blue'),
            this.createPiece('student', 'blue'),
            this.createPiece('student', 'blue'),
        ]
    }

    private static createEmptyRow(): BoardRow {
        return [null, null, null, null, null];
    }


    private static createPiece(type: 'master' | 'student', color: 'red' | 'blue'): Piece {
        return { type, color };

    }
}