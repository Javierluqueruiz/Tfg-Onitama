import { describe, it, expect, vi } from "vitest";
import { Board, Card, GameState } from "../../../shared/index";
import { MoveArbitrator } from "../../src/game/MoveArbitrator";
import { GameEngine } from "../../src/game/GameEngine";



describe('FEAT-08: Alternar el turno entre los jugadores', () => {
    const mockCard: Card = {
        name: 'Mock Card',
        description: 'Mock card for testing',
        color: 'red',
        moves: [{x: 0, y: -1}]
    }

    const mockCard2: Card = {
        name: 'Mock Card 2',
        description: 'Mock card for testing',
        color: 'blue',
        moves: [{x: 0, y: -1}]
    }

    const createMockeState = (currentPlayer: 'red' | 'blue'): GameState => ({
        roomId: 'test-room',
        board: Array(5).fill(null).map(() => Array(5).fill(null)) as Board,
        cards: {
            red: [mockCard, mockCard2],
            blue: [mockCard, mockCard2],
            neutral: mockCard
        },
        currentTurn: currentPlayer,
        status: 'in_progress',
        winner: null,
        timeRemaining: {
            red: 600,
            blue: 600
        }
    });

    it('Debe alternar el turno de rojo a azul en condiciones normales', () => {
        const state = createMockeState('red');
        const engine = new GameEngine();

        //'Espiamos' al arbitro y forzamos que retorne true
        vi.spyOn(MoveArbitrator, 'hasValidMoves').mockReturnValue(true);

        const newState = engine.switchTurn(state);

        expect(newState.currentTurn).toBe('blue');
        vi.restoreAllMocks();
    })

    it('Debe alternar el turno de azul a rojo en condiciones normales', () => {
        const state = createMockeState('blue');
        const engine = new GameEngine();

        vi.spyOn(MoveArbitrator, 'hasValidMoves').mockReturnValue(true);

        const newState = engine.switchTurn(state);

        expect(newState.currentTurn).toBe('red');
        vi.restoreAllMocks();
     })

     it('Debe saltar el turno del jugador si no tiene movimientos válidos', () => {

        const state = createMockeState('red');
        const engine = new GameEngine();

        vi.spyOn(MoveArbitrator, 'hasValidMoves').mockReturnValueOnce(false);

        //Pasamos el turno al azul
        const newState = engine.switchTurn(state);

        expect(newState.currentTurn).toBe('blue');
        expect(newState.status).toBe('waiting_for_discard');
        vi.restoreAllMocks();
     })


})
