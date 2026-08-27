import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it} from 'vitest';

import { RoomManager } from "../../src/network/RoomManager";
import { registerSocketEvents } from "../../src/network/SocketHandler";
import { SocketEvents, PlayerColor, GameMode } from "../../../shared/index";

import { Server } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { createServer } from 'http';

describe('FEAT-03: Gestión de Salas Privadas (WebSockets', () => {
    let io: Server;
    let clientSocket1: ClientSocket;
    let clientSocket2: ClientSocket;
    let port: number;

    beforeAll(async () => {
        console.log("\n=== INICIANDO PRUEBAS DE GESTIÓN DE SALAS PRIVADAS ===");
        const httpServer = createServer();
        io = new Server(httpServer);

        // ¡Inyectamos tu código real del enrutador!
        registerSocketEvents(io); // Pasamos true para habilitar el modo de prueba

        await new Promise<void>((resolve) => {
            httpServer.listen(0, () => {
                port = (httpServer.address() as any).port;
                resolve();
            });
        });
    });

    afterAll(() => {
        io.close();
    });

    beforeEach(async () => {
        (RoomManager as any).activeRooms.clear();

        clientSocket1 = ioClient(`http://localhost:${port}`);
        clientSocket2 = ioClient(`http://localhost:${port}`);

        await new Promise<void>((resolve) => {
                let connectedClients = 0;
            const checkDone = () => {
                connectedClients++;
                if (connectedClients === 2) {
                    resolve();
                }
            };

            clientSocket1.on('connect', checkDone);
            clientSocket2.on('connect', checkDone);

        });
        
    });

    afterEach(() => {

        clientSocket1.disconnect();
        clientSocket2.disconnect();
    });

    //Suite de test
    it('Sub-03.1: Debe crear una sala privada y devolver el código de la sala', () => {
        return new Promise<void>((resolve) => {
            clientSocket1.on(SocketEvents.ROOM_CREATED, (data) => {
                expect(data.roomCode).toBeDefined();
                expect(typeof data.roomCode).toBe('string');
                expect(RoomManager.getRoomByCode(data.roomCode)).toBeDefined();
                resolve();
            });

            clientSocket1.emit(SocketEvents.CREATE_ROOM, 'Player1');
        });
    });

    it("Sub-03.2:  Debe permitir a un segundo jugador unirse a la sala privada y comenzar el juego", () => {
        console.log("Sub-03.2: Creando sala con Player1 y uniendo Player2...");
        return new Promise<void>((resolve) => {
            clientSocket1.emit(SocketEvents.CREATE_ROOM, 'Player1');

            clientSocket1.on(SocketEvents.ROOM_CREATED, (data) => {
                clientSocket2.emit(SocketEvents.JOIN_ROOM, { roomCode: data.roomCode, guestName: 'Player2' });
            });

            clientSocket2.on(SocketEvents.GAME_START, (data) => {
                expect(data.gameState).toBeDefined();
                expect(data.gameState.status).toBe('waiting');
                resolve();
            });
        });
    });

    it("Sub-03.3: Debe rechazar la conexión si la sala no existe", () => {
        return new Promise<void>((resolve) => {
            clientSocket2.on(SocketEvents.ERROR, (error) => {
                expect(error.message).toBe('Código incorrecto o la sala no existe.');
                resolve();
            });

            clientSocket2.emit(SocketEvents.JOIN_ROOM, { roomCode: 'nonexistent-room', guestName: 'Player2'});
        });
    });

    it("Sub-03.4: Debe rechazar la conexión si la sala está llena", () => {
        return new Promise<void>((resolve) => {

            clientSocket1.emit(SocketEvents.CREATE_ROOM, 'Player1');

            clientSocket1.on(SocketEvents.ROOM_CREATED, (data) => {
                const roomCode = data.roomCode;

                clientSocket2.emit(SocketEvents.JOIN_ROOM, { roomCode: roomCode, guestName: 'Player2' });
                clientSocket2.on(SocketEvents.GAME_START, () => {
                    const clientSocket3 = ioClient(`http://localhost:${port}`);

                    clientSocket3.on('connect', () => {
                        clientSocket3.emit(SocketEvents.JOIN_ROOM, { roomCode: roomCode, guestName: 'Player3' });
                    });

                    clientSocket3.on(SocketEvents.ERROR, (error) => {
                        expect(error.message).toBe('La sala está llena.');
                        clientSocket3.disconnect();
                        resolve();
                    });
                });

            });

        });
    });

});


