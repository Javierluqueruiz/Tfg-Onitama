import { describe, it, expect, vi, afterEach, beforeEach, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { createServer, Server as HttpServer } from 'http';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { registerSocketEvents } from '../../src/network/SocketHandler';
import { registerSocketAuth } from '../../src/network/socketAuth';
import { User } from '../../src/auth/User.model';
import { AuthService } from '../../src/auth/authService';
import { SocketEvents } from '../../../shared';
import type { AddressInfo } from 'net';

describe('Persistencia del resultado de la partida (Sub-09.1)', () => {
    let mongoServer: MongoMemoryServer;
    let httpServer: HttpServer;
    let io: Server;
    let port: number;
    let hostSocket: ClientSocket;
    let guestSocket: ClientSocket;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());

        httpServer = createServer();
        io = new Server(httpServer);
        registerSocketEvents(io); 
        registerSocketAuth(io);

        port = await new Promise<number>((resolve) => {
            httpServer.listen(0, () => resolve((httpServer.address() as AddressInfo).port));
        });
    }, 60000);

    afterAll(async () => {
        io.close();
        httpServer.close();
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach( async () => {
        await User.deleteMany({});
    });

    afterEach(() => {
        hostSocket?.disconnect();
        guestSocket?.disconnect();
    });

    it('actualiza el ELO y las estadísticas de los jugadores cuando la partida termina', async () => {
        const hostUser = await User.create({ username: 'HostPlayer', email: 'host@example.com', passwordHash: 'hashedpassword'});
        const guestUser = await User.create({ username: 'GuestPlayer', email: 'guest@example.com', passwordHash: 'hashedpassword'});

        const hostToken = AuthService.signToken(hostUser);
        const guestToken = AuthService.signToken(guestUser);

        hostSocket = ioClient(`http://localhost:${port}`, { extraHeaders: { Cookie: `token=${hostToken}` } });
        guestSocket = ioClient(`http://localhost:${port}`, { extraHeaders: { Cookie: `token=${guestToken}` } });

        await Promise.all([
            new Promise<void>((resolve) => hostSocket.on('connect', () => resolve())),
            new Promise<void>((resolve) => guestSocket.on('connect', () => resolve())),
        ]);

        const { roomCode } = await new Promise<{ roomCode: string }>((resolve) => {
            hostSocket.on(SocketEvents.ROOM_CREATED, (data) => resolve(data));
            hostSocket.emit(SocketEvents.CREATE_ROOM, { hostName: 'HostPlayer', mode: 'casual' });  
        });

        await new Promise<void>((resolve) => {
            guestSocket.on(SocketEvents.GAME_START, () => resolve());
            guestSocket.emit(SocketEvents.JOIN_ROOM, {roomCode, guestName: 'GuestPlayer'});
        });

        await new Promise<void>((resolve) => {
            guestSocket.on(SocketEvents.GAME_UPDATE, (payload: { gameState: { status: string}}) => {
                if (payload.gameState.status === 'finished') resolve();
            });
            hostSocket.emit(SocketEvents.SURRENDER);
        });

        await vi.waitFor(async () => {
            const updatedHostUser = await User.findById(hostUser._id);
            expect(updatedHostUser?.gamesPlayed).toBe(1);
        });

        const finalHost = await User.findById(hostUser._id);
        const finalGuest = await User.findById(guestUser._id);

        expect(finalHost?.losses).toBe(1);
        expect(finalHost!.elo).toBeLessThan(1000);
        expect(finalGuest?.wins).toBe(1);
        expect(finalGuest!.elo).toBeGreaterThan(1000);
    });

});