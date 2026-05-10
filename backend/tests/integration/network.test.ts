import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { RoomManager } from "../../src/network/RoomManager";
import { registerSocketEvents } from "../../src/network/SocketHandler";
import { SocketEvents } from "../../../shared/types";

import { Server } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { createServer } from 'http';

describe('FEAT-03: Gestión de Salas Privadas (WebSockets', () => {
    let io: Server;
    let serverSocket: any;
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
    it('Sub-03.1: Debe crear una sala privada y devolver el ID de la sala', () => {
        return new Promise<void>((resolve) => {
            clientSocket1.on(SocketEvents.ROOM_CREATED, (data) => {
                expect(data.roomId).toBeDefined();
                expect(typeof data.roomId).toBe('string');
                expect(RoomManager.roomExists(data.roomId)).toBe(true);
                resolve();
            });

            clientSocket1.emit(SocketEvents.CREATE_ROOM, 'Player1');
        });
    });

    it("Sub-03.2 y Sub-03.3: Debe permitir a un segundo jugador unirse a la sala privada y comenzar el juego", () => {
        console.log("Sub-03.2 y Sub-03.3: Creando sala con Player1 y uniendo Player2...");
        return new Promise<void>((resolve) => {
            clientSocket1.emit(SocketEvents.CREATE_ROOM, 'Player1');

            clientSocket1.on(SocketEvents.ROOM_CREATED, (data) => {
                clientSocket2.emit(SocketEvents.JOIN_ROOM, { roomId: data.roomId, playerName: 'Player2' });
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
                expect(error.message).toBe('La sala no existe.');
                resolve();
            });

            clientSocket2.emit(SocketEvents.JOIN_ROOM, { roomId: 'nonexistent-room', playerName: 'Player2'});
        });
    });

    it("Sub-03.3: Debe rechazar la conexión si la sala está llena", () => {
        return new Promise<void>((resolve) => {

            clientSocket1.emit(SocketEvents.CREATE_ROOM, 'Player1');

            clientSocket1.on(SocketEvents.ROOM_CREATED, (data) => {
                const roomId = data.roomId;

                clientSocket2.emit(SocketEvents.JOIN_ROOM, { roomId: data.roomId, playerName: 'Player2' });
                clientSocket2.on(SocketEvents.GAME_START, () => {
                    const clientSocket3 = ioClient(`http://localhost:${port}`);

                    clientSocket3.on('connect', () => {
                        clientSocket3.emit(SocketEvents.JOIN_ROOM, { roomId, playerName: 'Player3' });
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