type RedPlayer = 'red';
type BluePlayer = 'blue';
export type PlayerColor = RedPlayer | BluePlayer;

type StudentPiece = 'student';
type MasterPiece = 'master';
export type PieceType = StudentPiece | MasterPiece;

export interface Piece {
    type: PieceType;
    color: PlayerColor;
}

export type Cell = Piece | null;

export type BoardRow = [Cell, Cell, Cell, Cell, Cell];
export type Board = [BoardRow, BoardRow, BoardRow, BoardRow, BoardRow];

