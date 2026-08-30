import { Server, Socket } from "socket.io";
import { PlayerProfile, SocketEvents, ReconnectPayload, GameMode } from "../../../shared";
import { RoomManager } from "./RoomManager";

export function registerSocketEvents(io: Server) {


    io.on('connection', (socket: Socket) => {
        console.log(`Usuario conectado: ${socket.id}`);

        //CREAR LA SALA
        socket.on(SocketEvents.CREATE_ROOM, ( data: { hostName: string, mode: GameMode } ) => {
            const hostProfile: PlayerProfile = {
                socketId: socket.id,
                name: data.hostName
            }

            const room = RoomManager.createRoom(hostProfile, data.mode);

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

                if (room.mode === 'normal') {
                    room.gameState.timeRemaining = { red: 600, blue: 600 };
                } else if (room.mode === 'fast') {
                    room.gameState.timeRemaining = { red: 300, blue: 300 };
                } 

                const playersMapping = {
                    red: room.players.red,
                    blue: room.players.blue
                }

                io.to(roomId).emit(SocketEvents.GAME_START, { gameState: initialState, players: playersMapping });
                if (room.mode !== 'casual') {
                    RoomManager.startGameTimer(roomId,
                        (timeRemaining) => {
                            io.to(roomId).emit(SocketEvents.TIME_TICK, { timeRemaining });
                        },

                        (finalState) => {
                            io.to(roomId).emit(SocketEvents.GAME_UPDATE, { gameState: finalState });
                            RoomManager.deleteRoom(roomId);
                        }
                    );
                }
                
                console.log('Partida iniciada en la sala:', roomId);
            }

        });

        socket.on(SocketEvents.PLAYER_MOVE, (moveData: { from: { x: number, y: number }, to: { x: number, y: number }, cardName: string }) => {
            const room = RoomManager.getRoomBySocketId(socket.id);

            if (!room || !room.gameState) {
                return socket.emit(SocketEvents.ERROR, { message: 'No se encontró la sala o el estado del juego.' });
            }

            if (room.gameState.status === 'finished') {
                return socket.emit(SocketEvents.ERROR, { message: 'El juego ya ha terminado.' });
            }

            try {
                const newState = room.gameEngine.processTurn(room.gameState, moveData.from, moveData.to, moveData.cardName);
                room.gameState = newState;

                io.to(room.roomId).emit(SocketEvents.GAME_UPDATE, { gameState: newState });
                
                if (newState.status === 'finished') {
                    RoomManager.stopGameTimer(room.roomId);
                    // RoomManager.deleteRoom(room.roomId);
                } 

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
                RoomManager.stopGameTimer(room.roomId);
                RoomManager.deleteRoom(room.roomId);
                console.log(`Sala ${room.roomId} eliminada}`)
            }
        });

        //Sub-04.4: Ping-Pong
        socket.on(SocketEvents.PING, ( timestamp: number ) => {
            socket.emit(SocketEvents.PONG, timestamp);
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
                    RoomManager.stopGameTimer(room.roomId); 
                    //RoomManager.deleteRoom(room.roomId);
                }
            } catch (error) {
                socket.emit(SocketEvents.ERROR, { message: 'Error al procesar la rendición.' });
            }
        });


        socket.on('disconnect', () => {
            console.log(`Usuario desconectado: ${socket.id}`)
            //Sub-06.1
            RoomManager.leaveQueue(socket.id);
            
            const timeLimit = RoomManager.DISCONNECT_TIMEOUT_MS; // 30 segundos
            //Sub-05.2
            const room = RoomManager.getRoomBySocketId(socket.id);

            if (!room || room.gameState.status === 'finished') return;

            io.to(room.roomId).emit(SocketEvents.OPPONENT_DISCONNECTED, {
                message: 'El oponente se ha desconectado. Esperando reconexión...',
                timeLimit: timeLimit // 30 segundos
            });

            const timer = setTimeout(() => {
                try {
                    const updatedGameState = RoomManager.surrenderGame(room.roomId, socket.id);

                    if (updatedGameState) {
                        io.to(room.roomId).emit(SocketEvents.GAME_UPDATE, { gameState: updatedGameState });
                        RoomManager.stopGameTimer(room.roomId);
                        RoomManager.deleteRoom(room.roomId);
                        RoomManager.clearDisconnectTimer(room.roomId);
                        console.log(RoomManager.getActiveRooms());
                    }
                } catch (error) {
                    socket.emit(SocketEvents.ERROR, { message: 'Error al procesar la rendición por desconexión.' });
                }
            }, timeLimit); // 30 segundos

            RoomManager.setDisconnectTimer(room.roomId, timer);
            console.log(RoomManager.getActiveRooms());

        });

        //Sub-05.2: Intento de reconexión
        socket.on(SocketEvents.RECONNECT_ATTEMPT, (payload: ReconnectPayload) => {
            try {
                const room = RoomManager.reconnectPlayer(
                    payload.roomId,
                    payload.originalSocketId,
                    socket.id //Nuevo socketId del jugador que se reconecta
                );

                if (room) {
                    socket.join(room.roomId);

                    socket.emit(SocketEvents.RECONNECT_SUCCESS, { 
                        gameState: room.gameState,
                        players: room.players
                    });

                    socket.to(room.roomId).emit(SocketEvents.OPPONENT_RECONNECTED);
                } else {
                    socket.emit(SocketEvents.RECONNECT_FAILED);
                }
            } catch (error: any) {
                socket.emit(SocketEvents.ERROR, { message: 'Error al procesar el intento de reconexión: ' + error.message });
            }
        })

        //Sub-05.4
        socket.on(SocketEvents.OFFER_DRAW, () => {
            const room = RoomManager.getRoomBySocketId(socket.id);

            if (room) {
                socket.to(room.roomId).emit(SocketEvents.OFFER_DRAW);
            }
        });


        socket.on(SocketEvents.REJECT_DRAW, () => {
            const room = RoomManager.getRoomBySocketId(socket.id);

            if (room) {
                socket.to(room.roomId).emit(SocketEvents.REJECT_DRAW);
            }
        });

        socket.on(SocketEvents.ACCEPT_DRAW, () => {
            const room = RoomManager.getRoomBySocketId(socket.id);

            if (!room || room.gameState.status === 'finished') {
                return socket.emit(SocketEvents.ERROR, { message: 'No se encontró la sala o el juego ya ha terminado.' });
            }

            try {
                const finalState = RoomManager.resolveDraw(room.roomId);

                if (finalState) {
                    io.to(room.roomId).emit(SocketEvents.GAME_UPDATE, { gameState: finalState });
                    RoomManager.stopGameTimer(room.roomId);
                    // RoomManager.deleteRoom(room.roomId);
                }
            } catch (error) {
                socket.emit(SocketEvents.ERROR, { message: 'Error al procesar la aceptación del empate.' });
            }
        });

        //Sub-06.1: Cola de emparejamiento
        socket.on(SocketEvents.JOIN_QUEUE, (data: { mode: GameMode }) => {
            const { mode } = data;

            const result = RoomManager.joinQueue(socket.id, mode);
            console.log(`Jugador ${socket.id} se ha unido a la cola de emparejamiento en modo ${mode}. Resultado:`, result);
            if (result.matchFound && result.roomId && result.roomCode ) {

                socket.join(result.roomId);
                const opponentSocket = io.sockets.sockets.get(result.opponentId!);
                if (opponentSocket) {
                    opponentSocket.join(result.roomId);
                }

                io.to(result.roomId).emit(SocketEvents.MATCH_FOUND, { 
                    roomId: result.roomId, 
                    roomCode: result.roomCode,
                    mode: mode 
                });

                const room = RoomManager.getRoomById(result.roomId);
                
                if (room) {
                    room.gameState = room.gameEngine.createNewGame(room.roomId);
                    
                    if (mode === 'normal') {
                        room.gameState.timeRemaining = { red: 600, blue: 600 };
                    } else if (mode === 'fast') {
                        room.gameState.timeRemaining = { red: 300, blue: 300 };
                    }
                    console.log(room.gameState.roomId);
                    io.to(result.roomId).emit(SocketEvents.GAME_START, { gameState: room.gameState, players: room.players });

                    if (mode !== 'casual') {
                        RoomManager.startGameTimer(room.roomId,
                            (timeRemaining) => io.to(room.roomId).emit(SocketEvents.TIME_TICK, { timeRemaining }),
                            (finalState) => io.to(room.roomId).emit(SocketEvents.GAME_UPDATE, { gameState: finalState })
                        );
                    }
                }
            
            } else {
                socket.emit(SocketEvents.QUEUE_JOINED);
            }
        });

        socket.on(SocketEvents.LEAVE_QUEUE, () => {
            RoomManager.leaveQueue(socket.id);
            socket.emit(SocketEvents.QUEUE_LEFT);
        });

        //Sub-05.5: Rematch
        socket.on(SocketEvents.OFFER_REMATCH, () => {
            console.log(`Jugador ${socket.id} ha ofrecido una revancha.`);
            const roomId = RoomManager.getRoomBySocketId(socket.id)?.roomId;
            console.log(`Room ID para la revancha: ${roomId}`);
            if (roomId) {
                socket.to(roomId).emit(SocketEvents.REMATCH_OFFERED);
            }
        });

        socket.on(SocketEvents.REJECT_REMATCH, () => {
            const roomId = RoomManager.getRoomBySocketId(socket.id)?.roomId;
            if (roomId) {
                socket.to(roomId).emit(SocketEvents.REMATCH_REJECTED);
                RoomManager.deleteRoom(roomId);
            }
        });

        socket.on(SocketEvents.ACCEPT_REMATCH, () => {
            const room  = RoomManager.getRoomBySocketId(socket.id);
            if (room) {
                const newGameState = RoomManager.resetGameForRematch(room.roomId);

                if (newGameState) {

                    io.to(room.roomId).emit(SocketEvents.GAME_START, { gameState: newGameState, players: room.players });

                    if (room.mode !== 'casual') {
                        RoomManager.startGameTimer(room.roomId,
                            (timeRemaining) => io.to(room.roomId).emit(SocketEvents.TIME_TICK, { timeRemaining }),
                            (finalState) => {
                                io.to(room.roomId).emit(SocketEvents.GAME_UPDATE, { gameState: finalState })
                                RoomManager.deleteRoom(room.roomId);
                            }
                        );
                    }
                }
            }    
        });

        //Sub-07.1: Chat
        socket.on(SocketEvents.SEND_MESSAGE, (messageData: { message: string }) => {
            console.log(messageData.message);
            const room = RoomManager.getRoomBySocketId(socket.id);
            if (room) {
                const name = room.players.red?.socketId === socket.id ? room.players.red.name : room.players.blue?.name;
                const chatMessage = {
                    socketId: socket.id,
                    name: name || 'Desconocido',
                    message: messageData.message,
                    timestamp: Date.now()
                };
                 
                RoomManager.addChatMessage(room.roomId, chatMessage);
                io.to(room.roomId).emit(SocketEvents.CHAT_UPDATE, chatMessage);
            }
        });

    })


}