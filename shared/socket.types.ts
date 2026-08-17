//Eventos para los WebSockets
import type { PlayerColor, GameState } from './domain.types';

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

    PLAYER_MOVE = 'player_move',
    GAME_UPDATE = 'game_update',
}

//Primera versión de la interfaz del perfil del jugador.
export interface PlayerProfile {
    socketId: string;
    name: string;
}

export interface RoomSession {
    roomId: string;
    roomCode: string;
    players: {
        RED: PlayerProfile | null;
        BLUE: PlayerProfile | null;
    };
    gameState: GameState | null;
}