describe('FEAT-04: Gestiónd del Tablero en Tiempo real', () => {
    let io: Server;
    let clientSocket1: ClientSocket;
    let clientSocket2: ClientSocket;
    let port: number;

    beforeAll(async () => {
        console.log("\n=== INICIANDO PRUEBAS DE GESTIÓN DE SALAS PRIVADAS ===");
        const httpServer = createServer();
        io = new Server(httpServer);

        // ¡Inyectamos tu código real del enrutador!
        registerSocketEvents(io);

        await new Promise<void>((resolve) => {
            httpServer.listen(0, () => {
                port = (httpServer.address() as any).port;
                resolve();
            });
        });
    });

    afterAll(() => {
        io.close();
    });

    beforeEach(async () => {
        (RoomManager as any).activeRooms.clear();

        clientSocket1 = ioClient(`http://localhost:${port}`);
        clientSocket2 = ioClient(`http://localhost:${port}`);

        await new Promise<void>((resolve) => {
                let connectedClients = 0;
            const checkDone = () => {
                connectedClients++;
                if (connectedClients === 2) {
                    resolve();
                }
            };

            clientSocket1.on('connect', checkDone);
            clientSocket2.on('connect', checkDone);

        });
        
    });

    afterEach(() => {

        clientSocket1.disconnect();
        clientSocket2.disconnect();
    });

    it('Sub-04.1: Los jugadores inician partida, el jugador en turno realiza un movimiento legal según sus cartas y ambos reciben GAME_UPDATE', () => {
        return new Promise<void>((resolve, reject) => {
            let activeClient: ClientSocket;
            let currentRoomCode = '';

            // Escuchamos GAME_START en ambos clientes
            const handleGameStart = (client: ClientSocket, isHost: boolean) => (data: any) => {
                const gameState = data.gameState;
                const activeColor = gameState.currentTurn; // 'red' | 'blue'
                
                // Determinamos qué socket tiene el turno inicial
                const isMyTurn = (activeColor === 'red' && isHost) || (activeColor === 'blue' && !isHost);
                
                if (isMyTurn) {
                    activeClient = client;

                    // 1. Obtenemos las cartas del jugador activo
                    const playerCards = activeColor === 'red' ? gameState.cards.red : gameState.cards.blue;
                    const selectedCard = playerCards[0]; // Tomamos la primera carta

                    // 2. Buscamos una ficha propia y un movimiento válido dentro del tablero
                    let validMove: { from: { x: number, y: number }, to: { x: number, y: number }, cardName: string } | null = null;
                    const multiplier = activeColor === 'red' ? -1 : 1;

                    for (let y = 0; y < 5; y++) {
                        for (let x = 0; x < 5; x++) {
                            const piece = gameState.board[y][x];
                            if (piece && piece.color === activeColor) {
                                for (const move of selectedCard.moves) {
                                    const targetX = x + (move.x * multiplier);
                                    const targetY = y + (move.y * multiplier);

                                    // Validamos que caiga dentro de la matriz 5x5 y no sobre una pieza propia
                                    if (targetX >= 0 && targetX < 5 && targetY >= 0 && targetY < 5) {
                                        const destPiece = gameState.board[targetY][targetX];
                                        if (!destPiece || destPiece.color !== activeColor) {
                                            validMove = {
                                                from: { x, y },
                                                to: { x: targetX, y: targetY },
                                                cardName: selectedCard.name
                                            };
                                            break;
                                        }
                                    }
                                }
                            }
                            if (validMove) break;
                        }
                        if (validMove) break;
                    }

                    if (!validMove) {
                        return reject(new Error('No se encontró ningún movimiento legal inicial para la carta asignada.'));
                    }

                    // 3. Emitimos la jugada al servidor
                    activeClient.emit(SocketEvents.PLAYER_MOVE, validMove);
                }
            };

            // Contabilizamos que ambos clientes reciban el GAME_UPDATE del servidor
            let updatesReceived = 0;
            const checkGameUpdate = (data: any) => {
                try {
                    expect(data.gameState).toBeDefined();
                    expect(data.gameState.board).toBeDefined();
                    updatesReceived++;

                    if (updatesReceived === 2) {
                        resolve();
                    }
                } catch (error) {
                    reject(error);
                }
            };

            clientSocket1.on(SocketEvents.GAME_UPDATE, checkGameUpdate);
            clientSocket2.on(SocketEvents.GAME_UPDATE, checkGameUpdate);

            clientSocket1.on(SocketEvents.GAME_START, handleGameStart(clientSocket1, true));
            clientSocket2.on(SocketEvents.GAME_START, handleGameStart(clientSocket2, false));

            // Flujo de arranque de sala
            clientSocket1.on(SocketEvents.ROOM_CREATED, (data) => {
                currentRoomCode = data.roomCode;
                clientSocket2.emit(SocketEvents.JOIN_ROOM, { roomCode: currentRoomCode, guestName: 'Player2' });
            });

            clientSocket1.emit(SocketEvents.CREATE_ROOM, 'Player1');
        });
    });

    it('Sub-04.2: Debe rechazar un movimiento ejecutado por el jugador que no tiene el turno', () => {
        return new Promise<void>((resolve, reject) => {
            const handleGameStart = (client: ClientSocket, isHost: boolean) => (data: any) => {
                const gameState = data.gameState;
                const activeColor = gameState.currentTurn;
                const isInactive = (activeColor === 'red' && !isHost) || (activeColor === 'blue' && isHost);

                // El jugador que NO tiene el turno intenta mover
                if (isInactive) {
                    client.emit(SocketEvents.PLAYER_MOVE, {
                        from: { x: 2, y: 0 },
                        to: { x: 2, y: 1 },
                        cardName: 'Tiger'
                    });
                }
            };

            const handleError = (error: any) => {
                try {
                    expect(error.message).toBeDefined();
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };

            clientSocket1.on(SocketEvents.ERROR, handleError);
            clientSocket2.on(SocketEvents.ERROR, handleError);

            clientSocket1.on(SocketEvents.GAME_START, handleGameStart(clientSocket1, true));
            clientSocket2.on(SocketEvents.GAME_START, handleGameStart(clientSocket2, false));

            clientSocket1.on(SocketEvents.ROOM_CREATED, (data) => {
                clientSocket2.emit(SocketEvents.JOIN_ROOM, { roomCode: data.roomCode, guestName: 'Player2' });
            });

            clientSocket1.emit(SocketEvents.CREATE_ROOM, 'Player1');
        });
    });

    it('Sub-04.3: Debe rechazar una jugada inválida y mantener el tablero sin cambios', () =>{
        return new Promise<void>((resolve, reject) => {
            const handleGameStart = (client: ClientSocket, isHost: boolean) => (data: any) => {
                const gameState = data.gameState;
                const activeColor = gameState.currentTurn;
                
                // Solo el jugador que tiene el turno intentará hacer la trampa
                const isMyTurn = (activeColor === 'red' && isHost) || (activeColor === 'blue' && !isHost);
                
                if (isMyTurn) {
                    // 1. Obtenemos una de sus cartas reales para que esa validación pase
                    const playerCards = activeColor === 'red' ? gameState.cards.red : gameState.cards.blue;
                    const selectedCard = playerCards[0];

                    // 2. Emitimos un movimiento claramente ilegal (coordenadas fuera de la matriz 5x5)
                    client.emit('player_move', {
                        from: { x: 0, y: 0 },
                        to: { x: 10, y: 10 }, // Destino matemáticamente imposible
                        cardName: selectedCard.name
                    });
                }
            };

            // Escuchamos el evento de error que debe escupir el backend
            const handleError = (error: any) => {
                try {
                    expect(error.message).toBeDefined();
                    // Opcionalmente, puedes ser más estricto comprobando el texto del error
                    // expect(error.message).toContain('fuera de los límites');
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };

            // Suscribimos ambos clientes por si el error le llega al que no debe
            clientSocket1.on('error', handleError);
            clientSocket2.on('error', handleError);

            clientSocket1.on('game_start', handleGameStart(clientSocket1, true));
            clientSocket2.on('game_start', handleGameStart(clientSocket2, false));

            // Flujo estándar de arranque de sala
            clientSocket1.on('room_created', (data) => {
                clientSocket2.emit('join_room', { roomCode: data.roomCode, guestName: 'Player2' });
            });

            clientSocket1.emit('create_room', 'Player1');
        });
    });

    it('Sub-04.4: Debe capturar la latencia de red mediante un ciclo de ping-pong', async () => {
        const pingPromise = new Promise<number>((resolve) => {
            const clientTimeStamp = Date.now();

            clientSocket1.once(SocketEvents.PONG, (serverTimeStamp: number) => {
                const latency = Date.now() - clientTimeStamp;
                resolve(latency);
            });

            clientSocket1.emit(SocketEvents.PING, clientTimeStamp);
        });

        const latency = await pingPromise;
        
        expect(latency).toBeDefined();
        expect(typeof latency).toBe('number');
        expect(latency).toBeGreaterThanOrEqual(0);
    });
});


describe('FEAT-05: Resoluciones alternativas de partida', () => {
    let ioServer: Server;
    let httpServer: any;
    let port: number;
    
    let clientSocket1: ClientSocket;
    let clientSocket2: ClientSocket;
    let activeRoomId: string;
    let client1Color: PlayerColor;
    let client2Color: PlayerColor;

    beforeAll(async () => {
        httpServer = createServer();
        ioServer = new Server(httpServer);
        
        // Registramos tus eventos reales del backend
        registerSocketEvents(ioServer); // Pasamos true para habilitar el modo de prueba

        await new Promise<void>((resolve) => {
            httpServer.listen(0, () => {
                port = (httpServer.address() as any).port;
                resolve();
            });
        });
    });

    afterAll(() => {
        ioServer.close();
        httpServer.close();
    });

    beforeEach(async () => {
        RoomManager['activeRooms'].clear();

        clientSocket1 = ioClient(`http://localhost:${port}`);
        clientSocket2 = ioClient(`http://localhost:${port}`);

        //Creamos una sala y unimos ambos jugadores antes de cada test
        await new Promise<void>((resolve) => {
            clientSocket1.on('connect', () => {
                clientSocket1.emit(SocketEvents.CREATE_ROOM, { hostName: 'Player1'});
            });

            clientSocket1.on(SocketEvents.ROOM_CREATED, (data) => {
                clientSocket2.emit(SocketEvents.JOIN_ROOM, { roomCode: data.roomCode, guestName: 'Player2' });
            });

            clientSocket1.on(SocketEvents.GAME_START, (data) => {
                activeRoomId = data.gameState.roomId;
                client1Color = data.players.red.socketId === clientSocket1.id ? 'red' : 'blue';
                client2Color = data.players.red.socketId === clientSocket2.id ? 'red' : 'blue';
                resolve();
            });
        });
    });

    afterEach(() => {
        clientSocket1.disconnect();
        clientSocket2.disconnect();
    });

    it('Sub-05,1: Debe permitir a un jugador rendirse y notificar al oponente, finalizando la partida', async () => {
        //Preparar las promesas antes de emitir la rendición
        const client1UpdatePromise = new Promise<void>((resolve, reject) => {
            clientSocket1.on(SocketEvents.GAME_UPDATE, (data) => {
                try {
                    expect(data.gameState.status).toBe('finished');
                    expect(data.gameState.winner).toBe(client2Color); 
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });

        const client2UpdatePromise = new Promise<void>((resolve, reject) => {
            clientSocket2.on(SocketEvents.GAME_UPDATE, (data) => {
                try {
                    expect(data.gameState.status).toBe('finished');
                    expect(data.gameState.winner).toBe(client2Color);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });

        clientSocket1.emit(SocketEvents.SURRENDER);

        await Promise.all([client1UpdatePromise, client2UpdatePromise]);
        //expect(RoomManager.getRoomById(activeRoomId)).toBeUndefined();
        //expect(RoomManager.roomExists(activeRoomId)).toBe(false);
    });

    it('Sub-05.2a: Debe manejar la desconexión de un jugador y notificar al oponente, finalizando la partida si no se reconecta', async () => {
        RoomManager.DISCONNECT_TIMEOUT_MS = 1000; // Reducimos el tiempo de espera para la prueba
        
        const client2DisconnectedPromise = new Promise<void>((resolve, reject) => {
            clientSocket2.on(SocketEvents.OPPONENT_DISCONNECTED, (data) => {
                try {
                    expect(data.message).toBe('El oponente se ha desconectado. Esperando reconexión...');
                    expect(data.timeLimit).toBe(1000);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });

        const client2VictoryPromise = new Promise<void>((resolve, reject) => {
            clientSocket2.on(SocketEvents.GAME_UPDATE, (data) => {
                try {
                    expect(data.gameState.status).toBe('finished');
                    expect(data.gameState.winner).toBe(client2Color);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });

        clientSocket1.disconnect();

        await Promise.all([client2DisconnectedPromise, client2VictoryPromise]);

        expect(RoomManager.getRoomById(activeRoomId)).toBeUndefined();
        expect(RoomManager.roomExists(activeRoomId)).toBe(false);

        clientSocket2.emit('DEBUG_SET_TIMEOUT', { timeout: 30000 });

    });

    it('Sub-05.2b: Debe permitir la reconexión de un jugador dentro del tiempo límite y continuar la partida', async () => {
        RoomManager.DISCONNECT_TIMEOUT_MS = 2000; // Reducimos el tiempo de espera para la prueba

        const disconnectWarningPromise = new Promise<void>((resolve) => {
            clientSocket2.on(SocketEvents.OPPONENT_DISCONNECTED, () => resolve());
        });

        const oldSocketId = clientSocket1.id;
        clientSocket1.disconnect();
        await disconnectWarningPromise;

        const newClientSocket1 = ioClient(`http://localhost:${port}`);

        const reconnectSuccessPromise = new Promise<void>((resolve, reject) => {
            newClientSocket1.on(SocketEvents.RECONNECT_SUCCESS, (data) => {
                try {
                    expect(data.gameState).toBeDefined();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });

        const opponentNotifiedPromise = new Promise<void>((resolve, reject) => {
            clientSocket2.on(SocketEvents.OPPONENT_RECONNECTED, () => resolve());
        });

        newClientSocket1.emit(SocketEvents.RECONNECT_ATTEMPT, { 
            roomId: activeRoomId, 
            originalSocketId: oldSocketId });

        await Promise.all([reconnectSuccessPromise, opponentNotifiedPromise]);

        newClientSocket1.disconnect();
    });

    it('Sub-05.3: Debe finalizar la partida y otorgar la victoria al oponente si el temporizador de juego llega a cero', async () => {
        const room = RoomManager.getRoomById(activeRoomId);

        const activeColor = room!.gameState.currentTurn;
        
        const timeOutVictoryPromise = new Promise<void>((resolve, reject) => {
            clientSocket2.on(SocketEvents.GAME_UPDATE, (data) => {
                try {
                    expect(data.gameState.status).toBe('finished');
                    const expectedWInner = activeColor === client2Color ? client1Color : client2Color;
                    expect(data.gameState.winner).toBe(expectedWInner);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });

        room!.gameState.timeRemaining[activeColor] = 1; // Forzamos que el tiempo restante sea 1 segundo

        await timeOutVictoryPromise;

        expect(RoomManager.roomExists(activeRoomId)).toBe(false);
    });
        
    it('Sub-05.4a: Debe permitir a un jugador ofrecer empate y que el oponente lo rechace, continuando la partida', async () => {
        const offerDrawPromise = new Promise<void>((resolve) => {
            clientSocket2.on(SocketEvents.OFFER_DRAW, () => resolve());
        });

        const rejectDrawPromise = new Promise<void>((resolve) => {
            clientSocket1.on(SocketEvents.REJECT_DRAW, () => resolve());
        });

        clientSocket1.emit(SocketEvents.OFFER_DRAW);
        await offerDrawPromise;

        clientSocket2.emit(SocketEvents.REJECT_DRAW);
        await rejectDrawPromise;

        expect(RoomManager.getRoomById(activeRoomId)).toBeDefined();
        expect(RoomManager.roomExists(activeRoomId)).toBe(true);
    });

    it('Sub-05.4b: Debe permitir a un jugador ofrecer empate y que el oponente lo acepte, finalizando la partida en empate', async () => {
        const offerDrawPromise = new Promise<void>((resolve) => {
            clientSocket2.on(SocketEvents.OFFER_DRAW, () => resolve());
        });

        const client1UpdatePromise = new Promise<void>((resolve, reject) => {
            clientSocket1.on(SocketEvents.GAME_UPDATE, (data) => {
                try {
                    expect(data.gameState.status).toBe('finished');
                    expect(data.gameState.winner).toBe('draw');
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });

        const client2UpdatePromise = new Promise<void>((resolve, reject) => {
            clientSocket2.on(SocketEvents.GAME_UPDATE, (data) => {
                try {
                    expect(data.gameState.status).toBe('finished');
                    expect(data.gameState.winner).toBe('draw');
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });

        clientSocket1.emit(SocketEvents.OFFER_DRAW);
        await offerDrawPromise;

        clientSocket2.emit(SocketEvents.ACCEPT_DRAW);
        await Promise.all([client1UpdatePromise, client2UpdatePromise]);

        //expect(RoomManager.getRoomById(activeRoomId)).toBeUndefined();
        //expect(RoomManager.roomExists(activeRoomId)).toBe(false);
    });

    it('Sub-05.5a: Debe notificar el rechazo de una revancha y eliminar la sala', async () => {
                
        const offerPromise = new Promise<void>((resolve) => {
            clientSocket2.on(SocketEvents.REMATCH_OFFERED, () => {
                clientSocket2.emit(SocketEvents.REJECT_REMATCH);
                resolve();
            });
        });

        const rejectPromise = new Promise<void>((resolve) => {
            clientSocket1.on(SocketEvents.REMATCH_REJECTED, () => {
                console.log("Revancha rechazada");
                resolve();
            });
        });

        clientSocket1.emit(SocketEvents.OFFER_REMATCH);

        await Promise.all([offerPromise, rejectPromise]);

        const room = RoomManager.getRoomById(activeRoomId);
        expect(room).toBeUndefined();
    });

    it('Sub-05.5b: Debe permitir la aceptación de una revancha y reiniciar el juego', async () => {
        const gameStartPromise1 = new Promise<any>((resolve, reject) => {
            clientSocket1.on(SocketEvents.GAME_START, (data) => resolve(data));
        });

        const gameStartPromise2 = new Promise<any>((resolve, reject) => {
            clientSocket2.on(SocketEvents.GAME_START, (data) => resolve(data));
        });

        clientSocket2.on(SocketEvents.REMATCH_OFFERED, () => {
            clientSocket2.emit(SocketEvents.ACCEPT_REMATCH);
        });

        clientSocket1.emit(SocketEvents.OFFER_REMATCH);

        const [data1, data2] = await Promise.all([gameStartPromise1, gameStartPromise2]);

        expect(data1.gameState).toBeDefined();
        expect(data2.gameState).toBeDefined();

        expect(data1.gameState.status).not.toBe('finished');
        expect(data2.gameState.status).not.toBe('finished');
    });
});


describe ('FEAT-06: Gestión de la cola de emparejamiento', () => {
    let ioServer: Server;
    let httpServer: any;
    let port: number;

    let clientA: ClientSocket;
    let clientB: ClientSocket;
    
    beforeAll(async () => {
        httpServer = createServer();
        ioServer = new Server(httpServer);
        
        // Registramos tus eventos reales del backend
        registerSocketEvents(ioServer); // Pasamos true para habilitar el modo de prueba

        await new Promise<void>((resolve) => {
            httpServer.listen(0, () => {
                port = (httpServer.address() as any).port;
                resolve();
            });
        });
    });

    afterAll(() => {
        ioServer.close();
        httpServer.close();
    });

    beforeEach(async (done) => {
        clientA = ioClient(`http://localhost:${port}`);
        clientB = ioClient(`http://localhost:${port}`);

        await new Promise<void>((resolve) => {
                let connectedClients = 0;
            const checkDone = () => {
                connectedClients++;
                if (connectedClients === 2) {
                    resolve();
                }
            };

            clientA.on('connect', checkDone);
            clientB.on('connect', checkDone);

        });
    });

    afterEach(() => {
        clientA.disconnect();
        clientB.disconnect();
    });

    it('Sub-06.1: Debe colocar al jugador en la cola y emitir QUEUE_JOINED si está vacía', () => {
        return new Promise<void>((resolve) => {
            clientA.on(SocketEvents.QUEUE_JOINED, () => {
                expect(true).toBe(true);
                resolve();
            });

            clientA.emit(SocketEvents.JOIN_QUEUE, { mode: 'casual'});
        });
    });

    it('Sub-06.2: Debe emparejar a dos jugadores en el mismo modo y emitir MATCH_FOUND y GAME_START a ambos', () => {
        return new Promise<void>((resolve) => {
            let matchesFound = 0;
            let expectedRoomId = '';
            

            const handleMatchFound = (payload: any) => {
                expect(payload).toHaveProperty('roomId');
                expect(payload).toHaveProperty('roomCode');
                expect(payload.mode).toBe('normal');

                if (matchesFound === 0) {
                    expectedRoomId = payload.roomId;
                } else {
                    expect(payload.roomId).toBe(expectedRoomId);
                }

                matchesFound++;
            };

            const handleGameStart = (payload: any) => {
                expect(payload).toHaveProperty('gameState');
                expect(payload.gameState).toHaveProperty('roomId');
                expect(payload.gameState.roomId).toBe(expectedRoomId);
                expect(payload.gameState.timeRemaining.red).toBe(600);
                
                if (matchesFound === 2) {
                    resolve();
                }
            };

            clientA.on(SocketEvents.MATCH_FOUND, handleMatchFound);
            clientA.on(SocketEvents.GAME_START, handleGameStart);

            clientB.on(SocketEvents.MATCH_FOUND, handleMatchFound);
            clientB.on(SocketEvents.GAME_START, handleGameStart);

            clientA.emit(SocketEvents.JOIN_QUEUE, { mode: 'normal' });

            setTimeout(() => {
                clientB.emit(SocketEvents.JOIN_QUEUE, { mode: 'normal' });
            }, 100);
        })
    });

    it('Su-06.3: No debe emparejar a jugadores de diferentes modos', () => {
        return new Promise<void>((resolve, reject) => {
            let matchFound = false;

            const failTest = () => { matchFound = true; reject(new Error('Se emparejaron jugadores de diferentes modos.')); };
            clientA.on(SocketEvents.MATCH_FOUND, failTest);
            clientB.on(SocketEvents.MATCH_FOUND, failTest);

            clientA.emit(SocketEvents.JOIN_QUEUE, { mode: 'casual' });
            setTimeout(() => {
                clientB.emit(SocketEvents.JOIN_QUEUE, { mode: 'normal' });
            }, 100);

            setTimeout(() => {
                if (!matchFound) {
                    expect(true).toBe(true);
                    resolve();
                }
            }, 300);
        });
    });

    it('Sub-06.4: Debe permitir a un jugador abandonar la cola y emitir QUEUE_LEFT', () => {
        return new Promise<void>((resolve, reject) => {
            clientB.on(SocketEvents.MATCH_FOUND, () => {
                reject(new Error('Jugador B se emparejó con Jugador A a pesar de que A abandonó la cola.'));
            });

            clientA.emit(SocketEvents.JOIN_QUEUE, { mode: 'fast' });

            clientA.on(SocketEvents.QUEUE_JOINED, () => {
                clientA.emit(SocketEvents.LEAVE_QUEUE);
            });

            clientA.on(SocketEvents.QUEUE_LEFT, () => {
                clientB.emit(SocketEvents.JOIN_QUEUE, { mode: 'fast' });

                clientB.on(SocketEvents.QUEUE_JOINED, () => {
                    setTimeout(() => resolve(), 100);
                });
            });
        });
    });

    it('Sub-06.5: Debe limpiar la cola si un jugador se desconecta mientras está en ella', () => {
        return new Promise<void>((resolve, reject) => {
            
            clientB.on(SocketEvents.MATCH_FOUND, () => {
                reject(new Error('Jugador B se emparejó con Jugador A a pesar de que A se desconectó.'));
            });

            clientA.emit(SocketEvents.JOIN_QUEUE, { mode: 'normal' });

            clientA.on(SocketEvents.QUEUE_JOINED, () => {
                clientA.disconnect();

                setTimeout(() => {
                    clientB.emit(SocketEvents.JOIN_QUEUE, { mode: 'normal' });

                    clientB.on(SocketEvents.QUEUE_JOINED, () => {
                        setTimeout(() => resolve(), 100);
                    });
                });
            });
        });
    });

});