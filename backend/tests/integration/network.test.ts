import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it} from 'vitest';
import { RoomManager } from "../../src/network/RoomManager";
import { registerSocketEvents } from "../../src/network/SocketHandler";
import { SocketEvents, PlayerColor, ChatMessage, GameMode, GameState, PlayerProfile } from "../../../shared/index";

import { Server } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { createServer, Server as HttpServer } from 'http';
import type { AddressInfo } from 'net';

type GameStartPayload = { gameState: GameState, players: { red: PlayerProfile, blue: PlayerProfile } };
type GameUpdatePayload = { gameState: GameState };
type ErrorPayload = { message: string };
type MatchFoundPayload = { roomId: string, roomCode: string, mode: GameMode };

export interface TestServer {
    io: Server;
    httpServer: HttpServer;
    port: number;
}

export async function startTestServer(): Promise<TestServer> {
    const httpServer = createServer();
    const io = new Server(httpServer);
    registerSocketEvents(io);

    const port = await new Promise<number>((resolve) => {
        httpServer.listen(0, () => {
            resolve((httpServer.address() as AddressInfo).port);
        });
    });
    return { io, httpServer, port };
}

export function stopTestServer(server: TestServer): void {
    server.io.close();
    server.httpServer.close();
}

export async function connectClients(port: number, numClients: number): Promise<ClientSocket[]> {
    const clients = Array.from({ length: numClients }, () => ioClient(`http://localhost:${port}`));

    await Promise.all( 
        clients.map((client) => new Promise<void>((resolve) => client.on('connect', () => resolve())))
    );
    return clients;
}


