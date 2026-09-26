/*

    FEAT-15 (Sub-15.2): Experimento de eficiencia de la búsqueda minimax con poda alfa-beta ordenada
    
    Responde a la pregunta: ¿cuánto trabajo ahorran la poda alfa-beta y la ordenación de movimientos respecto a Minimax puro?

    Desde backend/: npm run experiment:search -- [posiciones] (por defecto 20)
    La salida son tablas en markdown.
*/

/// <reference types="node" />
import { GameState } from "../../shared";
import { MinimaxPlayer, SearchAlgorithm } from "../src/ai/MinimaxPlayer";
import { GameEngine } from "../src/game/GameEngine";
import { MoveArbitrator } from "../src/game/MoveArbitrator";
import { DECIMAL, INTEGER, formatTable } from "./tables";

const ALGORITHMS: SearchAlgorithm[] = ['minimax', 'alphabeta', 'alphabeta-ordered'];
const DEPTHS = [2, 3, 4, 5, 6];

const MAX_DEPTH: Record<SearchAlgorithm, number> = {
    'minimax': 4,
    'alphabeta': 5,
    'alphabeta-ordered': 6
};

// Genera una posición aleatoria a partir de un juego nuevo, haciendo entre 4 y 12 jugadas aleatorias.
function randomPosition(): GameState {
    for (;;) {
        const plies = 4 + Math.floor(Math.random() * 9);
        let state: GameState = { ...GameEngine.createNewGame('experiment'), status: 'in_progress'};

        for (let ply = 0; ply < plies && state.status === 'in_progress'; ply++) {
            const moves = MoveArbitrator.generateLegalMoves(state.board, state.currentTurn, state.cards[state.currentTurn]);
            const move = moves[Math.floor(Math.random() * moves.length)];
            state = GameEngine.processTurn(state, move.from, move.to, move.cardName);
        }
        if (state.status === 'in_progress') return state;
    }
}

// Media de nodos visitados y de ms por jugada
function measure(positions: GameState[], algorithm: SearchAlgorithm, depth: number): string {
    const stats = { nodes: 0 };
    const started = performance.now();

    for (const position of positions) {
        MinimaxPlayer.selectMove(position, { depth, algorithm, stats });  
    }

    const nodes = INTEGER.format(Math.round(stats.nodes / positions.length));   
    const ms = DECIMAL.format((performance.now() - started) / positions.length);

    return `${nodes} nodos · ${ms} ms`;
}

export function runExperiment(positionCount: number): string {
    const started = Date.now();
    const positions = Array.from({ length: positionCount }, () => randomPosition());
    const header = ['Profundidad', 'Minimax puro', 'Alfa-beta', 'Alfa-beta + ordenación'];
    const rows = DEPTHS.map(depth => [
        String(depth),
        ...ALGORITHMS.map(algorithm => depth > MAX_DEPTH[algorithm] ? 'no medido' : measure(positions, algorithm, depth))
    ]);

    return [
        `# Eficiencia de la búsqueda (${positionCount} posiciones de medio juego aleatorias, media por decisión)`,
        '',
        ...formatTable(header, rows),
        '',
        `Tiempo total: ${DECIMAL.format((Date.now() - started) / 1000)} s`
    ].join('\n');
}
    
if (require.main === module) {
    const positionCount = Number(process.argv[2] ?? 20);

    if (!Number.isInteger(positionCount) || positionCount < 1) {
        console.error('Uso: npm run experiment:search -- [posiciones] (entero >= 1, por defecto 20)');
        process.exit(1);
    }

    console.log(runExperiment(positionCount));
}