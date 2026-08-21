import { Server, Socket } from "socket.io";
import { PlayerProfile, SocketEvents } from "../../../shared";
import { RoomManager } from "./RoomManager";

export function registerSocketEvents(io: Server) {


    io.on('connection', (socket: Socket) => {
        console.log(`Usuario conectado: ${socket.id}`);

        //CREAR LA SALA
        socket.on(SocketEvents.CREATE_ROOM, ( data: { hostName: string } ) => {
            const hostProfile: PlayerProfile = {
                socketId: socket.id,
                name: data.hostName
            }

            const room = RoomManager.createRoom(hostProfile);

            socket.join(room.roomId);
                
            console.log(`Sala creada: ${room.roomId} por el jugador ${data.hostName} (código: ${room.roomCode})`);

            socket.emit(SocketEvents.ROOM_CREATED, { roomCode: room.roomCode });
        });

        //UNIRSE A LA SALA
        socket.on(SocketEvents.JOIN_ROOM, (payload: { roomCode: string, guestName: string }) => {
            const { roomCode, guestName } = payload;
            const guestProfile: PlayerProfile = {
                socketId: socket.id,
                name: guestName
            }

            const room = RoomManager.getRoomByCode(roomCode);

            //¿EXISTE LA SALA?
            if (!room) {
                return socket.emit(SocketEvents.ERROR, { message: 'Código incorrecto o la sala no existe.' });
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
            console.log(`Jugador ${guestName} (ID: ${socket.id}) se unió a la sala ${roomId}`);

            if (!room.players.red) {
                room.players.red = guestProfile;
            } else if (!room.players.blue) {
                room.players.blue = guestProfile;
            }

            //INICIAR EL JUEGO
            const engine = room.gameEngine;

            if (engine) {

                const initialState = engine.createNewGame(roomId);
                room.gameState = initialState;

                const playersMapping = {
                    red: room.players.red,
                    blue: room.players.blue
                }

                io.to(roomId).emit(SocketEvents.GAME_START, { gameState: initialState, players: playersMapping });
                console.log('Partida iniciada en la sala:', roomId);
            }

        });

        socket.on(SocketEvents.PLAYER_MOVE, (moveData: { from: { x: number, y: number }, to: { x: number, y: number }, cardName: string }) => {
            const room = RoomManager.getRoomBySocketId(socket.id);

            if (!room || !room.gameState) {
                return socket.emit(SocketEvents.ERROR, { message: 'No se encontró la sala o el estado del juego.' });
            }

            try {
                const newState = room.gameEngine.processTurn(room.gameState, moveData.from, moveData.to, moveData.cardName);
                room.gameState = newState;

                io.to(room.roomId).emit(SocketEvents.GAME_UPDATE, { gameState: newState });

                console.log(`Movimiento procesado en la sala ${room.roomId}:`, moveData);
            } catch (error: any) {
                console.warn(`Jugada invalida rechazada: ${error.message}`);
                socket.emit(SocketEvents.ERROR, { message: error.message });
            }
        });

        socket.on(SocketEvents.LEAVE_ROOM, () => {
            const room = RoomManager.getRoomBySocketId(socket.id);

            if (room) {
                socket.leave(room.roomId);

                socket.to(room.roomId).emit(SocketEvents.ERROR, { message: 'El jugador ha abandonado la sala.' });

                RoomManager.deleteRoom(room.roomId);
                console.log(`Sala ${room.roomId} eliminada}`)
            }
        });

        //Sub-05.1
        socket.on(SocketEvents.SURRENDER, () => {
            const room = RoomManager.getRoomBySocketId(socket.id);
            if (!room) {
                return socket.emit(SocketEvents.ERROR, { message: 'No se encontró la sala.' });
            }

            try {
                const updatedGameState = RoomManager.surrenderGame(room.roomId, socket.id);

                if (updatedGameState) {
                    io.to(room.roomId).emit(SocketEvents.GAME_UPDATE, { gameState: updatedGameState });
                    RoomManager.deleteRoom(room.roomId);
                }
            } catch (error) {
                socket.emit(SocketEvents.ERROR, { message: 'Error al procesar la rendición.' });
            }
        });


        socket.on('disconnect', () => {
            console.log(`Usuario desconectado: ${socket.id}`);
        });
    });

}