import { Board } from "../../shared/types";
import { GameEngine } from "./game/GameEngine";

const formatBoardForConsole = (board: Board) => {
    return board.map(row => 
        row.map(piece => {
            if (!piece) {
                return "";
            }

            const color = piece.color === 'red' ? 'R' : 'A';
            const type = piece.type === 'master' ? 'M' : 'E';

            return `[${color}-${type}]`;
        })
    );
};


console.log("=== Simulación de Juego ===");
let state = GameEngine.createNewGame("room1");

console.log("Turno inicial:", state.currentTurn);
console.log("Cartas en mano del jugador rojo:", state.cards.red.map(c => c.name));
console.log("Cartas en mano del jugador azul:", state.cards.blue.map(c => c.name));

console.table(formatBoardForConsole(state.board));

console.log("Ejecutando movimiento simulado");
console.log("Carta utilizada:", state.currentTurn === 'red' ? state.cards.red[0].name : state.cards.blue[0].name);
if (state.currentTurn === 'red') {
    state = GameEngine.processTurn(state, { x: 2, y: 0 }, { x: 2, y: 1 }, state.cards.red[0].name);
} else {
    state = GameEngine.processTurn(state, { x: 2, y: 4 }, { x: 2, y: 3 }, state.cards.blue[0].name);
}
console.table(formatBoardForConsole(state.board));
console.log("Turno después del movimiento:", state.currentTurn);
