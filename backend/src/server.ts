import http from 'http';
import { Server } from 'socket.io'
import { registerSocketEvents } from './network/SocketHandler';
import { registerSocketAuth } from './network/socketAuth';
import { connectDB } from './config/db';
import { env } from './config/env';
import { app } from './app';
import { getAllowedOrigins } from './config/corsOrigin';
import './network/socketData';

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: getAllowedOrigins(),
        credentials: true,
        methods: ["GET", "POST"]
    },
    
    // Sub-05.2: Configuración de ping para detectar desconexiones
    pingInterval: 10000,
    pingTimeout: 5000,
})

registerSocketEvents(io);
registerSocketAuth(io);

connectDB().then(() => {
    server.listen(env.port, () => {
        console.log(`Servidor escuchando en el puerto ${env.port}`);
    });
})
