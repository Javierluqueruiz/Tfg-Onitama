import {Card, PlayerColor} from '../../../shared/types';

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

    public static drawInitialCards(){
        const deck = [...ONITAMA_DECK];

        //Algoritmo de Fisher-Yates para mezclar el mazo
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        const drawnCards = deck.slice(0, 5);
        
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
}