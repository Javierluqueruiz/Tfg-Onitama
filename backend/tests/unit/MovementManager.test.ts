import { describe, it, expect, beforeAll } from "vitest";
import { MovementManager } from "../../src/game/MovementManager";
import { Board } from "../../../shared/index";
import { BoardGenerator } from "../../src/game/BoardGenerator";

describe('FEAT-03 : Desplazamiento de piezas', () => {

    let initialBoard: Board;
    beforeAll(() => {
        console.log("\n=== INICIANDO PRUEBAS DE MOVIMIENTO ===");
        initialBoard = BoardGenerator.createInitialBoard();
    });


    it('Debe mover una pieza a la posición destino y dejar la posición origen vacía', () => {
        const from = { x: 0, y: 0 }; //Posición inicial de una pieza roja
        const to = { x: 0, y: 1 }; //Posición destino vacía
        
        const { newBoard } = MovementManager.movePiece(initialBoard, from, to);

        expect(newBoard[to.y][to.x]).toEqual(initialBoard[from.y][from.x]); //La pieza se mueve a la nueva posición
        expect(newBoard[from.y][from.x]).toBeNull(); //La posición original queda vacía
    });

    it('Debe lanzar un error si no hay pieza en la posición de origen', () => {
        const from = { x: 2, y: 2 }; //Posición vacía
        const to = { x: 2, y: 3 }; //Posición destino vacía
        expect(() => MovementManager.movePiece(initialBoard, from, to))
            .toThrowError(`[FEAT-03] No hay pieza en la posición de origen (${from.x}, ${from.y})`);
    });

    it('Debe retornar un nuevo tablero sin modificar el original', () => {
        const from = { x: 0, y: 0 };
        const to = { x: 0, y: 1 };

        const { newBoard } = MovementManager.movePiece(initialBoard, from, to);
        //El tablero original no debe modificarse
        expect(initialBoard[from.y][from.x]).not.toBeNull();
        expect(initialBoard[to.y][to.x]).toBeNull();

        expect(newBoard[from.y][from.x]).toBeNull();
        expect(newBoard[to.y][to.x]).toEqual(initialBoard[from.y][from.x]);
        expect(newBoard).not.toBe(initialBoard); //Deben ser referencias diferentes
    });

    it('Debe lanzar un error si la posición de origen o destino están fuera de los límites del tablero', () => {
        expect(() => MovementManager.movePiece(initialBoard, { x: -1, y: 0 }, { x: 0, y: 1 }))
            .toThrowError(`[FEAT-03] La posición de origen (-1, 0) está fuera de los límites del tablero`);
        expect(() => MovementManager.movePiece(initialBoard, { x: 0, y: 0 }, { x: 5, y: 1 }))
            .toThrowError(`[FEAT-03] La posición de destino (5, 1) está fuera de los límites del tablero`);
    });
})

describe('FEAT-04: Detección de capturas', () => {
    let initialBoard: Board;
    beforeAll(() => {
        console.log("\n=== INICIANDO PRUEBAS DE CAPTURA ===");
        initialBoard = BoardGenerator.createInitialBoard();
    });

    it('Debe devolver null si la posición destino está vacía', () => {
        const from = { x: 0, y: 0 };
        const to = { x: 0, y: 1 }; //Posición vacía
        const { capturedPiece } = MovementManager.movePiece(initialBoard, from, to);
        expect(capturedPiece).toBeNull();
    });

    it('Debe capturar la pieza en la posición destino si existe', () => {
        const from = {x: 0, y: 0};
        const to = {x: 0, y: 4}; 

        const targetPiece = initialBoard[to.y][to.x]; 

        const { newBoard, capturedPiece } = MovementManager.movePiece(initialBoard, from, to);

        expect(newBoard[to.y][to.x]).toEqual(initialBoard[from.y][from.x]); 

        expect(capturedPiece).not.toBeNull();
        expect(capturedPiece).toEqual(targetPiece);
        expect(capturedPiece?.color).toEqual(targetPiece?.color);
        expect(capturedPiece?.type).toEqual(targetPiece?.type);
    });
})
