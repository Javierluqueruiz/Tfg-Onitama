import { describe, it, expect, beforeAll } from "vitest";
import { MovementManager } from "./MovementManager";
import { GameEngine } from "./GameEngine";
import { Board } from "../../../shared/types";
import { BoardGenerator } from "./BoardGenerator";

describe('FEAT-03: MovementManager', () => {

    let initialBoard: Board;
    beforeAll(() => {
        console.log("\n=== INICIANDO PRUEBAS DE MOVIMIENTO ===");
        initialBoard = BoardGenerator.createInitialBoard();
    });


    it('Debe mover una pieza a la posición destino y dejar la posición origen vacía', () => {
        const from = { x: 0, y: 0 }; //Posición inicial de una pieza roja
        const to = { x: 0, y: 1 }; //Posición destino vacía
        
        const newBoard = MovementManager.movePiece(initialBoard, from, to);

        expect(newBoard[to.y][to.x]).toEqual(initialBoard[from.y][from.x]); //La pieza se mueve a la nueva posición
        expect(newBoard[from.y][from.x]).toBeNull(); //La posición original queda vacía
    });

    it('Debe lanzar un error si no hay pieza en la posición de origen', () => {
        const from = { x: 2, y: 2 }; //Posición vacía
        const to = { x: 2, y: 3 }; //Posición destino vacía
        expect(() => MovementManager.movePiece(initialBoard, from, to)).toThrowError(`[FEAT-03] No hay pieza en la posición de origen (${from.x}, ${from.y})`);
    });

    it('Debe retornar un nuevo tablero sin modificar el original', () => {
        const from = { x: 0, y: 0 };
        const to = { x: 0, y: 1 };

        const newBoard = MovementManager.movePiece(initialBoard, from, to);
        //El tablero original no debe modificarse
        expect(initialBoard[from.y][from.x]).not.toBeNull();
        expect(initialBoard[to.y][to.x]).toBeNull();
    });

    it('Debe lanzar un error si la posición de origen o destino están fuera de los límites del tablero', () => {
        expect(() => MovementManager.movePiece(initialBoard, { x: -1, y: 0 }, { x: 0, y: 1 }))
            .toThrowError(`[FEAT-03] La posición de origen (-1, 0) está fuera de los límites del tablero`);
        expect(() => MovementManager.movePiece(initialBoard, { x: 0, y: 0 }, { x: 5, y: 1 }))
            .toThrowError(`[FEAT-03] La posición de destino (5, 1) está fuera de los límites del tablero`);
    });
})
