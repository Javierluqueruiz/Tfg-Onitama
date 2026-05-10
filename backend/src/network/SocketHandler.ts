import { Server, Socket } from "socket.io";
import { SocketEvents } from "../../../shared/types";
import { RoomManager } from "./RoomManager";

export function registerSocketEvents(io: Server) {


io.on('connection', (socket: Socket) => {
    console.log(`Usuario conectado: ${socket.id}`);

    //CREAR LA SALA
    socket.on(SocketEvents.CREATE_ROOM, (playerName: string) => {
        const roomId = `room-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        socket.join(roomId);

        RoomManager.createRoom(roomId);
            
        console.log(`Sala creada: ${roomId} por el jugador ${playerName} (ID: ${socket.id})`);

        socket.emit(SocketEvents.ROOM_CREATED, { roomId });
    });

    //UNIRSE A LA SALA
    socket.on(SocketEvents.JOIN_ROOM, (payload: { roomId: string, playerName: string }) => {
        const { roomId, playerName } = payload;

        //¿EXISTE LA SALA?
        if (!RoomManager.roomExists(roomId)) {
            return socket.emit(SocketEvents.ERROR, { message: 'La sala no existe.' });
        }

        //CONTROL DE JUGADORES 
        const room = io.sockets.adapter.rooms.get(roomId);
        const numPlayers = room ? room.size : 0;

        if (numPlayers === 0 ){
            return socket.emit(SocketEvents.ERROR, { message: 'La sala ha caducado.' });
        } else if (numPlayers >= 2) {
            return socket.emit(SocketEvents.ERROR, { message: 'La sala está llena.' });
        }

        socket.join(roomId);
        console.log(`Jugador ${playerName} (ID: ${socket.id}) se unió a la sala ${roomId}`);

        //INICIAR EL JUEGO
        const engine = RoomManager.getGameEngine(roomId);

        if (engine) {

            const initialState = engine.createNewGame(roomId);

            io.to(roomId).emit(SocketEvents.GAME_START, { gameState: initialState });
            console.log('Partida iniciada en la sala:', roomId);
        }

    });


    socket.on('disconnect', () => {
        console.log(`Usuario desconectado: ${socket.id}`);
    });
});

}