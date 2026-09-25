import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Server } from 'socket.io';
import { createServer, Server as HttpServer } from 'http';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import type { AddressInfo } from 'net';
import { registerSocketEvents } from '../../src/network/SocketHandler';
import { RoomManager } from '../../src/network/RoomManager';
import { MAX_CHAT_MESSAGE_LENGTH, SocketEvents } from '../../../shared/index';

const GARBAGE_PAYLOADS: unknown[] = [undefined, null, 'hola', 33, {}, [], true];

describe('Validación de los payloads de los eventos', () => {
    let io: Server;
    let httpServer: HttpServer;
    let client: ClientSocket;
    let port: number;
    const unhandled: unknown[] = [];
    const recordUnhandled = (error: unknown) => { unhandled.push(error); };

    beforeAll(async () => {
        httpServer = createServer();
        io = new Server(httpServer);
        registerSocketEvents(io);
        port = await new Promise<number>((resolve) => httpServer.listen(() => resolve((httpServer.address() as AddressInfo).port)));
        process.on('unhandledRejection', recordUnhandled);
        process.on('uncaughtException', recordUnhandled);
    });

    afterAll(async () => {
        process.off('unhandledRejection', recordUnhandled);
        process.off('uncaughtException', recordUnhandled);
        io.close();
        httpServer.close();
    });

    beforeEach(async () => {
        RoomManager.clearActiveRooms();
        unhandled.length = 0;
        client = ioClient(`http://localhost:${port}`);
        await new Promise<void>((resolve) => client.on('connect', () => resolve()));
    });

    afterEach(() => {
        client.disconnect();
    });

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const createAiRoom = () => new Promise<void>((resolve) => {
        client.once(SocketEvents.GAME_START, () => resolve());
        client.emit(SocketEvents.CREATE_AI_ROOM, { engine: 'heuristic', difficulty: 'hard' });
    });

    const nextError = () => new Promise<{ message: string }>((resolve) => client.once(SocketEvents.ERROR, resolve));

    describe.each([{ state: 'sin sala', inRoom: false }, { state: 'dentro de una sala de IA', inRoom: true }])('Estando $state', ({ inRoom }) => {
        it.each(Object.values(SocketEvents))('El evento %s no debe tumbar el servidor con payloads basura', async (event) => {
            if (inRoom) await createAiRoom();

            for (const payload of GARBAGE_PAYLOADS) {
                if (payload === undefined) client.emit(event); else client.emit(event, payload);
            }

            await new Promise<void>((resolve) => { client.once(SocketEvents.PONG, () => resolve()); client.emit(SocketEvents.PING, Date.now()); });
            await sleep(40);

            expect(unhandled).toEqual([]);
            if (!inRoom) expect(RoomManager.getActiveRooms().size).toBe(0); 
        });

        it.each([
            { event: SocketEvents.CREATE_ROOM, payload: { hostName: '    ', mode: 'casual' }, message: 'Datos de creación de sala inválidos.' },
            { event: SocketEvents.CREATE_ROOM, payload: { hostName: 'Player1', mode: 'invalid_mode' }, message: 'Datos de creación de sala inválidos.' },
            { event: SocketEvents.CREATE_ROOM, payload: { hostName: 'Player1' }, message: 'Datos de creación de sala inválidos.' },
            { event: SocketEvents.JOIN_ROOM, payload: { roomCode: 'ABCDE' }, message: 'Datos de unión a la sala inválidos.' },
            { event: SocketEvents.JOIN_ROOM, payload: { roomCode: 'ABCDE', guestName: '   ' }, message: 'Datos de unión a la sala inválidos.' },
            { event: SocketEvents.JOIN_QUEUE, payload: { mode: 'invalid_mode' }, message: 'Datos de unión a la cola inválidos.' },
            { event: SocketEvents.SEND_MESSAGE, payload: { message: '   ' }, message: 'Datos de mensaje de chat inválidos.' },
            { event: SocketEvents.SEND_MESSAGE, payload: { message: 'a'.repeat(MAX_CHAT_MESSAGE_LENGTH + 1) }, message: 'Datos de mensaje de chat inválidos.' }
        ])('Debe responder con un error a $event con $payload', async ({ event, payload, message }) => {
            const errorPromise = nextError();
            client.emit(event, payload);

            expect((await errorPromise).message).toBe(message);
            expect(RoomManager.getActiveRooms().size).toBe(0);
        });

        it('Debe aceptar un mensaje de chat del tamaño máximo permitido', async () => {
            await createAiRoom();
            const chatUpdate = new Promise<{ message: string }>((resolve) => client.once(SocketEvents.CHAT_UPDATE, resolve));
            const message = 'a'.repeat(MAX_CHAT_MESSAGE_LENGTH);

            client.emit(SocketEvents.SEND_MESSAGE, { message });
            expect((await chatUpdate).message).toBe(message);
        });
    });
});