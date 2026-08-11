import {Card, GameState, PlayerColor} from '../../../shared';

export type DeckDrawResult = {
    cards: {
        red: [Card, Card];
        blue: [Card, Card];
        neutral: Card;
    },
    firstTurn: PlayerColor;
};

export type CardsState = GameState['cards'];

const ONITAMA_DECK: Card[] = [
    {name: 'Tiger', description: '', color: 'blue', moves: [{x: 0, y: -2}, {x: 0, y: 1}]},
    {name: 'Dragon', description: '', color: 'red', moves: [{x: -2, y: -1}, {x: 2, y: -1}, {x: -1, y: 1}, {x: 1, y: 1}]},
    {name: 'Frog', description: '', color: 'red', moves: [{x: -2, y: 0}, {x: -1, y: -1}, {x: 1, y: 1}]},
    {name: 'Rabbit', description: '', color: 'blue', moves: [{x: 2, y: 0}, {x: 1, y: -1}, {x: -1, y: 1}]},
    {name: 'Crab', description: '', color: 'red', moves: [{x: -2, y: 0}, {x: 2, y: 0}, {x: 0, y: 1}]},
    {name: 'Elephant', description: '', color: 'blue', moves: [{x: -1, y: 0}, {x: 1, y: 0}, {x: -1, y: 1}, {x: 1, y: 1}]},
    {name: 'Goose', description: '', color: 'blue', moves: [{x: -1, y: 0}, {x: 1, y: 0}, {x: -1, y: -1}, {x: 1, y: 1}]},
    {name: 'Rooster', description: '', color: 'red', moves: [{x: -1, y: 0}, {x: 1, y: 0}, {x: -1, y: 1}, {x: 1, y: -1}]},
    {name: 'Monkey', description: '', color: 'red', moves: [{x: -1, y: -1}, {x: 1, y: -1}, {x: -1, y: 1}, {x: 1, y: 1}]},
    {name: 'Mantis', description: '', color: 'blue', moves: [{x: 0, y: -1}, {x: -1, y: 1}, {x: 1, y: 1}]},
    {name: 'Horse', description: '', color: 'blue', moves: [{x: -1, y: 0}, {x: 0, y: -1}, {x: 0, y: 1}]},
    {name: 'Ox', description: '', color: 'red', moves: [{x: 1, y: 0}, {x: 0, y: -1}, {x: 0, y: 1}]},
    {name: 'Crane', description: '', color: 'red', moves: [{x: 0, y: -1}, {x: -1, y: 1}, {x: 1, y: 1}]},
    {name: 'Boar', description: '', color: 'blue', moves: [{x: -1, y: 0}, {x: 0, y: -1}, {x: 1, y: 0}]},
    {name: 'Eel', description: '', color: 'blue', moves: [{x: -1, y: -1}, {x: 1, y: -1}, {x: 0, y: 1}]},
    {name: 'Cobra', description: '', color: 'red', moves: [{x: -1, y: 1}, {x: 1, y: 1}, {x: 0, y: -1}]},
];

export class DeckManager {

    public static drawInitialCards(): DeckDrawResult {
        const deck = [...ONITAMA_DECK];

        //Algoritmo de Fisher-Yates para mezclar el mazo
        const shuffledDeck = this.shuffleDeck(deck);

        const drawnCards = shuffledDeck.slice(0, 5);
        
        const redCards: [Card, Card] = [drawnCards[0], drawnCards[1]];
        const blueCards: [Card, Card] = [drawnCards[2], drawnCards[3]];
        const neutralCard: Card = drawnCards[4];

        const initialTurn: PlayerColor = neutralCard.color;

        return {
            cards: {
                red: redCards,
                blue: blueCards,
                neutral: neutralCard
            },
            firstTurn: initialTurn
        };
    }

    private static shuffleDeck(deck: Card[]): Card[] {
        const shuffledDeck = [...deck];
        for (let i = shuffledDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
        }
        return shuffledDeck;
    }

    public static playCard(currentCards: CardsState, playerColor: PlayerColor, cardName: string): CardsState {
        
        const newCards: CardsState = {
            red: [...currentCards.red],
            blue: [...currentCards.blue],
            neutral: currentCards.neutral
        }

        
        const playerCards = newCards[playerColor];
        const cardIndex = playerCards.findIndex(card => card.name === cardName);

        if (cardIndex === -1) {
            throw new Error(`[FEAT-05] El jugador ${playerColor} no tiene la carta ${cardName} en su mano`);
        }

        const playedCard = playerCards[cardIndex];
        const oldNeutralCard = newCards.neutral;

        //Ejecutamos la rotación de las cartas
        playerCards[cardIndex] = oldNeutralCard;
        newCards.neutral = playedCard;

        return newCards;
    }

}