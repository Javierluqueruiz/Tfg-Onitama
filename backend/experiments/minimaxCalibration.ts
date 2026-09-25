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
    | { kind: 'minimax', depth: number, weights?: EvaluatorWeights, discardMode?: DiscardMode, evaluateWithTurn?: boolean };

const heuristic = (difficulty: AiDifficulty): Bot => ({ kind: 'heuristic', difficulty });
const minimax = (depth: number, options: { weights?: EvaluatorWeights, discardMode?: DiscardMode, evaluateWithTurn?: boolean } = {}): Bot => ({ kind: 'minimax', depth, ...options });

const label = (bot: Bot): string => bot.kind === 'heuristic' ? `Heurística (${bot.difficulty})` : `Minimax (profundidad ${bot.depth})`;

function chooseMove(state: GameState, bot: Bot): LegalMove {
    if (bot.kind === 'heuristic') {
        return AiPlayer.selectMove(state.board, state.currentTurn, state.cards, { difficulty: bot.difficulty  } );
    }

    return MinimaxPlayer.selectMove(state, { depth: bot.depth, weights: bot.weights, discardMode: bot.discardMode, evaluateWithTurn: bot.evaluateWithTurn });
}

function chooseDiscard(state: GameState, bot: Bot): string {
    if (bot.kind === 'heuristic') {
        return AiPlayer.selectDiscard(state.board, state.currentTurn, state.cards);
    }
    
    return MinimaxPlayer.selectDiscard(state, { depth: bot.depth, weights: bot.weights, discardMode: bot.discardMode, evaluateWithTurn: bot.evaluateWithTurn });
}

type DecisionObserver = (bot: Bot, ms: number, isDiscard: boolean) => void;

function playGame(red: Bot, blue: Bot, observe?: DecisionObserver): PlayerColor | null {
    let state: GameState = { ...GameEngine.createNewGame('experiment'), status: 'in_progress' };

    for (let ply = 0; ply < MAX_PLIES && state.status !== 'finished'; ply++) {
        const bot = state.currentTurn === 'red' ? red : blue;
        const isDiscard = state.status === 'waiting_for_discard';
        const started = performance.now();

        if (isDiscard) {
            state =GameEngine.discardCard(state, chooseDiscard(state, bot));
        } else {
            const move = chooseMove(state, bot);
            state = GameEngine.processTurn(state, move.from, move.to, move.cardName);
        }

        observe?.(bot, performance.now() - started, isDiscard);
    }

    return state.status === 'finished' ? (state.winner as PlayerColor) : null;
}

interface MatchUpResult {
    winsA: number;
    winsB: number;
    unfinished: number;
    msA: number[];
    msB: number[];
    discards: number;
    gamesWithDiscards: number;
}

