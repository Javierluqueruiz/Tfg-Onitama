import { ONITAMA_DECK, type Board, type Card, type Cell, type PieceType, type PlayerColor, type Position } from '../../../../shared';

export interface PlacedPiece extends Position {
    type: PieceType;
    color: PlayerColor;
}

// Construye un tablero 5x5 a partir de una lista de piezas: así cada ejemplo de la
// página de reglas se describe con las piezas que tiene, no con 25 celdas a mano.
export const buildBoard = (pieces: PlacedPiece[]): Board => {
    const rows: Cell[][] = Array.from({ length: 5 }, () => [null, null, null, null, null]);
    pieces.forEach(({ x, y, type, color }) => {
        rows[y][x] = { type, color };
    });
    return rows as Board;
};

export const deckCard = (name: string): Card => {
    const card = ONITAMA_DECK.find(c => c.name === name);
    if (!card) throw new Error(`Carta desconocida en la página de reglas: ${name}`);
    return card;
};

// Los templos son la casilla inicial de cada maestro (VictoryArbitrator en el backend).
export const RED_TEMPLE: Position = { x: 2, y: 0 };
export const BLUE_TEMPLE: Position = { x: 2, y: 4 };

const backRank = (color: PlayerColor, y: number): PlacedPiece[] =>
    [0, 1, 2, 3, 4].map(x => ({ x, y, color, type: x === 2 ? 'master' : 'student' }));

const INITIAL_PIECES: PlacedPiece[] = [...backRank('red', 0), ...backRank('blue', 4)];

export const INITIAL_BOARD = buildBoard(INITIAL_PIECES);

export const STUDENT_CELLS: Position[] = INITIAL_PIECES.filter(p => p.type === 'student').map(({ x, y }) => ({ x, y }));

// Camino de la Piedra: un estudiante azul cae sobre el maestro rojo.
export const STONE_EXAMPLE = {
    board: buildBoard([
        { x: 1, y: 1, type: 'master', color: 'red' },
        { x: 3, y: 0, type: 'student', color: 'red' },
        { x: 2, y: 2, type: 'student', color: 'blue' },
        { x: 2, y: 4, type: 'master', color: 'blue' },
    ]),
    piece: { x: 2, y: 2 } as Position,
    targets: [{ x: 1, y: 1 }] as Position[],
};

// Camino del Río: el maestro azul entra en el templo rojo.
export const STREAM_EXAMPLE = {
    board: buildBoard([
        { x: 1, y: 0, type: 'student', color: 'red' },
        { x: 3, y: 0, type: 'student', color: 'red' },
        { x: 4, y: 2, type: 'master', color: 'red' },
        { x: 2, y: 1, type: 'master', color: 'blue' },
        { x: 0, y: 4, type: 'student', color: 'blue' },
    ]),
    piece: { x: 2, y: 1 } as Position,
    targets: [RED_TEMPLE],
};

// Ejemplo de turno: con la carta Elephant, el estudiante azul de (1,3) puede
// moverse a tres casillas libres y capturar la pieza roja de (2,2).
export const TURN_EXAMPLE = {
    board: buildBoard([
        { x: 2, y: 0, type: 'master', color: 'red' },
        { x: 2, y: 2, type: 'student', color: 'red' },
        { x: 1, y: 3, type: 'student', color: 'blue' },
        { x: 2, y: 4, type: 'master', color: 'blue' },
    ]),
    piece: { x: 1, y: 3 } as Position,
    card: deckCard('Elephant'),
};
