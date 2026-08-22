//Eventos para los WebSockets
import type {GameState } from './domain.types';

export enum SocketEvents {
    //Cliente a Servidor
    CREATE_ROOM = 'create_room',
    JOIN_ROOM = 'join_room',
    LEAVE_ROOM = 'leave_room',
    PLAYER_MOVE = 'player_move',
    SURRENDER = 'surrender',
    RECONNECT_ATTEMPT = 'reconnect_attempt',

    //Servidor a Cliente
    ROOM_CREATED = 'room_created',
    ERROR = 'error',
    GAME_START = 'game_start',
    GAME_UPDATE = 'game_update',
    OPPONENT_DISCONNECTED = 'opponent_disconnected',
    OPPONENT_RECONNECTED = 'opponent_reconnected',
    RECONNECT_SUCCESS = 'reconnect_success',
    RECONNECT_FAILED = 'reconnect_failed',
    TIME_TICK = 'time_tick'


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

export interface ReconnectPayload {
    roomId: string;
    originalSocketId: string;
}