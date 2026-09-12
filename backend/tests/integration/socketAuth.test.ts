import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Server } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { createServer, Server as HttpServer } from 'http';
import { registerSocketEvents } from '../../src/network/SocketHandler';
import { registerSocketAuth } from '../../src/network/socketAuth';
import type { AddressInfo } from 'net';
import { User } from '../../src/auth/User.model';
import { AuthService } from '../../src/auth/authService';

describe('Vínculo de la sesión de socket con la cuenta autenticada', () => {
    let mongoServer: MongoMemoryServer; 
    let httpServer: HttpServer;
    let io: Server;
    let port: number;
    let clientSocket: ClientSocket;

    beforeAll(async ()=> {
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
        io.close();
        httpServer.close();
        await mongoose.disconnect();
        await mongoServer.stop();
    }); 

    beforeEach(async () => {
        await User.deleteMany({});
    });

    afterEach(() => {
        if (clientSocket && clientSocket.connected) {
            clientSocket.disconnect();
        }
    });

    it('Debería vincular la sesión de socket con la cuenta autenticada si el token es válido', async () => {
        const user = await User.create({
            username: 'testuser',
            email: 'testuser@example.com',
            passwordHash: 'hashedpassword'});
        const token = AuthService.signToken(user);

        clientSocket = ioClient(`http://localhost:${port}`, {
            extraHeaders: { Cookie: `token=${token}` },
        });

        await new Promise<void>((resolve) => clientSocket.on('connect', () => resolve()));

        const serverSocket = io.sockets.sockets.get(clientSocket.id!);
        expect(serverSocket?.data.userId).toBe(user._id.toString());
    });

    it('no rechaza la conexión ni vincula un usuario si no hay cookie', async () => {
        clientSocket = ioClient(`http://localhost:${port}`);

        await new Promise<void>((resolve) => clientSocket.on('connect', () => resolve()));

        const serverSocket = io.sockets.sockets.get(clientSocket.id!);
        expect(serverSocket).toBeDefined();
        expect(serverSocket?.data.userId).toBeUndefined();
    });

    it('no rechaza la conexión y trata como invitado si el token es inválido', async () => {
        clientSocket = ioClient(`http://localhost:${port}`, {
            extraHeaders: { Cookie: `token=invalidtoken` },
        });

        await new Promise<void>((resolve) => clientSocket.on('connect', () => resolve()));

        const serverSocket = io.sockets.sockets.get(clientSocket.id!);
        expect(serverSocket).toBeDefined();
        expect(serverSocket?.data.userId).toBeUndefined();
    });
});