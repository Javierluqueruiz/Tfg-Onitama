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
import { SocketEvents, type EloUpdate } from '../../../shared';
import type { AddressInfo } from 'net';
import { RoomManager } from '../../src/network/RoomManager';

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

        // Prepara una partida en curso entre dos jugadores; sin token, el jugador es invitado.
    const startGame = async (hostToken?: string, guestToken?: string) => {
        const connect = (token?: string) => ioClient(
            `http://localhost:${port}`,
            token ? { extraHeaders: { Cookie: `token=${token}` } } : {}
        );
        hostSocket = connect(hostToken);
        guestSocket = connect(guestToken);
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
            guestSocket.emit(SocketEvents.JOIN_ROOM, { roomCode, guestName: 'GuestPlayer' });
        });
    };

    const nextEloUpdate = (socket: ClientSocket) =>
        new Promise<EloUpdate>((resolve) => socket.once(SocketEvents.ELO_UPDATED, resolve));

    it('envía a cada cuenta su variación de ELO cuando termina de guardarse el resultado (Sub-11.3)', async () => {
        const hostUser = await User.create({ username: 'HostPlayer', email: 'host@example.com', passwordHash: 'hashedpassword'});
        const guestUser = await User.create({ username: 'GuestPlayer', email: 'guest@example.com', passwordHash: 'hashedpassword'});
        await startGame(AuthService.signToken(hostUser), AuthService.signToken(guestUser));
        const hostUpdate = nextEloUpdate(hostSocket);
        const guestUpdate = nextEloUpdate(guestSocket);

        hostSocket.emit(SocketEvents.SURRENDER);

        expect(await hostUpdate).toEqual({ ranked: true, eloChange: -16, newElo: 984 });
        expect(await guestUpdate).toEqual({ ranked: true, eloChange: 16, newElo: 1016 });
    });

    it('a una cuenta y a su rival invitado les comunica que la partida no puntúa (Sub-11.3)', async () => {
        const hostUser = await User.create({ username: 'HostPlayer', email: 'host@example.com', passwordHash: 'hashedpassword' });
        await startGame(AuthService.signToken(hostUser), undefined);
        const hostUpdate = nextEloUpdate(hostSocket);
        const guestUpdate = nextEloUpdate(guestSocket);

        hostSocket.emit(SocketEvents.SURRENDER);

        expect(await hostUpdate).toEqual({ ranked: false });
        expect(await guestUpdate).toEqual({ ranked: false });
    });

    it('rechaza que una cuenta se una a su propia sala desde otra conexión, y no empieza la partida', async () => {
        const user = await User.create({ username: 'Player', email: 'player@example.com', passwordHash: 'hashedpassword' });
        const token = AuthService.signToken(user);
        const connect = () => ioClient(`http://localhost:${port}`, { extraHeaders: { Cookie: `token=${token}` } });
        hostSocket = connect();
        guestSocket = connect();

        await Promise.all([
            new Promise<void>((resolve) => hostSocket.on('connect', () => resolve())),
            new Promise<void>((resolve) => guestSocket.on('connect', () => resolve())),
        ]);

        const { roomCode } = await new Promise<{ roomCode: string }>((resolve) => {
            hostSocket.on(SocketEvents.ROOM_CREATED, (data) => resolve(data));
            hostSocket.emit(SocketEvents.CREATE_ROOM, { hostName: 'Player', mode: 'casual' });
        });

        const error = await new Promise<{ message: string }>((resolve) => {
            guestSocket.on(SocketEvents.ERROR, resolve);
            guestSocket.emit(SocketEvents.JOIN_ROOM, { roomCode, guestName: 'Player' });
        });

        expect(error.message).toBe('No puedes unirte a tu propia sala.');
        const room = RoomManager.getRoomByCode(roomCode);
        expect([room?.players.red, room?.players.blue].filter(Boolean).length).toBe(1);
    });
    
});