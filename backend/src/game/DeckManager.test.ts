import { describe, beforeAll, it, expect } from 'vitest';
import { DeckManager } from './DeckManager';

describe('FEAT-02: DeckManager', () => {

    let deckResult: ReturnType<typeof DeckManager.drawInitialCards>;

    it('Debe repartir exactamente 5 cartas al inicio de la partida', () => {
        const deckResult = DeckManager.drawInitialCards();
        const totalCards = [
            ...deckResult.cards.red,
            ...deckResult.cards.blue,
            deckResult.cards.neutral
        ];

        expect(totalCards.length).toBe(5);

        //Validamos que las cartas sean únicas
        const uniqueNames = new Set(totalCards.map(c => c.name));
        expect(uniqueNames.size).toBe(5);
    });

    it('Cada jugador debe recibir exactamente 2 cartas', () => {
        const deckResult = DeckManager.drawInitialCards();
        expect(deckResult.cards.red.length).toBe(2);
        expect(deckResult.cards.blue.length).toBe(2);
    });

    it('El turno inicial debe coincidir con el color de la carta neutral', () => {
        //Probamos varias veces para asegurarnos que se siga cumpliendo
        for(let i = 0; i < 10; i++){
            const deckResult2 = DeckManager.drawInitialCards();
            const neutralColor = deckResult2.cards.neutral.color;
            expect(deckResult2.firstTurn).toBe(neutralColor);
        };
    });


})