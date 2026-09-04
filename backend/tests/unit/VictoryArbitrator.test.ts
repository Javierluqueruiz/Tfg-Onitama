import { describe, it, expect, beforeEach } from 'vitest';
import { VictoryArbitrator } from '../../src/game/VictoryArbitrator';
import { Board } from '../../../shared/index';
import { BoardGenerator } from '../../src/game/BoardGenerator';
import { table } from 'node:console';

describe('FEAT-09: Detección de condiciones de victoria', () => {

    let board: Board;
    beforeEach(() => {
        console.log('Iniciando tests para FEAT-09: Detección de condiciones de victoria');
        board = BoardGenerator.createInitialBoard();
    });
    
    it('Debe devolver null si no se ha cumplido ninguna condición de victoria', () => {
        expect(VictoryArbitrator.checkVictory(board)).toBeNull();
    });

    it('[Camino de la Piedra] Debe detectar la victoria al Azul si el mastro Rojo es eliminado', () => {
        board[0][2] = null; //Eliminamos al maestro rojo

        const winner = VictoryArbitrator.checkVictory(board);
        expect(winner).toBe('blue');
    });

    it('[Camino de la Piedra] Debe detectar la victoria al Rojo si el mastro Azul es eliminado', () => {
        board[4][2] = null; //Eliminamos al maestro azul

        const winner = VictoryArbitrator.checkVictory(board);
        expect(winner).toBe('red');
    });

    it('[Camino del Arroyo] Debe detectar la victoria del jugador si su maestro alcanza la casilla inicial del rival', () => {
        board[0][2] = null; 
        board[4][2] = { type: 'master', color: 'red'}; //Colocamos al maestro rojo en la casilla inicial del azul
        board[2][2] = { type: 'master', color: 'blue'}; //Maestro Azul vivo en el centro del tablero

        const winner = VictoryArbitrator.checkVictory(board);
        expect(winner).toBe('red');
    });

    it('No debe dar la victoria si un estudiante alcanza la casilla inicial del rival', () => {
        board[0][3] = null;
        board[3][2] = { type: 'master', color: 'blue'}; 
        board[4][2] = { type: 'student', color: 'red'}; 
        console.log(table(board));

        const winner = VictoryArbitrator.checkVictory(board);
        expect(winner).toBeNull();
    });

    
})  