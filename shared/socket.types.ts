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