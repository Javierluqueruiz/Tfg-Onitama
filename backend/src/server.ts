import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server, Socket } from 'socket.io'
import type { Board } from '../../shared/types';
import { BoardGenerator } from './game/BoardGenerator';

import { DeckManager } from './game/DeckManager';

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

/*io.on('connection', (socket: Socket) => {
    console.log(`Nuevo jugador conectado. ID de sesión: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`Jugador desconectado: ${socket.id}`);
    });

    socket.on('PLAYER_MOVE', (move: PlayerMoveAction) => {
        console.log(`\nMovimiento recibido en la sala: ${move.roomId}`);
        console.log(`Jugador: ${move.player}`);
        console.log(`Mueve desde (${move.from.x}, ${move.from.y}) hasta (${move.to.x}, ${move.to.y})`);
        console.log(`Carta usada: ${move.cardUsed}`);
    })
});
*/
const PORT = 3000;
server.listen(PORT, () =>{
    console.log(`Motor de Onitama rodando en http://localhost:${PORT}`);
});

console.log("\n====== NUEVA PARTIDA INICIADA ====\n");

const board = BoardGenerator.createInitialBoard();
const deckResult = DeckManager.drawInitialCards();


console.log('FEAT-01: Tablero')
console.table(board);

console.log('FEAT-02: Cartas iniciales');
console.log('Cartas del jugador rojo:', deckResult.cards.red.map(c=> c.name));
console.log('Cartas del jugador azul:', deckResult.cards.blue.map(c=> c.name));
console.log('Carta neutral:', deckResult.cards.neutral.name, `(color: ${deckResult.cards.neutral.color})`);

console.log('TURNO INICIAL')
console.log('Jugador que inicia:', deckResult.firstTurn);
