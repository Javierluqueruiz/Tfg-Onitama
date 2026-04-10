import { describe, it, expect } from "vitest";
import { MovementManager } from "./MovementManager";
import { GameEngine } from "./GameEngine";

describe('FEAT-03: MovementManager', () => {

    it('Debe mover una pieza a la posición destino y dejar la posición origen vacía', () => {
        const initialBoard = GameEngine.createNewGame('testRoom').board;
        const from = { x: 0, y: 0 }; //Posición inicial de una pieza roja
        const to = { x: 0, y: 1 }; //Posición destino vacía
        
        const newBoard = MovementManager.movePiece(initialBoard, from, to);

        expect(newBoard[to.y][to.x]).toEqual(initialBoard[from.y][from.x]); //La pieza se mueve a la nueva posición
        expect(newBoard[from.y][from.x]).toBeNull(); //La posición original queda vacía
    });

    it('Debe lanzar un error si no hay pieza en la posición de origen', () => {
        const initialBoard = GameEngine.createNewGame('testRoom').board;
        const from = { x: 2, y: 2 }; //Posición vacía
        const to = { x: 2, y: 3 }; //Posición destino vacía
        expect(() => MovementManager.movePiece(initialBoard, from, to)).toThrowError(`[FEAT-03] No hay pieza en la posición de origen (${from.x}, ${from.y})`);
    });

    it('Debe retornar un nuevo tablero sin modificar el original', () => {
        const initialBoard = GameEngine.createNewGame('testRoom').board;
        const from = { x: 0, y: 0 };
        const to = { x: 0, y: 1 };

        const newBoard = MovementManager.movePiece(initialBoard, from, to);
        //El tablero original no debe modificarse
        expect(initialBoard[from.y][from.x]).not.toBeNull();
        expect(initialBoard[to.y][to.x]).toBeNull();
    });

})
