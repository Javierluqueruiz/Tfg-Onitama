export type PlayerColor = 'red' | 'blue';
export type PieceType = 'master' | 'student';

export interface Position {
    x: number;
    y: number;
}

export interface Piece {
    type: PieceType;
    color: PlayerColor;
}

export interface Cell {
    position: Position;
    piece: Piece | null;
}

export interface Card {
    name: string;
    moves: Position[];
}

export interface GameState {
    roomId: string;
    status: 'waiting' | 'playing' | 'finished';
    currentTurn: PlayerColor;
    board: Cell[][];
    cards: {
        red: Card[];
        blue: Card[];
        middle: Card[];
    };
    winner : PlayerColor | null;
}

export interface PlayerMoveAction {
    roomId: string;
    player: PlayerColor;
    from: Position;
    to: Position;
    cardUsed: string;
}