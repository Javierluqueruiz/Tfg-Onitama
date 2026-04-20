import { describe, it, expect, beforeAll } from "vitest";
import { Board, Card } from "../../../shared/types";
import { BoardGenerator } from "./BoardGenerator";
import { MoveArbitrator } from "./MoveArbitrator";



describe('FEAT-06 : Validador de movimientos', () => {

        const mockcard: Card = {
            name: "Tiger",
            description: "",
            color: 'blue',
            moves: [
                { x: 0, y: -2 },
                { x: 0, y: 1 },
                { x: 1, y: 0 }
            ]
        };

        let board: Board;
        beforeAll(() => {
            console.log("\n=== INICIANDO PRUEBAS DE VALIDACIÓN DE MOVIMIENTO ===");
            board = BoardGenerator.createInitialBoard();
        })
        
        it('Debe permitir un movimiento válido', () => {
            const from = { x: 2, y: 4};
            const to = { x: 2, y: 2}; 

            const isValid = MoveArbitrator.validateMove(board, from, to, 'blue', mockcard);
            expect(isValid).toBe(true);
        })

        it('Debe validar igualmente para el jugador rojo', () => {
            const from = { x: 2, y: 0};
            const to = { x: 2, y: 2};

            const isValid = MoveArbitrator.validateMove(board, from, to, 'red', mockcard);
            expect(isValid).toBe(true);
        })

        it('Debe rechazar un movimiento si no hay pieza en el origen', () => {
            const from = { x: 0, y: 1};
            const to = { x: 0, y: 3};
            const playerColor = 'red';

            expect(() => MoveArbitrator.validateMove(board, from, to, playerColor, mockcard))
            .toThrowError(`[FEAT-06] Movimiento Ilegal: no hay ninguna pieza en la casilla de origen`);

        })

        it('Debe rechazar un movimiento si se intenta mover una pieza del rival', () => {
            const from = { x: 2, y: 0};
            const to = { x: 2, y: 2};
            const playerColor = 'blue';

            expect(() => MoveArbitrator.validateMove(board, from, to, playerColor, mockcard))
            .toThrowError(`[FEAT-06] Movimiento Ilegal: No puedes mover las piezas del rival`);
        })

        it('Debe rechazar un movimiento si se intenta desplazar a una casilla ocupada por una pieza aliada', () => {
            const from = { x: 2, y: 4};
            const to = { x: 3, y: 4};
            const playerColor = 'blue'; 
            expect(() => MoveArbitrator.validateMove(board, from, to, playerColor, mockcard))
            .toThrowError(`[FEAT-06] Movimiento Ilegal: La casilla de destino está ocupada por una pieza aliada`);
        })

        it('Debe rechazar un movimiento que no esté permitido por la carta', () => {
            const from = {x: 2, y: 4};
            const to = {x: 1, y: 3};
            const playerColor = 'blue';

            expect(() => MoveArbitrator.validateMove(board, from, to , playerColor, mockcard))
            .toThrowError(`[FEAT-06] Movimiento Ilegal: La carta ${mockcard.name} no permite este desplazamiento`)
        })

        it('Debe rechazar un movimiento que esté fuera de los límites del tablero', () => {
            const from = { x: 2, y: 4};
            const to = { x: 2, y: 5};
            const playerColor = 'blue';
            expect(() => MoveArbitrator.validateMove(board, from, to, playerColor, mockcard))
            .toThrowError(`[FEAT-06] Movimiento Ilegal: Las casillas están fuera de los límites del tablero.`);
        })  
})