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

//FEAT02

export interface Position {
    x: number;
    y: number;
}

export interface Card {
    name: string;
    description: string;
    color: PlayerColor;
    moves: Position[];
}

//ESTADO GLOBAL DEL JUEGO
type GameStatus = 'waiting' | 'in_progress' | 'finished' | 'waiting_for_discard';

export interface GameState {
    roomId: string;
    status: GameStatus;
    currentTurn: PlayerColor;
    board: Board;
    cards: {
        red: [Card, Card];
        blue: [Card, Card];
        neutral: Card;
    };
    winner: PlayerColor | null;
}
