import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { createServer, Server as HttpServer } from 'http';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { registerSocketEvents } from '../../src/network/SocketHandler';
import { registerSocketAuth } from '../../src/network/socketAuth';
import { MatchmakingService } from '../../src/network/MatchmakingService';
import { RoomManager } from '../../src/network/RoomManager';
import { User } from '../../src/auth/User.model';
import { AuthService } from '../../src/auth/authService';
import { SocketEvents } from '../../../shared';
import type { AddressInfo } from 'net';

describe('Matchmaking: segregación y tolerancia de ELO (Sub-09.2)', () => {
    let mongoServer: MongoMemoryServer;
    let httpServer: HttpServer;
    let io: Server;
    let port: number;
    let sockets: ClientSocket[] = [];

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());

        httpServer = createServer();
        io = new Server(httpServer);
        registerSocketAuth(io);
        registerSocketEvents(io);

        port = await new Promise<number>((resolve) => {
            httpServer.listen(0, () => resolve((httpServer.address() as AddressInfo).port));
        });
    }, 60000);

    afterAll(async () => {
        MatchmakingService.stopMatchmakingLoop();
        io.close();
        httpServer.close();
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        await User.deleteMany({});
        RoomManager.clearActiveRooms();
    });

    afterEach(() => {
        sockets.forEach(socket => socket.disconnect());
        sockets = [];
    });

    const connect = (cookie?: string): Promise<ClientSocket> => {
        const socket = ioClient(`http://localhost:${port}`, cookie ? { extraHeaders: { Cookie: cookie } } : {});
        sockets.push(socket);
        return new Promise((resolve) => socket.on('connect', () => resolve(socket)));
    };

    it('Empareja a dos jugadores registrados entre sí y a dos jugadores invitados entre sí, pero nunca un registrado con un invitado', async () => {
        const userA = await User.create({ username: 'userA', email: 'userA@example.com', passwordHash: 'passwordA'});
        const userB = await User.create({ username: 'userB', email: 'userB@example.com', passwordHash: 'passwordB'});
        const tokenA = AuthService.signToken(userA);
        const tokenB = AuthService.signToken(userB);

        const [guest1, guest2, registered1, registered2] = await Promise.all([
            connect(),
            connect(),
            connect(`token=${tokenA}`),
            connect(`token=${tokenB}`)
        ]);

        const matchFound = (socket: ClientSocket) => 
            new Promise<{ roomId: string, roomCode: string }>((resolve) => {
                socket.on(SocketEvents.MATCH_FOUND, (data) => resolve(data));
            });

        const guest1Match = matchFound(guest1);
        const guest2Match = matchFound(guest2);
        const registered1Match = matchFound(registered1);
        const registered2Match = matchFound(registered2);

        guest1.emit(SocketEvents.JOIN_QUEUE, { mode: 'casual' });
        registered1.emit(SocketEvents.JOIN_QUEUE, { mode: 'casual' });
        guest2.emit(SocketEvents.JOIN_QUEUE, { mode: 'casual' });
        registered2.emit(SocketEvents.JOIN_QUEUE, { mode: 'casual' });

        const [guest1Result, guest2Result, registered1Result, registered2Result] = await Promise.all([guest1Match, guest2Match, registered1Match, registered2Match]);

        expect(guest1Result.roomId).toBe(guest2Result.roomId);
        expect(registered1Result.roomId).toBe(registered2Result.roomId);
        expect(guest1Result.roomId).not.toBe(registered1Result.roomId);
    });

    it('Dos jugadores registrados con ELOs diferentes acaban emparejándose solos cuando el barrido periódico aumenta la tolerancia de ELO', async () => {
        const userLow = await User.create({ username: 'userLow', email: 'userLow@example.com', passwordHash: 'passwordLow', elo: 1000 });
        const userHigh = await User.create({ username: 'userHigh', email: 'userHigh@example.com', passwordHash: 'passwordHigh', elo: 1130 });

        const tokenLow = AuthService.signToken(userLow);
        const tokenHigh = AuthService.signToken(userHigh);

        const [lowSocket, highSocket] = await Promise.all([
            connect(`token=${tokenLow}`),
            connect(`token=${tokenHigh}`)
        ]);

        const queueJoinedLow = new Promise<void>((resolve) => 
            lowSocket.on(SocketEvents.QUEUE_JOINED, () => resolve()));

        const queueJoinedHigh = new Promise<void>((resolve) => 
            highSocket.on(SocketEvents.QUEUE_JOINED, () => resolve()));

        lowSocket.emit(SocketEvents.JOIN_QUEUE, { mode: 'casual' });
        highSocket.emit(SocketEvents.JOIN_QUEUE, { mode: 'casual' });

        await Promise.all([queueJoinedLow, queueJoinedHigh]);

        const matchFoundLow = new Promise<{ roomId: string }>((resolve) => 
        lowSocket.on(SocketEvents.MATCH_FOUND, resolve));
        const matchFoundHigh = new Promise<{ roomId: string }>((resolve) => 
        highSocket.on(SocketEvents.MATCH_FOUND, resolve));

        const [low, high] = await Promise.all([matchFoundLow, matchFoundHigh]);
        
        expect(low.roomId).toBe(high.roomId);
    }, 8000);
});