describe('FEAT-03: Gestión de Salas Privadas (WebSockets)', () => {
    let server: TestServer;
    let clientSocket1: ClientSocket;
    let clientSocket2: ClientSocket;

    beforeAll(async () => {
        server = await startTestServer();
    });

    afterAll(() => {
        stopTestServer(server);
    });

    beforeEach(async () => {
        RoomManager.clearActiveRooms();

        [clientSocket1, clientSocket2] = await connectClients(server.port, 2);
        
    });

    afterEach(() => {
        clientSocket1.disconnect();
        clientSocket2.disconnect();
    });

    //Suite de test
    it('Test-03.1: Debe crear una sala privada y devolver el código de la sala', () => {
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

    it("Test-03.2:  Debe permitir a un segundo jugador unirse a la sala privada y comenzar el juego", () => {
        console.log("Test-03.2: Creando sala con Player1 y uniendo Player2...");
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

    it("Test-03.3: Debe rechazar la conexión si la sala no existe", () => {
        return new Promise<void>((resolve) => {
            clientSocket2.on(SocketEvents.ERROR, (error) => {
                expect(error.message).toBe('Código incorrecto o la sala no existe.');
                resolve();
            });

            clientSocket2.emit(SocketEvents.JOIN_ROOM, { roomCode: 'nonexistent-room', guestName: 'Player2'});
        });
    });

    it("Test-03.4: Debe rechazar la conexión si la sala está llena", () => {
        return new Promise<void>((resolve) => {

            clientSocket1.emit(SocketEvents.CREATE_ROOM, 'Player1');

            clientSocket1.on(SocketEvents.ROOM_CREATED, (data) => {
                const roomCode = data.roomCode;

                clientSocket2.emit(SocketEvents.JOIN_ROOM, { roomCode: roomCode, guestName: 'Player2' });
                clientSocket2.on(SocketEvents.GAME_START, () => {
                    const clientSocket3 = ioClient(`http://localhost:${server.port}`);

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


describe('FEAT-04: Gestión del Tablero en Tiempo real', () => {
    let server: TestServer;
    let clientSocket1: ClientSocket;
    let clientSocket2: ClientSocket;

    beforeAll(async () => {
        server = await startTestServer();
    });

    afterAll(() => {
        stopTestServer(server);
    });

    beforeEach(async () => {
        RoomManager.clearActiveRooms();

        [clientSocket1, clientSocket2] = await connectClients(server.port, 2);
    });

    afterEach(() => {
        clientSocket1.disconnect();
        clientSocket2.disconnect();
    });

    it('Test-04.1: Los jugadores inician partida, el jugador en turno realiza un movimiento legal según sus cartas y ambos reciben GAME_UPDATE', () => {
        return new Promise<void>((resolve, reject) => {
            let activeClient: ClientSocket;
            let currentRoomCode = '';

            // Escuchamos GAME_START en ambos clientes
            const handleGameStart = (client: ClientSocket, isHost: boolean) => (data: GameStartPayload) => {
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
            const checkGameUpdate = (data: GameUpdatePayload) => {
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

    it('Test-04.2: Debe rechazar un movimiento ejecutado por el jugador que no tiene el turno, sin alterar el estado ni notificar al rival', () => {
        return new Promise<void>((resolve, reject) => {
            let offender: ClientSocket | null = null;
            let rival: ClientSocket | null = null;

            const handleGameStart = (client: ClientSocket, isHost: boolean) => (data: GameStartPayload) => {
                const gameState = data.gameState;
                const activeColor = gameState.currentTurn;
                const isInactive = (activeColor === 'red' && !isHost) || (activeColor === 'blue' && isHost);

                // El jugador que NO tiene el turno intenta mover
                if (isInactive) {
                    offender = client;
                    rival = isHost ? clientSocket2 : clientSocket1;

                    client.emit(SocketEvents.PLAYER_MOVE, {
                        from: { x: 2, y: 0 },
                        to: { x: 2, y: 1 },
                        cardName: 'Tiger'
                    });
                }
            };

            // El estado de la partida no debe alterarse: ningún cliente debería recibir GAME_UPDATE.
            const failOnGameUpdate = () => reject(new Error('No debería emitirse GAME_UPDATE: la jugada fuera de turno no debe alterar el estado.'));
            clientSocket1.on(SocketEvents.GAME_UPDATE, failOnGameUpdate);
            clientSocket2.on(SocketEvents.GAME_UPDATE, failOnGameUpdate);

            const handleError = (client: ClientSocket) => (error: ErrorPayload) => {
                if (client === rival) {
                    return reject(new Error('El error no debería llegar al jugador que sí tenía el turno.'));
                }

                try {
                    expect(client).toBe(offender);
                    expect(error.message).toBeDefined();

                    // Margen de gracia para confirmar que no llega ningún GAME_UPDATE ni error adicional al rival.
                    setTimeout(() => {
                        clientSocket1.off(SocketEvents.GAME_UPDATE, failOnGameUpdate);
                        clientSocket2.off(SocketEvents.GAME_UPDATE, failOnGameUpdate);
                        resolve();
                    }, 50);
                } catch (err) {
                    reject(err);
                }
            };

            clientSocket1.on(SocketEvents.ERROR, handleError(clientSocket1));
            clientSocket2.on(SocketEvents.ERROR, handleError(clientSocket2));

            clientSocket1.on(SocketEvents.GAME_START, handleGameStart(clientSocket1, true));
            clientSocket2.on(SocketEvents.GAME_START, handleGameStart(clientSocket2, false));

            clientSocket1.on(SocketEvents.ROOM_CREATED, (data) => {
                clientSocket2.emit(SocketEvents.JOIN_ROOM, { roomCode: data.roomCode, guestName: 'Player2' });
            });

            clientSocket1.emit(SocketEvents.CREATE_ROOM, 'Player1');
        });
    });

    it('Test-04.3: Debe rechazar una jugada con coordenadas fuera del tablero y mantener el estado sin cambios', () =>{
        return new Promise<void>((resolve, reject) => {
            const handleGameStart = (client: ClientSocket, isHost: boolean) => (data: GameStartPayload) => {
                const gameState = data.gameState;
                const activeColor = gameState.currentTurn;

                // Solo el jugador que tiene el turno intentará hacer la trampa
                const isMyTurn = (activeColor === 'red' && isHost) || (activeColor === 'blue' && !isHost);

                if (isMyTurn) {
                    // 1. Obtenemos una de sus cartas reales para que esa validación pase
                    const playerCards = activeColor === 'red' ? gameState.cards.red : gameState.cards.blue;
                    const selectedCard = playerCards[0];

                    // 2. Emitimos un movimiento claramente ilegal (coordenadas fuera de la matriz 5x5)
                    client.emit(SocketEvents.PLAYER_MOVE, {
                        from: { x: 0, y: 0 },
                        to: { x: 10, y: 10 }, // Destino matemáticamente imposible
                        cardName: selectedCard.name
                    });
                }
            };

            // El estado de la partida no debe alterarse: ningún cliente debería recibir GAME_UPDATE.
            const failOnGameUpdate = () => reject(new Error('No debería emitirse GAME_UPDATE: la jugada con coordenadas fuera del tablero no debe alterar el estado.'));
            clientSocket1.on(SocketEvents.GAME_UPDATE, failOnGameUpdate);
            clientSocket2.on(SocketEvents.GAME_UPDATE, failOnGameUpdate);

            // Escuchamos el evento de error que debe escupir el backend
            const handleError = (error: ErrorPayload) => {
                try {
                    expect(error.message).toBeDefined();

                    // Margen de gracia para confirmar que no llega ningún GAME_UPDATE tras el error.
                    setTimeout(() => {
                        clientSocket1.off(SocketEvents.GAME_UPDATE, failOnGameUpdate);
                        clientSocket2.off(SocketEvents.GAME_UPDATE, failOnGameUpdate);
                        resolve();
                    }, 50);
                } catch (err) {
                    reject(err);
                }
            };

            // Suscribimos ambos clientes por si el error le llega al que no debe
            clientSocket1.on(SocketEvents.ERROR, handleError);
            clientSocket2.on(SocketEvents.ERROR, handleError);

            clientSocket1.on(SocketEvents.GAME_START, handleGameStart(clientSocket1, true));
            clientSocket2.on(SocketEvents.GAME_START, handleGameStart(clientSocket2, false));

            // Flujo estándar de arranque de sala
            clientSocket1.on(SocketEvents.ROOM_CREATED, (data) => {
                clientSocket2.emit(SocketEvents.JOIN_ROOM, { roomCode: data.roomCode, guestName: 'Player2' });
            });

            clientSocket1.emit(SocketEvents.CREATE_ROOM, 'Player1');
        });
    });

    it('Test-04.4: Debe capturar la latencia de red mediante un ciclo de ping-pong', async () => {
        const pingPromise = new Promise<number>((resolve) => {
            const clientTimeStamp = Date.now();

            clientSocket1.once(SocketEvents.PONG, (serverTimeStamp: number) => {
                expect(serverTimeStamp).toBe(clientTimeStamp);
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
    let server: TestServer;

    let clientSocket1: ClientSocket;
    let clientSocket2: ClientSocket;
    let activeRoomId: string;
    let client1Color: PlayerColor;
    let client2Color: PlayerColor;
    let defaultDisconnectTimeoutMs: number;

    beforeAll(async () => {
        server = await startTestServer();

        // Guardamos el valor real de fábrica para poder restaurarlo tras cada test que lo sobreescriba.
        defaultDisconnectTimeoutMs = RoomManager.DISCONNECT_TIMEOUT_MS;
    });

    afterAll(() => {
        stopTestServer(server);
    });

    beforeEach(async () => {
        RoomManager.clearActiveRooms();

        [clientSocket1, clientSocket2] = await connectClients(server.port, 2);

        //Creamos una sala y unimos ambos jugadores antes de cada test
        await new Promise<void>((resolve) => {
            clientSocket1.on(SocketEvents.ROOM_CREATED, (data) => {
                clientSocket2.emit(SocketEvents.JOIN_ROOM, { roomCode: data.roomCode, guestName: 'Player2' });
            });

            clientSocket1.on(SocketEvents.GAME_START, (data) => {
                activeRoomId = data.gameState.roomId;
                client1Color = data.players.red.socketId === clientSocket1.id ? 'red' : 'blue';
                client2Color = data.players.red.socketId === clientSocket2.id ? 'red' : 'blue';
                resolve();
            });

            clientSocket1.emit(SocketEvents.CREATE_ROOM, { hostName: 'Player1' });
        });
    });

    afterEach(() => {
        clientSocket1.disconnect();
        clientSocket2.disconnect();
        // Restauramos el timeout de desconexión por si algún test lo ha reducido para forzar el escenario.
        RoomManager.DISCONNECT_TIMEOUT_MS = defaultDisconnectTimeoutMs;
    });

    it('Test-05.1: Debe permitir a un jugador rendirse y notificar al oponente, finalizando la partida', async () => {
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

        // La sala se mantiene en memoria tras la rendición para permitir una revancha (Sub-05.5); no se borra aquí.
        expect(RoomManager.getRoomById(activeRoomId)).toBeDefined();
        expect(RoomManager.roomExists(activeRoomId)).toBe(true);
    });

    it('Test-05.2a: Debe manejar la desconexión de un jugador y notificar al oponente, finalizando la partida si no se reconecta', async () => {
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
    });

    it('Test-05.2b: Debe permitir la reconexión de un jugador dentro del tiempo límite y continuar la partida', async () => {
        RoomManager.DISCONNECT_TIMEOUT_MS = 2000; // Reducimos el tiempo de espera para la prueba

        const disconnectWarningPromise = new Promise<void>((resolve) => {
            clientSocket2.on(SocketEvents.OPPONENT_DISCONNECTED, () => resolve());
        });

        const oldSocketId = clientSocket1.id;
        clientSocket1.disconnect();
        await disconnectWarningPromise;

        const newClientSocket1 = ioClient(`http://localhost:${server.port}`);

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

        const opponentNotifiedPromise = new Promise<void>((resolve) => {
            clientSocket2.on(SocketEvents.OPPONENT_RECONNECTED, () => resolve());
        });

        newClientSocket1.emit(SocketEvents.RECONNECT_ATTEMPT, { 
            roomId: activeRoomId, 
            originalSocketId: oldSocketId });

        await Promise.all([reconnectSuccessPromise, opponentNotifiedPromise]);

        newClientSocket1.disconnect();
    });

    it('Test-05.2c: Debe permitir la reconexión aunque la partida ya haya finalizado, para que el jugador pueda ver el resultado', async () => {
        RoomManager.DISCONNECT_TIMEOUT_MS = 5000; // Tiempo de gracia amplio para que no expire durante la prueba

        const disconnectWarningPromise = new Promise<void>((resolve) => {
            clientSocket2.on(SocketEvents.OPPONENT_DISCONNECTED, () => resolve());
        });

        const oldSocketId = clientSocket1.id;
        clientSocket1.disconnect();
        await disconnectWarningPromise;

        // Mientras el jugador 1 está desconectado, la partida finaliza por una vía normal (no por el timeout de desconexión).
        const room = RoomManager.getRoomById(activeRoomId);
        room!.gameState.status = 'finished';
        room!.gameState.winner = client2Color;

        const newClientSocket1 = ioClient(`http://localhost:${server.port}`);

        const reconnectSuccessPromise = new Promise<void>((resolve, reject) => {
            newClientSocket1.on(SocketEvents.RECONNECT_SUCCESS, (data) => {
                try {
                    expect(data.gameState.status).toBe('finished');
                    expect(data.gameState.winner).toBe(client2Color);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });

        newClientSocket1.emit(SocketEvents.RECONNECT_ATTEMPT, {
            roomId: activeRoomId,
            originalSocketId: oldSocketId });

        await reconnectSuccessPromise;

        newClientSocket1.disconnect();
    });

    it('Test-05.2d: Debe restaurar el historial de chat al reconectar, incluyendo los mensajes enviados durante la desconexión', async () => {
        RoomManager.DISCONNECT_TIMEOUT_MS = 5000;

        const disconnectWarningPromise = new Promise<void>((resolve) => {
            clientSocket2.on(SocketEvents.OPPONENT_DISCONNECTED, () => resolve());
        });

        const oldSocketId = clientSocket1.id;
        clientSocket1.disconnect();
        await disconnectWarningPromise;

        // El jugador 2 envía un mensaje mientras el jugador 1 está desconectado.
        clientSocket2.emit(SocketEvents.SEND_MESSAGE, { message: 'Mensaje mientras estabas desconectado' });
        // Pequeña espera para asegurar que el servidor ha procesado el mensaje antes de reconectar.
        await new Promise((resolve) => setTimeout(resolve, 100));

        const newClientSocket1 = ioClient(`http://localhost:${server.port}`);

        const reconnectSuccessPromise = new Promise<void>((resolve, reject) => {
            newClientSocket1.on(SocketEvents.RECONNECT_SUCCESS, (data) => {
                try {
                    expect(data.chatHistory).toBeDefined();
                    expect(data.chatHistory.length).toBe(1);
                    expect(data.chatHistory[0].message).toBe('Mensaje mientras estabas desconectado');
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });

        newClientSocket1.emit(SocketEvents.RECONNECT_ATTEMPT, {
            roomId: activeRoomId,
            originalSocketId: oldSocketId });

        await reconnectSuccessPromise;

        newClientSocket1.disconnect();
    });

    it('Test-05.2e: Debe restaurar una oferta de empate pendiente al reconectar', async () => {
        RoomManager.DISCONNECT_TIMEOUT_MS = 5000;

        const disconnectWarningPromise = new Promise<void>((resolve) => {
            clientSocket2.on(SocketEvents.OPPONENT_DISCONNECTED, () => resolve());
        });

        const oldSocketId = clientSocket1.id;
        clientSocket1.disconnect();
        await disconnectWarningPromise;

        // El jugador 2 ofrece empate mientras el jugador 1 está desconectado.
        clientSocket2.emit(SocketEvents.OFFER_DRAW);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const newClientSocket1 = ioClient(`http://localhost:${server.port}`);

        const reconnectSuccessPromise = new Promise<void>((resolve, reject) => {
            newClientSocket1.on(SocketEvents.RECONNECT_SUCCESS, (data) => {
                try {
                    expect(data.drawOffered).toBe(true);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });

        newClientSocket1.emit(SocketEvents.RECONNECT_ATTEMPT, {
            roomId: activeRoomId,
            originalSocketId: oldSocketId });

        await reconnectSuccessPromise;

        newClientSocket1.disconnect();
    });

    it('Test-05.2f: Debe restaurar una oferta de revancha pendiente al reconectar', async () => {
        RoomManager.DISCONNECT_TIMEOUT_MS = 5000;

        // La revancha solo tiene sentido tras una partida finalizada. Con la partida ya finalizada,
        // el servidor no emite OPPONENT_DISCONNECTED al desconectarse (no hay periodo de gracia que
        // proteger), así que no hay que esperar ese evento.
        const room = RoomManager.getRoomById(activeRoomId);
        room!.gameState.status = 'finished';
        room!.gameState.winner = client1Color;

        const oldSocketId = clientSocket1.id;
        clientSocket1.disconnect();
        await new Promise((resolve) => setTimeout(resolve, 100));

        // El jugador 2 ofrece revancha mientras el jugador 1 está desconectado.
        clientSocket2.emit(SocketEvents.OFFER_REMATCH);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const newClientSocket1 = ioClient(`http://localhost:${server.port}`);

        const reconnectSuccessPromise = new Promise<void>((resolve, reject) => {
            newClientSocket1.on(SocketEvents.RECONNECT_SUCCESS, (data) => {
                try {
                    expect(data.rematchOffered).toBe(true);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });

        newClientSocket1.emit(SocketEvents.RECONNECT_ATTEMPT, {
            roomId: activeRoomId,
            originalSocketId: oldSocketId });

        await reconnectSuccessPromise;

        newClientSocket1.disconnect();
    });

    it('Test-05.3: Debe finalizar la partida y otorgar la victoria al oponente si el temporizador de juego llega a cero', async () => {
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

        // La sala se mantiene en memoria tras el agotamiento del tiempo para permitir una revancha (Sub-05.5),
        // igual que en el resto de finales de partida (rendición, empate).
        expect(RoomManager.getRoomById(activeRoomId)).toBeDefined();
        expect(RoomManager.roomExists(activeRoomId)).toBe(true);
    });
        
    it('Test-05.4a: Debe permitir a un jugador ofrecer empate y que el oponente lo rechace, continuando la partida', async () => {
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

    it('Test-05.4b: Debe permitir a un jugador ofrecer empate y que el oponente lo acepte, finalizando la partida en empate', async () => {
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

        // La sala se mantiene en memoria tras el empate para permitir una revancha (Sub-05.5); no se borra aquí.
        expect(RoomManager.getRoomById(activeRoomId)).toBeDefined();
        expect(RoomManager.roomExists(activeRoomId)).toBe(true);
    });

    it('Test-05.5a: Debe notificar el rechazo de una revancha y eliminar la sala', async () => {
                
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

    it('Test-05.5b: Debe permitir la aceptación de una revancha y reiniciar el juego', async () => {
        const gameStartPromise1 = new Promise<GameStartPayload>((resolve) => {
            clientSocket1.on(SocketEvents.GAME_START, (data) => resolve(data));
        });

        const gameStartPromise2 = new Promise<GameStartPayload>((resolve) => {
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


describe('FEAT-06: Gestión de la cola de emparejamiento', () => {
    let server: TestServer;

    let clientA: ClientSocket;
    let clientB: ClientSocket;

    beforeAll(async () => {
        server = await startTestServer();
    });

    afterAll(() => {
        stopTestServer(server);
    });

    beforeEach(async () => {
        [clientA, clientB] = await connectClients(server.port, 2);
    });

    afterEach(() => {
        clientA.disconnect();
        clientB.disconnect();
    });

    it('Test-06.1: Debe colocar al jugador en la cola y emitir QUEUE_JOINED si está vacía', () => {
        return new Promise<void>((resolve) => {
            clientA.on(SocketEvents.QUEUE_JOINED, () => {
                resolve();
            });

            clientA.emit(SocketEvents.JOIN_QUEUE, { mode: 'casual'});
        });
    });

    it('Test-06.2: Debe emparejar a dos jugadores en el mismo modo y emitir MATCH_FOUND y GAME_START a ambos', () => {
        return new Promise<void>((resolve) => {
            let matchesFound = 0;
            let expectedRoomId = '';
            

            const handleMatchFound = (payload: MatchFoundPayload) => {
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

            const handleGameStart = (payload: GameStartPayload) => {
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

            clientA.once(SocketEvents.QUEUE_JOINED, () => {
                clientB.emit(SocketEvents.JOIN_QUEUE, { mode: 'normal' });
            });
            clientA.emit(SocketEvents.JOIN_QUEUE, { mode: 'normal' });  
        })
    });

    it('Test-06.3: No debe emparejar a jugadores de diferentes modos', () => {
        return new Promise<void>((resolve, reject) => {
            const failTest = () => reject(new Error('Se emparejaron jugadores de diferentes modos.'));
            clientA.on(SocketEvents.MATCH_FOUND, failTest);
            clientB.on(SocketEvents.MATCH_FOUND, failTest);

            clientA.once(SocketEvents.QUEUE_JOINED, () => {
                clientB.emit(SocketEvents.JOIN_QUEUE, { mode: 'normal' });
            });
           
            clientB.once(SocketEvents.QUEUE_JOINED, () => {
                setTimeout(resolve, 300);
            });

            clientA.emit(SocketEvents.JOIN_QUEUE, { mode: 'casual' });
           
        });
    });

    it('Test-06.4: Debe permitir a un jugador abandonar la cola y emitir QUEUE_LEFT', () => {
        return new Promise<void>((resolve, reject) => {
            clientB.on(SocketEvents.MATCH_FOUND, () => {
                reject(new Error('Jugador B se emparejó con Jugador A a pesar de que A abandonó la cola.'));
            });

            clientA.on(SocketEvents.QUEUE_JOINED, () => {
                clientA.emit(SocketEvents.LEAVE_QUEUE);
            });

            clientA.on(SocketEvents.QUEUE_LEFT, () => {
                clientB.once(SocketEvents.QUEUE_JOINED, () => resolve());
                clientB.emit(SocketEvents.JOIN_QUEUE, { mode: 'fast' });
            });

            clientA.emit(SocketEvents.JOIN_QUEUE, { mode: 'fast' });
        });
    });

    it('Test-06.5: Debe limpiar la cola si un jugador se desconecta mientras está en ella', () => {
        return new Promise<void>((resolve, reject) => {
            
            clientB.on(SocketEvents.MATCH_FOUND, () => {
                reject(new Error('Jugador B se emparejó con Jugador A a pesar de que A se desconectó.'));
            });

            clientA.on(SocketEvents.QUEUE_JOINED, () => {
                clientA.disconnect();

                setTimeout(() =>  {
                    clientB.once(SocketEvents.QUEUE_JOINED, () => resolve());
                    clientB.emit(SocketEvents.JOIN_QUEUE, { mode: 'normal' });
                }, 100);
            });

            clientA.emit(SocketEvents.JOIN_QUEUE, { mode: 'normal' });
        });
    });

});


describe('FEAT-07: Comunicación en tiempo real mediante chat', () => {
    let server: TestServer;

    let clientSocket1: ClientSocket;
    let clientSocket2: ClientSocket;
    let activeRoomId: string;

    beforeAll(async () => {
        server = await startTestServer();
    });

    afterAll(() => {
        stopTestServer(server);
    });

    beforeEach(async () => {
        RoomManager.clearActiveRooms();

        [clientSocket1, clientSocket2] = await connectClients(server.port, 2);

        //Creamos una sala y unimos ambos jugadores antes de cada test
        await new Promise<void>((resolve) => {
            clientSocket1.on(SocketEvents.ROOM_CREATED, (data) => {
                clientSocket2.emit(SocketEvents.JOIN_ROOM, { roomCode: data.roomCode, guestName: 'Player2' });
            });

            clientSocket1.on(SocketEvents.GAME_START, (data) => {
                activeRoomId = data.gameState.roomId;
                resolve();
            });

            clientSocket1.emit(SocketEvents.CREATE_ROOM, { hostName: 'Player1' });
        });
    });

    afterEach(() => {
        clientSocket1.disconnect();
        clientSocket2.disconnect();
    });

    it('Test-07.1: Debe propagar el mensaje del jugador a todos los jugadores de la sala', (done: (error?: unknown) => void) => {
        const testMessage = "¡Hola, oponente!";

        clientSocket2.on(SocketEvents.CHAT_UPDATE, (message: ChatMessage) => {
            try {
                expect(message.message).toBe(testMessage);

                expect(message.socketId).toBe(clientSocket1.id);
                expect(message.name).toBe('Player1');
                expect(message.timestamp).toBeDefined();
                expect(typeof message.timestamp).toBe('number');

                done();
            } catch (error) {
                done(error);
            }
        });

        clientSocket1.emit(SocketEvents.SEND_MESSAGE, { message: testMessage });
    });

    it('Test-07.2: Debe mantener un historial de chat limitado a 50 mensajes por sala', (done: (error?: unknown) => void) => {
        const totalMessages = 55;
        const maxMessages = 50;
        let receivedCount = 0;

        clientSocket2.on(SocketEvents.CHAT_UPDATE, () => {
            receivedCount++;

            if (receivedCount === totalMessages) {
                try {
                    const room = RoomManager.getRoomById(activeRoomId);
                    expect(room).toBeDefined();
                    expect(room!.chatHistory.length).toBe(maxMessages);
                    expect(room!.chatHistory[0].message).toBe(`Mensaje ${totalMessages - maxMessages + 1}`);   
                    expect(room!.chatHistory[maxMessages - 1].message).toBe(`Mensaje ${totalMessages}`);
                    done();
                } catch (error) {
                    done(error);
                }
            }
        });

        for (let i = 0; i < totalMessages; i++) {
            clientSocket1.emit(SocketEvents.SEND_MESSAGE, { message: `Mensaje ${i + 1}` });
        }
    });
});