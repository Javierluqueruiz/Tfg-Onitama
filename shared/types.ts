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


//Eventos para los WebSockets
export enum SocketEvents {
    //Cliente a Servidor
    CREATE_ROOM = 'create_room',
    JOIN_ROOM = 'join_room',
    //PLAYER_MOVE = 'player_move',

    //Servidor a Cliente
    ROOM_CREATED = 'room_created',
    ERROR = 'error',
    GAME_START = 'game_start',
    //GAME_UPDATE = 'game_update',
}

//Primera versión de la interfaz del perfil del jugador.
export interface PlayerProfile {
    id: string;
    name: string;
}