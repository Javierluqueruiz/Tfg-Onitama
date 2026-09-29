import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CardView } from '../components/game/ui/cards/CardView';
import { getValidTargets } from '../components/game/logic/getValidTargets';
import { CardExplorer } from '../components/rules/CardExplorer';
import { MiniBoard } from '../components/rules/MiniBoard';
import { useActiveSection } from '../components/rules/useActiveSection';
import {
    BLUE_TEMPLE, RED_TEMPLE, INITIAL_BOARD, STONE_EXAMPLE, STREAM_EXAMPLE, STUDENT_CELLS, TURN_EXAMPLE, deckCard
} from '../components/rules/rulesBoards';
import btnStyles from '../components/shared/ui/Button.module.css';
import formStyles from '../components/lobby/ui/Forms.module.css';
import '../components/game/theme.css';
import styles from './RulesPage.module.css';

const SECTIONS = [
    { id: 'tablero', label: 'Tablero y piezas' },
    { id: 'objetivo', label: 'Cómo ganar' },
    { id: 'cartas', label: 'Las cartas' },
    { id: 'turno', label: 'Un turno' },
    { id: 'especiales', label: 'Casos especiales' },
    { id: 'modos', label: 'Modos de juego' },
];
const SECTION_IDS = SECTIONS.map(section => section.id);

type LegendFocus = 'students' | 'masters' | null;

interface SwapStateProps {
    label: string;
    hand: string[];
    table: string;
    caption: string;
}

// Una "foto" del reparto de cartas: la mano del jugador y la carta neutral de la
// mesa, esta última en un recuadro dorado para distinguirla a simple vista.
const SwapState = ({ label, hand, table, caption }: SwapStateProps) => (
    <div className={styles.swapBlock}>
        <span className={styles.swapLabel}>{label}</span>
        <div className={styles.swapRow}>
            <div className={styles.swapGroup}>
                <span className={styles.groupLabel}>Tu mano</span>
                <div className={styles.swapCards}>
                    {hand.map(name => <CardView key={name} card={deckCard(name)} faction="blue" />)}
                </div>
            </div>
            <div className={`${styles.swapGroup} ${styles.swapNeutral}`}>
                <span className={`${styles.groupLabel} ${styles.groupLabelNeutral}`}>ㅤMesa (neutral)</span>
                <div className={styles.swapCards}>
                    <CardView card={deckCard(table)} faction="neutral" />
                </div>
            </div>
        </div>
        <span className={styles.swapCaption}>{caption}</span>
    </div>
);

