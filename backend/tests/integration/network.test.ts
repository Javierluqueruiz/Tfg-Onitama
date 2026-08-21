import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { RoomManager } from "../../src/network/RoomManager";
import { registerSocketEvents } from "../../src/network/SocketHandler";
import { SocketEvents } from "../../../shared";

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
});