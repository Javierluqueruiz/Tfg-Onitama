/*
    FEAT-14 (Sub-14.4): Experimento de calibración de la IA heurística.

    Responde a dos preguntas:
        1. ¿Con qué frecuencia la IA deja al rival una victoria inmediata?
        2. ¿Forman una escalera de dificultad los tres niveles de dificultad de la IA, con y sin el componente de amenaza?

    Desde backend/: npm run experiment:ai -- [partidas] (por defecto 1000)
    Las salidas son tablas en markdown.
*/

/// <reference types="node" />
import { GameState, PlayerColor, AiDifficulty } from "../../shared";
import { AiPlayer } from "../src/ai/AiPlayer";
import { DEFAULT_EVALUATOR_WEIGHTS, EvaluatorWeights } from "../src/ai/HeuristicEvaluator";
import { LegalMove, MoveArbitrator } from "../src/game/MoveArbitrator";
import { GameEngine } from "../src/game/GameEngine";
import { MovementManager } from "../src/game/MovementManager";
import { VictoryArbitrator } from "../src/game/VictoryArbitrator";


// 'random' => jugador aleatorio que siempre elige una victoria, si la hay.
type Bot = AiDifficulty | 'random';

// Máximo de jugadas por partida.
const MAX_PLIES = 200;

const CONFIGS: { name: string, weights: EvaluatorWeights }[] = [
    { name: 'SIN detección de amenaza', weights: { ...DEFAULT_EVALUATOR_WEIGHTS, threat: 0 } },
    { name: 'CON detección de amenaza', weights: DEFAULT_EVALUATOR_WEIGHTS }
];

const MATCHUPS: [Bot, Bot][] = [
    ['hard', 'medium'], ['medium', 'easy'], ['hard', 'easy'],
    ['hard', 'random'], ['medium', 'random'], ['easy', 'random']
];  

const opponentOf = (player: PlayerColor): PlayerColor => player === 'red' ? 'blue' : 'red';

const isWinningMove = (board: GameState['board'], player: PlayerColor, move: LegalMove): boolean => {
    return VictoryArbitrator.checkVictory(MovementManager.movePiece(board, move.from, move.to).newBoard) === player;
}

function canWinNow(board: GameState['board'], cards: GameState['cards'], player: PlayerColor): boolean {
    return MoveArbitrator.generateLegalMoves(board, player, cards[player]).some(move => {
        return isWinningMove(board, player, move);
    });
}

function chooseMove(state: GameState, player: PlayerColor, bot: Bot, weights: EvaluatorWeights): LegalMove {
    if (bot === 'random') {
        const moves = MoveArbitrator.generateLegalMoves(state.board, player, state.cards[player]);
        return moves.find(move => isWinningMove(state.board, player, move)) ?? moves[Math.floor(Math.random() * moves.length)];
    }

    return AiPlayer.selectMove(state.board, player, state.cards, { difficulty: bot, weights });
}

type MoveObserver = (player: PlayerColor, next: GameState) => void;

function playGame(red: Bot, blue: Bot, weights: EvaluatorWeights, observe?: MoveObserver): PlayerColor | null {
    let state = GameEngine.createNewGame('experiment');

    for (let ply = 0; ply < MAX_PLIES && state.status !== 'finished'; ply++) {
        const player = state.currentTurn;

        if (state.status === 'waiting_for_discard') {
            state = GameEngine.discardCard(state, AiPlayer.selectDiscard(state.board, player, state.cards));
            continue;
        }

        const move = chooseMove(state, player, player === 'red' ? red : blue, weights);
        state = GameEngine.processTurn(state, move.from, move.to, move.cardName);
        observe?.(player, state);
    }

    return state.status === 'finished' ? (state.winner as PlayerColor) : null;
}

const percent = (count: number, total: number): string => `${(100 * count / total).toFixed(1)}%`;

//Experimento 1: la IA difícil (azul) juega contra un jugador aleatorio (rojo) - ¿con qué frecuencia deja al rival una victoria inmediata?
function experiment1(games: number): string[] {
    const rows = ['| Configuración | Jugadas IA | Dejan victoria inmediata | % |', '|---|---|---|---|'];

    for (const config of CONFIGS) {
        let moves = 0;
        let blunders = 0;

        for (let game = 0; game < games; game++) {
            playGame('random', 'hard', config.weights, (player, next) => {
                if (player !== 'blue' || next.status === 'finished') return;
                moves++;
                if (canWinNow(next.board, next.cards, opponentOf(player))) blunders++;
            });
        }

        rows.push(`| ${config.name} | ${moves} | ${blunders} | ${percent(blunders, moves)} |`);
    }
    return rows;
}

// Experimento 2: escalera de dificultad de la IA; cada partida alterna los colores
function experiment2(games: number): string[] {
    const lines: string[] = [];

    for (const config of CONFIGS) {
        lines.push(`\n**${config.name}**\n`, '| Enfrentamiento (A vs B) | Gana A | Gana B | Sin terminar |', '|---|---|---|---|');

        for (const [a, b] of MATCHUPS) {
            let winsA = 0;
            let winsB = 0;
            let unfinished = 0;

            for (let game = 0; game < games; game++) {
                const aIsRed = game % 2 === 0;
                const winner = aIsRed ? playGame(a, b, config.weights) : playGame(b, a, config.weights);

                if (winner === null) unfinished++;
                else if (winner === (aIsRed ? 'red' : 'blue')) winsA++;
                else winsB++;
            }

            lines.push(`| ${a} vs ${b} | ${percent(winsA, games)} | ${percent(winsB, games)} | ${percent(unfinished, games)} |`);
        }
    }
    return lines;
}

export function runExperiments(games: number): string {
    const started = Date.now();

    const output = [
        `# Calibración de la IA heurística (${games} partidas por enfrentamiento, colores alternados)`,
        `\n## 1. Blunders de la IA difícil contra un jugador aleatorio\n`,
        ...experiment1(games),
        `\n## 2. Escalera de dificultad de la IA\n`,
        ...experiment2(games),
        `\n\nTiempo total: ${(Date.now() - started) / 1000}s`
    ];

    return output.join('\n');
}

if (require.main === module) {
    const games = Number(process.argv[2] ?? 1000);

    if (!Number.isInteger(games) || games < 2) {
        console.error('Uso: npm run experiment:ai -- [partidas] (entero >= 2, por defecto 1000)');
        process.exit(1);
    }
    console.log(runExperiments(games));
}