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
    OFFER_DRAW = 'offer_draw',
    ACCEPT_DRAW = 'accept_draw',
    REJECT_DRAW = 'reject_draw',
    //Sub-06.1
    JOIN_QUEUE = 'join_queue',
    LEAVE_QUEUE = 'leave_queue',
    //Sub-04.4
    PING = 'ping',

    //Sub-05.5
    OFFER_REMATCH = 'offer_rematch',
    ACCEPT_REMATCH = 'accept_rematch',
    REJECT_REMATCH = 'reject_rematch',

    //Sub-07.1
    SEND_MESSAGE = 'send_message',

    //Servidor a Cliente
    ROOM_CREATED = 'room_created',
    ERROR = 'error',
    GAME_START = 'game_start',
    GAME_UPDATE = 'game_update',
    OPPONENT_DISCONNECTED = 'opponent_disconnected',
    OPPONENT_RECONNECTED = 'opponent_reconnected',
    RECONNECT_SUCCESS = 'reconnect_success',
    RECONNECT_FAILED = 'reconnect_failed',
    TIME_TICK = 'time_tick',
    //Sub-06.1
    QUEUE_JOINED = 'queue_joined',
    QUEUE_LEFT = 'queue_left',
    MATCH_FOUND = 'match_found',
    //Sub-04.4
    PONG = 'pong',

    //Sub-05.5
    REMATCH_OFFERED = 'rematch_offered',
    REMATCH_REJECTED = 'rematch_rejected',

    //Sub-07.1
    CHAT_UPDATE = 'chat_update',
}

//Primera versión de la interfaz del perfil del jugador.
export interface PlayerProfile {
    socketId: string;
    name: string;
}

export interface RoomSession {
    roomId: string;
    roomCode: string;
    mode: GameMode;
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


//Sub-06.1
//Modos de juego
export type GameMode = 'casual' | 'normal' | 'fast';

export interface JoinQueuePayload {
    mode: GameMode;
}

export interface MatchFoundPayload {
    roomId: string;
    roomCode: string;
    mode: GameMode;
}

//Sub-07.1
export interface ChatMessage {
    socketId: string;
    name: string;
    message: string;
    timestamp: number;
}