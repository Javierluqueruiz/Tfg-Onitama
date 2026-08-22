import express from 'express';
import http from 'http';
import { Server } from 'socket.io'
import { registerSocketEvents } from './network/SocketHandler';

const app = express();
//app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        //origin: "http://localhost:5173",
        origin: "*",
        methods: ["GET", "POST"]
    },
    
    // Sub-05.2: Configuración de ping para detectar desconexiones
    pingInterval: 10000,
    pingTimeout: 5000,
})

registerSocketEvents(io);

server.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000');
})