//Cada partida alterna los colores. A y B deben ser bots distintos para poder atribuir el tiempo de decisión a cada uno.
function matchup(a: Bot, b: Bot, games: number): MatchUpResult {
    const result: MatchUpResult = { winsA: 0, winsB: 0, unfinished: 0, msA: [], msB: [], discards: 0, gamesWithDiscards: 0 };
    let discardsInThisGame = 0;
    const observe: DecisionObserver = (bot, ms, isDiscard) => {
        if (isDiscard) {
            result.discards++;
            discardsInThisGame++;
        }
        (bot === a ? result.msA.push(ms) : result.msB.push(ms));
    };

    for (let game = 0; game < games; game++) {
        const aIsRed = game % 2 === 0;
        discardsInThisGame = 0;
        const winner = aIsRed ? playGame(a, b, observe) : playGame(b, a, observe);

        if (discardsInThisGame > 0) result.gamesWithDiscards++;
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

//Experimento leaf: ¿conviene el término de amenaza en las hojas del árbol? A = con amenaza, B = sin amenaza, C = con amenaza según quién tiene el turno.
function leafEvaluator(games: number): string {
    const rows = LEAF_DEPTHS.map(depth => {
        const variantA = () => minimax(depth, { evaluateWithTurn: false });
        const variantB = () => minimax(depth, { weights: WITHOUT_THREAT });
        const variantC = () => minimax(depth);

        const aVsHard = matchup(variantA(), heuristic('hard'), games);
        const bVsHard = matchup(variantB(), heuristic('hard'), games);
        const cVsHard = matchup(variantC(), heuristic('hard'), games);
        const aVsB = matchup(variantA(), variantB(), games);
        const cVsA = matchup(variantC(), variantA(), games);
        const cVsB = matchup(variantC(), variantB(), games);

        return [
            String(depth),
            percent(aVsHard.winsA, games), percent(bVsHard.winsA, games), percent(cVsHard.winsA, games),
            percent(aVsB.winsA, games), percent(cVsA.winsA, games), percent(cVsB.winsA, games)
        ];
    });

    return formatTable(['Profundidad', 'A vs Heurística (difícil)', 'B vs Heurística (difícil)', 'C vs Heurística (difícil)', 'A vs B: gana A', 'C vs A: gana C', 'C vs B: gana C'], rows).join('\n');
}

const VERSUS_DEPTHS = [2, 3, 4, 5];
const HEURISTIC_DIFFICULTIES: AiDifficulty[] = ['easy', 'medium', 'hard'];  

//Experimento versus: ¿Cuánto mejora Minimax con respecto a la heurística de la FEAT-14? Minimax con el evaluador C
function versus(games: number): string {
    const rows = VERSUS_DEPTHS.map(depth => [
        label(minimax(depth)),
        ...HEURISTIC_DIFFICULTIES.map(difficulty => percent(matchup(minimax(depth), heuristic(difficulty), games).winsA, games))
    ]);

    return formatTable(['Victorias de...', ...HEURISTIC_DIFFICULTIES.map(d => label(heuristic(d)))], rows).join('\n');
}

const LADDER_DEPTHS = [ 2, 3, 4, 5];

const percentile = (sortedValues: number[], p: number): number => {
    return sortedValues[Math.min(sortedValues.length - 1, Math.floor(p * sortedValues.length))];
}

//Experimento ladder: ¿cada profundidad gana a la anterior? ¿Cuánto tarta cada decisión en partidas reales (mediana, percentil 95 y máximo)?
function ladder(games: number): string {
    const rows = LADDER_DEPTHS.map(depth => {
        const result = matchup(minimax(depth), minimax(depth - 1), games);
        const times = [...result.msA].sort((a, b) => a - b);

        return [
            label(minimax(depth)),
            percent(result.winsA, games),
            percent(result.winsB, games),
            DECIMAL.format(percentile(times, 0.5)),
            DECIMAL.format(percentile(times, 0.95)),
            DECIMAL.format(times[times.length - 1])
        ];
    });

    return formatTable(['Profundidad', 'Gana a la anterior', 'Pierde contra la anterior', 'Mediana (ms)', 'Percentil 95 (ms)', 'Máximo (ms)'], rows).join('\n');
}

const DISCARD_DEPTHS = [2, 3, 4];

//Experimento discard, parte 1: ¿con qué frecuencia aparece un descarte en partidas reales?
function discardFrequency(games: number): string[] {
    const pairs: [Bot, Bot][] = [
        [minimax(3), heuristic('easy')],
        [minimax(3), heuristic('hard')],
        [minimax(3), minimax(3)],
        [minimax(4), minimax(2)],
    ];

    const rows = pairs.map(([a, b]) => {
        const result = matchup(a, b, games);
        return [`${label(a)} vs ${label(b)}`, String(games), String(result.gamesWithDiscards), String(result.discards)]; 
    });

    return formatTable(['Enfrentamiento', 'Partidas', 'Partidas con descartes', 'Descartes totales'], rows);
}

//Experimento discard, parte 2: ¿importa el modo de descarte dentro del árbol? Mismo Minimax, con 'search' contra 'heuristic'.
function discardModes(games: number): string[] {
    const rows = DISCARD_DEPTHS.map(depth => {
        const result = matchup(minimax(depth, { discardMode: 'search' }), minimax(depth, { discardMode: 'heuristic' }), games);
        return [label(minimax(depth)), percent(result.winsA, games), percent(result.winsB, games), String(result.gamesWithDiscards)];
    });

    return formatTable(['Profundidad', 'Gana "search"', 'Gana "heuristic"', 'Partidas con descartes'], rows);
}

function discard(games: number): string {
    return [
        '## Frecuencia del descarte en partidas reales', '', ...discardFrequency(games), 
        '', '## Modo de descarte dentro del árbol: "search" vs "heuristic"', '', ...discardModes(games)
    ].join('\n');
}

const EXPERIMENTS: Record<string, {title: string; run: (games: number) => string}> = {
    sanity: { title: 'Comprobación: Minimax a profundidad 1 frente a heurística difícil', run: sanityCheck },
    leaf: { title: 'Experimento leaf: ¿conviene el término de amenaza en las hojas del árbol?', run: leafEvaluator },
    versus: { title: 'Experimento versus: Minimax frente a la heurística de la FEAT-14', run: versus },
    ladder: { title: 'Experimento ladder: cada profundidad frente a la anterior y tiempo por decisión', run: ladder },
    discard: { title: 'Experimento discard: frecuencia del descarte y modo de descarte dentro del árbol', run: discard }
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