import { ONITAMA_DECK, type Board, type Cell, type ChatMessage, type GameState, type PlayerProfile } from '../../../shared';

// Estado de partida mínimo pero válido para los tests que montan la pantalla de partida.
export function buildGameState(): GameState {
    const rows: Cell[][] = Array.from({ length: 5 }, () => [null, null, null, null, null]);
    rows[0][2] = { type: 'master', color: 'red' };
    rows[4][2] = { type: 'master', color: 'blue' };

    return {
        roomId: 'room-test',
        status: 'in_progress',
        currentTurn: 'red',
        board: rows as Board,
        cards: {
            red: [ONITAMA_DECK[0], ONITAMA_DECK[1]],
            blue: [ONITAMA_DECK[2], ONITAMA_DECK[3]],
            neutral: ONITAMA_DECK[4],
        },
        winner: null,
        timeRemaining: { red: 0, blue: 0 },
    };
}

// El jugador local es el azul: su socketId coincide con el id del socket simulado (createMockSocket).
export function buildPlayers(): { red: PlayerProfile; blue: PlayerProfile } {
    return {
        red: { socketId: 'rival-socket', name: 'Rival' },
        blue: { socketId: 'mock-socket-id', name: 'Yo' },
    };
}

// Lo que el servidor manda en RECONNECT_SUCCESS (ver SocketHandler.ts, RECONNECT_ATTEMPT).
export function buildReconnectPayload(overrides: Partial<{ chatHistory: ChatMessage[]; drawOffered: boolean; rematchOffered: boolean }> = {}) {
    return {
        gameState: buildGameState(),
        players: buildPlayers(),
        chatHistory: [] as ChatMessage[],
        drawOffered: false,
        rematchOffered: false,
        ...overrides,
    };
}