export const RulesPage = () => {
    const activeId = useActiveSection(SECTION_IDS);
    const [legendFocus, setLegendFocus] = useState<LegendFocus>(null);

    const goToSection = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        event.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const turnTargets = getValidTargets(TURN_EXAMPLE.board, TURN_EXAMPLE.card, TURN_EXAMPLE.piece, 'blue', false);

    // Los maestros empiezan sobre su templo, así que marcan las mismas dos casillas.
    const boardMarks =
        legendFocus === 'students' ? STUDENT_CELLS :
        legendFocus === 'masters' ? [RED_TEMPLE, BLUE_TEMPLE] :
        [];

    return (
        <div className={`${styles.page} gameTheme`}>
            <header className={styles.header}>
                <Link to="/" className={styles.brand}>⛩️ ONITAMA</Link>
                <h1 className={styles.pageTitle}>Reglas del juego</h1>
                <Link to="/" className={styles.headerPlay}>← Volver a jugar</Link>
            </header>

            <div className={styles.layout}>
                <nav className={styles.toc} aria-label="Secciones de las reglas">
                    <ol>
                        {SECTIONS.map(section => (
                            <li key={section.id}>
                                <a
                                    href={`#${section.id}`}
                                    className={`${styles.tocLink} ${activeId === section.id ? styles.tocLinkActive : ''}`}
                                    aria-current={activeId === section.id ? 'true' : undefined}
                                    onClick={event => goToSection(event, section.id)}
                                >
                                    {section.label}
                                </a>
                            </li>
                        ))}
                    </ol>
                </nav>

                <main className={styles.content}>
                    {/* --- 1. TABLERO Y PIEZAS --- */}
                    <section id="tablero" className={styles.section}>
                        <h2 className={styles.sectionTitle}>Tablero y piezas</h2>
                        <p className={styles.lead}>
                            Onitama es un duelo de estrategia para dos jugadores sobre un tablero de 5×5.
                        </p>
                        <div className={styles.boardRow}>
                            <MiniBoard
                                board={INITIAL_BOARD}
                                label="Posición inicial del tablero"
                                markedCells={boardMarks}
                                scale={0.85}
                            />
                            <div className={styles.legend}>
                                <p>Cada jugador empieza con <strong>cinco piezas</strong> en su fila de salida. Pasa el ratón por cada tipo para verlo en el tablero.</p>
                                <button
                                    type="button"
                                    className={styles.legendItem}
                                    onMouseEnter={() => setLegendFocus('masters')}
                                    onMouseLeave={() => setLegendFocus(null)}
                                    onFocus={() => setLegendFocus('masters')}
                                    onBlur={() => setLegendFocus(null)}
                                >
                                    <strong>Maestro (1 por bando).</strong> La pieza que hay que proteger. Empieza sobre su
                                    <strong> templo</strong>, en el centro de la fila, y se distingue por el remate sobre la cabeza.
                                </button>
                                <button
                                    type="button"
                                    className={styles.legendItem}
                                    onMouseEnter={() => setLegendFocus('students')}
                                    onMouseLeave={() => setLegendFocus(null)}
                                    onFocus={() => setLegendFocus('students')}
                                    onBlur={() => setLegendFocus(null)}
                                >
                                    <strong>Estudiantes (4 por bando).</strong> Se mueven exactamente igual que el maestro:
                                    lo que cambia es que perderlos no acaba la partida.
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* --- 2. OBJETIVO --- */}
                    <section id="objetivo" className={styles.section}>
                        <h2 className={styles.sectionTitle}>Cómo ganar</h2>
                        <p className={styles.lead}>
                            En tu turno mueves una pieza con una de las cartas de tu mano. Hay dos caminos hacia la victoria:
                        </p>

                        <div className={styles.twoCols}>
                            <article className={styles.panel}>
                                <h3 className={styles.panelTitle}>El Camino de la Piedra</h3>
                                <MiniBoard
                                    board={STONE_EXAMPLE.board}
                                    label="Un estudiante azul captura al maestro rojo"
                                    selectedPiece={STONE_EXAMPLE.piece}
                                    validTargets={STONE_EXAMPLE.targets}
                                />
                                <p>Captura al <strong>maestro</strong> rival cayendo sobre su casilla con cualquiera de tus piezas.</p>
                            </article>

                            <article className={styles.panel}>
                                <h3 className={styles.panelTitle}>El Camino del Río</h3>
                                <MiniBoard
                                    board={STREAM_EXAMPLE.board}
                                    label="El maestro azul entra en el templo rojo"
                                    selectedPiece={STREAM_EXAMPLE.piece}
                                    validTargets={STREAM_EXAMPLE.targets}
                                    markedCells={[RED_TEMPLE]}
                                />
                                <p>Lleva a tu <strong>maestro</strong> al <strong>templo</strong> rival, la casilla marcada en dorado.</p>
                            </article>
                        </div>
                    </section>

                    {/* --- 3. CARTAS --- */}
                    <section id="cartas" className={styles.section}>
                        <h2 className={styles.sectionTitle}>Las cartas</h2>
                        <p className={styles.lead}>
                            Aquí no hay piezas que se muevan «como un alfil»: <strong>los movimientos los dan las cartas</strong>.
                            El mazo tiene 16, y en cada partida se reparten <strong>2 para ti, 2 para el rival y 1 neutral</strong> en la mesa.
                        </p>
                        <p>
                            En cada carta, la casilla oscura del centro es tu pieza y las verdes son los destinos posibles.
                            Elige una para verla sobre el tablero:
                        </p>
                        <CardExplorer />
                    </section>

                    {/* --- 4. TURNO --- */}
                    <section id="turno" className={styles.section}>
                        <h2 className={styles.sectionTitle}>Un turno</h2>
                        <ol className={styles.steps}>
                            <li className={styles.step}>
                                <span className={styles.stepNumber}>1</span>
                                <div>
                                    <h3>Elige una carta de tu mano</h3>
                                    <p>Su movimiento es el que podrás hacer este turno, con cualquiera de tus piezas.</p>
                                </div>
                            </li>
                            <li className={styles.step}>
                                <span className={styles.stepNumber}>2</span>
                                <div>
                                    <h3>Elige una de tus piezas</h3>
                                    <p>Se iluminan los destinos posibles. Las capturas se marcan con un aro.</p>
                                    <MiniBoard
                                        board={TURN_EXAMPLE.board}
                                        label="Destinos posibles del estudiante azul con la carta Elephant"
                                        selectedPiece={TURN_EXAMPLE.piece}
                                        validTargets={turnTargets}
                                        scale={0.6}
                                    />
                                </div>
                            </li>
                            <li className={styles.step}>
                                <span className={styles.stepNumber}>3</span>
                                <div>
                                    <h3>Mueve</h3>
                                    <p>
                                        Puedes ir a una casilla libre o a una con pieza rival, que queda <strong>capturada</strong>.
                                        No puedes caer sobre una pieza tuya ni salirte del tablero, y no se puede pasar el turno.
                                    </p>
                                </div>
                            </li>
                            <li className={styles.step}>
                                <span className={styles.stepNumber}>4</span>
                                <div>
                                    <h3>La carta usada pasa a la mesa</h3>
                                    <p>
                                        Intercambias la carta que has jugado por la neutral. El rival, en su turno, podrá
                                        acabar cogiendo la que tú acabas de usar: tu mano cambia siempre.
                                    </p>
                                    <div className={styles.swap}>
                                        <SwapState
                                            label="Antes"
                                            hand={['Elephant', 'Boar']}
                                            table="Crab"
                                            caption="Juegas Elephant y la mesa tiene Crab"
                                        />
                                        <span className={styles.swapArrow} aria-hidden="true">→</span>
                                        <SwapState
                                            label="Después"
                                            hand={['Crab', 'Boar']}
                                            table="Elephant"
                                            caption="Ahora tienes Crab y en la mesa queda Elephant"
                                        />
                                    </div>
                                </div>
                            </li>
                        </ol>
                    </section>

                    {/* --- 5. CASOS ESPECIALES --- */}
                    <section id="especiales" className={styles.section}>
                        <h2 className={styles.sectionTitle}>Casos especiales</h2>
                        <div className={styles.cardsGrid}>
                            <article className={styles.panel}>
                                <h3 className={styles.panelTitle}>Sin movimientos posibles</h3>
                                <p>
                                    Si ninguna de tus dos cartas te permite mover, no pierdes: <strong>descartas una carta</strong> (la
                                    eliges tú), se intercambia con la de la mesa como siempre y pasa el turno.
                                </p>
                            </article>
                            <article className={styles.panel}>
                                <h3 className={styles.panelTitle}>Tablas</h3>
                                <p>
                                    En partidas contra otra persona puedes ofrecer tablas. Si tu rival acepta, la partida
                                    termina en empate.
                                </p>
                            </article>
                            <article className={styles.panel}>
                                <h3 className={styles.panelTitle}>Rendición</h3>
                                <p>Puedes rendirte en cualquier momento: pierdes la partida al instante, tras una confirmación.</p>
                            </article>
                            <article className={styles.panel}>
                                <h3 className={styles.panelTitle}>El reloj</h3>
                                <p>
                                    En los modos con reloj, cada jugador tiene su propio tiempo. Si se te agota, pierdes,
                                    aunque tengas mejor posición.
                                </p>
                            </article>
                        </div>
                    </section>

                    {/* --- 6. MODOS --- */}
                    <section id="modos" className={styles.section}>
                        <h2 className={styles.sectionTitle}>Modos de juego</h2>

                        <h3 className={styles.subTitle}>Contra otras personas</h3>
                        <div className={styles.cardsGrid}>
                            <article className={styles.panel}>
                                <h3 className={styles.panelTitle}>Casual</h3>
                                <p>Sin reloj. Para jugar sin prisa y aprender.</p>
                            </article>
                            <article className={styles.panel}>
                                <h3 className={styles.panelTitle}>Normal</h3>
                                <p>10 minutos por jugador.</p>
                            </article>
                            <article className={styles.panel}>
                                <h3 className={styles.panelTitle}>Rápido</h3>
                                <p>5 minutos por jugador. Cada decisión cuenta.</p>
                            </article>
                        </div>
                        <p className={styles.note}>
                            También puedes crear una <strong>sala privada</strong> y pasar el código a un amigo.
                        </p>

                        <h3 className={styles.subTitle}>Contra la IA</h3>
                        <p className={styles.note}>
                            Sin reloj y sin rival humano: ideal para practicar. Hay dos tipos de IA, cada uno en tres niveles.
                        </p>
                        <div className={styles.twoCols}>
                            <article className={styles.panel}>
                                <h3 className={styles.panelTitle}>Heurística</h3>
                                <p>Solo mira su próxima jugada y elige la que deja mejor posición.</p>
                                <ul className={styles.levels}>
                                    <li><strong>Fácil:</strong> casi siempre juega al azar.</li>
                                    <li><strong>Medio:</strong> a veces se despista.</li>
                                    <li><strong>Difícil:</strong> siempre elige su mejor jugada.</li>
                                </ul>
                            </article>
                            <article className={styles.panel}>
                                <h3 className={styles.panelTitle}>Minimax</h3>
                                <p>Piensa varios turnos por delante, contando con tus respuestas.</p>
                                <ul className={styles.levels}>
                                    <li><strong>Fácil:</strong> ve 2 jugadas (la suya y tu respuesta).</li>
                                    <li><strong>Medio:</strong> ve 3 jugadas.</li>
                                    <li><strong>Difícil:</strong> ve 4 jugadas.</li>
                                </ul>
                            </article>
                        </div>
                    </section>

                    <div className={styles.cta}>
                        <Link
                            to="/"
                            className={`${btnStyles.btnCarved} ${formStyles.btnSubmit} ${formStyles.btnCreate} ${styles.ctaButton}`}
                        >
                            <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
                            ¡A jugar!
                        </Link>
                    </div>
                </main>
            </div>
        </div>
    );
};
