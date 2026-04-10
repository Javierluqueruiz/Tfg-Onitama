import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server, Socket } from 'socket.io'
import { GameEngine } from './game/GameEngine';
import { MovementManager } from './game/MovementManager';

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
} as any);

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

const gameState = GameEngine.createNewGame('room1');
//console.log("Estado inicial del juego:");
//console.log(JSON.stringify(gameState, null, 2));

console.log("\n=== TABLERO INICIAL ===");
console.table(gameState.board);

console.log("\n=== EJECUTANDO MOVIMIENTOS DE PRUEBA ===");
console.log("Moviendo la pieza de la esquina superior izquierda (0,0) a la casilla inferior (0,1)");

const newBoard = MovementManager.movePiece(gameState.board, { x: 0, y: 0 }, { x: 0, y: 2 });

console.log("\n=== TABLERO DESPUÉS DEL MOVIMIENTO ===");
console.table(newBoard);

//console.log("\n=== VERIFICANDO QUE EL TABLERO ORIGINAL NO SE MODIFICÓ ===");
//console.log("\n=== TABLERO ORIGINAL ===");
//console.table(gameState.board);