/*
    FEAT-15 (Sub-15.3): Experimentos de calibración del oponente Minimax.

    Cada experimento enfrenta a dos bots en partidas completas, alternando los colores, y devuelve tablas en markdown.

    Desde backend/: npm run experiment:minimax -- <experimento> [partidas] (por defecto 200)
    Experimentos disponibles: ver EXPERIMENTS
*/

/// <reference types="node" />
import { AiDifficulty, GameState, PlayerColor } from "../../shared";
import { AiPlayer } from "../src/ai/AiPlayer";
import { EvaluatorWeights, DEFAULT_EVALUATOR_WEIGHTS } from "../src/ai/HeuristicEvaluator";
import { DiscardMode, MinimaxPlayer } from "../src/ai/MinimaxPlayer";
import { GameEngine } from "../src/game/GameEngine";
import { LegalMove } from "../src/game/MoveArbitrator";
import { DECIMAL, formatTable, percent } from "./tables";

// Máximo de jugadas por partida.
const MAX_PLIES = 200;

type Bot = 
    | { kind: 'heuristic', difficulty: AiDifficulty }
    | { kind: 'minimax', depth: number, weights?: EvaluatorWeights, discardMode?: DiscardMode };

const heuristic = (difficulty: AiDifficulty): Bot => ({ kind: 'heuristic', difficulty });
const minimax = (depth: number, options: { weights?: EvaluatorWeights, discardMode?: DiscardMode } = {}): Bot => ({ kind: 'minimax', depth, ...options });

const label = (bot: Bot): string => bot.kind === 'heuristic' ? `Heurística (${bot.difficulty})` : `Minimax (profundidad ${bot.depth})`;

function chooseMove(state: GameState, bot: Bot): LegalMove {
    if (bot.kind === 'heuristic') {
        return AiPlayer.selectMove(state.board, state.currentTurn, state.cards, { difficulty: bot.difficulty } );
    }

    return MinimaxPlayer.selectMove(state, { depth: bot.depth, weights: bot.weights, discardMode: bot.discardMode });
}

function chooseDiscard(state: GameState, bot: Bot): string {
    if (bot.kind === 'heuristic') {
        return AiPlayer.selectDiscard(state.board, state.currentTurn, state.cards);
    }
    
    return MinimaxPlayer.selectDiscard(state, { depth: bot.depth, weights: bot.weights, discardMode: bot.discardMode });
}

type DecisionObserver = (bot: Bot, ms: number) => void;

function playGame(red: Bot, blue: Bot, observe?: DecisionObserver): PlayerColor | null {
    let state: GameState = { ...GameEngine.createNewGame('experiment'), status: 'in_progress' };

    for (let ply = 0; ply < MAX_PLIES && state.status !== 'finished'; ply++) {
        const bot = state.currentTurn === 'red' ? red : blue;
        const started = performance.now();

        if (state.status === 'waiting_for_discard') {
            state =GameEngine.discardCard(state, chooseDiscard(state, bot));
        } else {
            const move = chooseMove(state, bot);
            state = GameEngine.processTurn(state, move.from, move.to, move.cardName);
        }

        observe?.(bot, performance.now() - started);
    }

    return state.status === 'finished' ? (state.winner as PlayerColor) : null;
}

interface MatchUpResult {
    winsA: number;
    winsB: number;
    unfinished: number;
    msA: number[];
    msB: number[];
}

//Cada partida alterna los colores. A y B deben ser bots distintos para poder atribuir el tiempo de decisión a cada uno.
function matchup(a: Bot, b: Bot, games: number): MatchUpResult {
    const result: MatchUpResult = { winsA: 0, winsB: 0, unfinished: 0, msA: [], msB: [] };
    const obeserve: DecisionObserver = (bot, ms) => (bot === a ? result.msA.push(ms) : result.msB.push(ms));

    for (let game = 0; game < games; game++) {
        const aIsRed = game % 2 === 0;
        const winner = aIsRed ? playGame(a, b, obeserve) : playGame(b, a, obeserve);

        if (winner === null) result.unfinished++;
        else if (winner === (aIsRed ? 'red' : 'blue')) result.winsA++;
        else result.winsB++;
    }

    return result;
}

// Experimento de comprobación: Minimaz a profundidad 1 debe empatar contra la heurística en difícil (mismo algoritmo)
function sanityCheck(games: number): string {
    const pairs: [Bot, Bot][] = [[minimax(1), heuristic('hard')], [minimax(3), heuristic('hard')]];

    const rows = pairs.map(([a, b]) => {
        const result = matchup(a, b, games);
        return [`${label(a)} vs ${label(b)}`, percent(result.winsA, games), percent(result.winsB, games), percent(result.unfinished, games)];
    });

    return formatTable(['Enfrentamiento (A vs B)', 'Victorias A', 'Victorias B', 'Sin terminar'], rows).join('\n');
}

const WITHOUT_THREAT: EvaluatorWeights = { ...DEFAULT_EVALUATOR_WEIGHTS, threat: 0 };
const LEAF_DEPTHS = [1, 2, 3, 4, 5];

//Experimento leaf: ¿conviene el término de amenaza en las hojas del árbol? A = con amenaza, B = sin amenaza. 
function leafEvaluator(games: number): string {
    const rows = LEAF_DEPTHS.map(depth => {
        const aVsHard = matchup(minimax(depth), heuristic('hard'), games);
        const bVsHard = matchup(minimax(depth, { weights: WITHOUT_THREAT }), heuristic('hard'), games);
        const aVsB = matchup(minimax(depth), minimax(depth, { weights: WITHOUT_THREAT }), games);

        return [
            String(depth),
            percent(aVsHard.winsA, games), percent(bVsHard.winsA, games),
            percent(aVsB.winsA, games), percent(aVsB.winsB, games)
        ];
    });

    return formatTable(['Profundidad', 'A vs Heurística (difícil)', 'B vs Heurística (difícil)', 'A vs B: gana A', 'B vs A: gana B'], rows).join('\n');
}

const EXPERIMENTS: Record<string, {title: string; run: (games: number) => string}> = {
    sanity: { title: 'Comprobación: Minimax a profundidad 1 frente a heurística difícil', run: sanityCheck },
    leaf: { title: 'Experimento leaf: ¿conviene el término de amenaza en las hojas del árbol?', run: leafEvaluator }
};

if (require.main === module) {
    const [name, gamesArgument] = process.argv.slice(2);
    const games = Number(gamesArgument ?? 200);
    const experiment = EXPERIMENTS[name];

    if (!experiment || !Number.isInteger(games) || games < 2) {
        console.error(`Uso: npm run experiment:minimax -- <experimento> [partidas] (entero >= 2, por defecto 200)\nExperimentos: ${Object.keys(EXPERIMENTS).join(', ')}`);
        process.exit(1);
    }

    const print = console.log.bind(console);
    console.log = () => {};

    const started = Date.now();
    const table = experiment.run(games);
    print([`# ${experiment.title} (${games} partidas por enfrentamiento, colores alternados)`, 
    '', 
    table, 
    '',
    `Tiempo total: ${DECIMAL.format((Date.now() - started) / 1000)} s`].join('\n'));
}