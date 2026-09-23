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

        //'Espiamos' al arbitro y forzamos que retorne true
        vi.spyOn(MoveArbitrator, 'hasValidMoves').mockReturnValue(true);

        const newState = GameEngine.switchTurn(state);

        expect(newState.currentTurn).toBe('blue');
        vi.restoreAllMocks();
    })

    it('Debe alternar el turno de azul a rojo en condiciones normales', () => {
        const state = createMockeState('blue');

        vi.spyOn(MoveArbitrator, 'hasValidMoves').mockReturnValue(true);

        const newState = GameEngine.switchTurn(state);

        expect(newState.currentTurn).toBe('red');
        vi.restoreAllMocks();
     })

     it('Debe saltar el turno del jugador si no tiene movimientos válidos', () => {

        const state = createMockeState('red');

        vi.spyOn(MoveArbitrator, 'hasValidMoves').mockReturnValueOnce(false);

        //Pasamos el turno al azul
        const newState = GameEngine.switchTurn(state);

        expect(newState.currentTurn).toBe('blue');
        expect(newState.status).toBe('waiting_for_discard');
        vi.restoreAllMocks();
     })


})

describe('FEAT-14: Descarte de cartas sin movimiento válido', () => {
    const cardA: Card = { name: 'Card A', description: 'Mock', color: 'red', moves: [{ x: 0, y: -1 }] };
    const cardB: Card = { name: 'Card B', description: 'Mock', color: 'red', moves: [{ x: 1, y: 0 }] };
    const cardC: Card = { name: 'Card C', description: 'Mock', color: 'blue', moves: [{ x: 0, y: 1 }] };
    const cardD: Card = { name: 'Card D', description: 'Mock', color: 'blue', moves: [{ x: 1, y: 1 }] };
    const neutralCard: Card = { name: 'Neutral Card', description: 'Mock', color: 'red', moves: [{ x: 1, y: 1 }] };

    const createMockState = (): GameState => ({
        roomId: 'test-room',
        board: Array(5).fill(null).map(() => Array(5).fill(null)) as Board,
        cards: {
            red: [cardA, cardB],
            blue: [cardC, cardD],
            neutral: neutralCard
        },
        currentTurn: 'red',
        status: 'waiting_for_discard',
        winner: null,
        timeRemaining: {
            red: 600,
            blue: 600
        }
    });

    it('Debe lanzar un error si el jugador intenta descartar una carta que no tiene en la mano', () => {
        const state = createMockState();

        expect(() => GameEngine.discardCard(state, cardC.name))
            .toThrowError(`[FEAT-14] La carta ${cardC.name} no está en la mano del jugador ${state.currentTurn}`);
    });

    it('Debe rotar la carta descartada con la carta neutral', () => {
        const state = createMockState();
        vi.spyOn(MoveArbitrator, 'hasValidMoves').mockReturnValue(true);

        const newState = GameEngine.discardCard(state, cardA.name);

        expect(newState.cards.red).toContainEqual(neutralCard);
        expect(newState.cards.red).not.toContainEqual(cardA);
        expect(newState.cards.neutral).toEqual(cardA);
        expect(newState.status).toBe('in_progress');
        vi.restoreAllMocks();
    });

    it('Debe pasar el turno al rival tras un descarte', () => {
        const state = createMockState();
        vi.spyOn(MoveArbitrator, 'hasValidMoves').mockReturnValue(true);

        const newState = GameEngine.discardCard(state, cardA.name);

        expect(newState.currentTurn).toBe('blue');
        expect(newState.status).toBe('in_progress');

        vi.restoreAllMocks();
    });

    it('Debe mantener el estado de espera si el jugador rival no tiene movimientos válidos tras un descarte', () => {
        const state = createMockState();
        vi.spyOn(MoveArbitrator, 'hasValidMoves').mockReturnValueOnce(false);

        const newState = GameEngine.discardCard(state, cardA.name);

        expect(newState.currentTurn).toBe('blue');
        expect(newState.status).toBe('waiting_for_discard');
    });
});