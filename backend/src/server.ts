import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server, Socket } from 'socket.io'
import { GameEngine } from './game/GameEngine';
import { MovementManager } from './game/MovementManager';
import { DeckManager } from './game/DeckManager';

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
/*
console.log("\n=== TABLERO INICIAL ===");
console.table(gameState.board);

console.log("\n=== EJECUTANDO MOVIMIENTOS DE PRUEBA ===");
console.log("Moviendo la pieza de la esquina superior izquierda (0,0) a la casilla inferior (0,1)");

const movement1 = MovementManager.movePiece(gameState.board, { x: 0, y: 0 }, { x: 0, y: 2 });

console.log("\n=== TABLERO DESPUÉS DEL MOVIMIENTO ===");
console.table(movement1 .newBoard);

const movement2 = MovementManager.movePiece(movement1.newBoard, { x: 0, y: 4 }, { x: 0, y: 2 });

console.log("\n=== TABLERO DESPUÉS DEL SEGUNDO MOVIMIENTO ===");
console.table(movement2.newBoard);
console.log(`Pieza capturada en el segundo movimiento: ${movement2.capturedPiece ? movement2.capturedPiece.type + ' (' + movement2.capturedPiece.color + ')' : 'Ninguna'}`);


//console.log("\n=== VERIFICANDO QUE EL TABLERO ORIGINAL NO SE MODIFICÓ ===");
//console.log("\n=== TABLERO ORIGINAL ===");
//console.table(gameState.board);*/

console.log("\n\n===ROTACIÓN DE LA CARTA NEUTRAL===")
    console.log(`Cartas iniciales : Jugador Rojo: ${gameState.cards.red.map(c =>c .name)},
        Jugador Azul: ${gameState.cards.blue.map(c=>c.name)}, 
        Carta Neutra: ${gameState.cards.neutral.name}`)

console.log(`\nEl Jugador Rojo juega su primera carta, ${gameState.cards.red[1].name}`)
const newCards = DeckManager.playCard(gameState.cards, 'red', gameState.cards.red[1].name);
console.log(`Cartas iniciales : Jugador Rojo: ${newCards.red.map(c =>c .name)},
        Jugador Azul: ${newCards.blue.map(c=>c.name)}, 
        Carta Neutra: ${newCards.neutral.name}`)
