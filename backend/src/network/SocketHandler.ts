import { Server, Socket } from "socket.io";
import { SocketEvents } from "../../../shared/types";
import { RoomManager } from "./RoomManager";

export function registerSocketEvents(io: Server) {


    io.on('connection', (socket: Socket) => {
        console.log(`Usuario conectado: ${socket.id}`);

        //CREAR LA SALA
        socket.on(SocketEvents.CREATE_ROOM, (playload: {playerName: string, password: string}) => {
            const { playerName, password } = playload;

            const room = RoomManager.createRoom(password);

            if (!room) {
                return socket.emit(SocketEvents.ERROR, { message: 'Esa contraseña ya está en uso.' });
            }

            socket.join(room.roomId);
                
            console.log(`Sala creada: ${room.roomId} por el jugador ${playerName} (password: ${password})`);

            socket.emit(SocketEvents.ROOM_CREATED, { roomId: room.roomId });
        });

        //UNIRSE A LA SALA
        socket.on(SocketEvents.JOIN_ROOM, (payload: { password: string, playerName: string }) => {
            const { password, playerName } = payload;

            const room = RoomManager.getRoomByPassword(password);

            //¿EXISTE LA SALA?
            if (!room) {
                return socket.emit(SocketEvents.ERROR, { message: 'Contraseña incorrecta o la sala no existe.' });
            }

            const roomId = room.roomId;

            //CONTROL DE JUGADORES 
            const socketRoom = io.sockets.adapter.rooms.get(roomId);
            const numPlayers = socketRoom ? socketRoom.size : 0;

            if (numPlayers === 0 ){
                return socket.emit(SocketEvents.ERROR, { message: 'La sala ha caducado.' });
            } else if (numPlayers >= 2) {
                return socket.emit(SocketEvents.ERROR, { message: 'La sala está llena.' });
            }

            socket.join(roomId);
            console.log(`Jugador ${playerName} (ID: ${socket.id}) se unió a la sala ${roomId}`);

            //INICIAR EL JUEGO
            const engine = room.gameEngine;

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