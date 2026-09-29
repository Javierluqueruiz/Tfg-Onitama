import React from 'react';
import { ELO_RANKS, type EloRank } from '../../../../shared';
import { RankBadge } from '../profile/RankBadge';
import styles from './EloSection.module.css';

// Ejemplos con 1000 puntos y K = 32 (tus primeras 30 partidas), calculados con la
// misma fórmula que EloService en el backend.
const EXAMPLES = [
    { opponent: 1000, win: '+16', draw: '0', loss: '−16' },
    { opponent: 1200, win: '+24', draw: '+8', loss: '−8' },
    { opponent: 800, win: '+8', draw: '−8', loss: '−24' },
];

// De Bronce a Gran Maestro, con el intervalo de puntos de cada rango.
const LADDER = [...ELO_RANKS].reverse();

const rangeLabel =(rank: EloRank, index: number): string => {
    const next = LADDER[index + 1];
    if (!next) return `${rank.minElo} o más`;
    if (!Number.isFinite(rank.minElo)) return `Menos de ${next.minElo}`;
    return `${rank.minElo} – ${next.minElo - 1}`;
};

export const EloSection: React.FC = () => (
    <>
        <p className={styles.lead}>
            En las partidas contra otras personas con cuenta, cada resultado mueve tu <strong>puntuación ELO</strong>, un
            número que estima tu nivel. Todos empiezan con <strong>1000 puntos</strong>.
        </p>

        <div className={styles.twoCols}>
            <article className={styles.panel}>
                <h3 className={styles.panelTitle}>Cómo sube y baja</h3>
                <p>
                    Ganar suma y perder resta, y <strong>cuánto depende de tu rival</strong>: ganar a alguien más fuerte
                    da más puntos, y perder contra alguien más débil te quita más. Un empate cuenta como medio punto.
                </p>
                <p>
                    Tus <strong>primeras 30 partidas</strong> mueven más la puntuación, para que encuentres tu nivel
                    pronto. Después los cambios se moderan, y más aún a partir de 1400.
                </p>
            </article>

            <article className={styles.panel}>
                <h3 className={styles.panelTitle}>Qué partidas puntúan</h3>
                <p>
                    Las que juegas contra otra persona <strong>con cuenta</strong>, en cualquier modo: casual, normal,
                    rápido o sala privada.
                </p>
                <p>
                    Contra un invitado la partida queda en tu historial como amistosa, sin cambiar tu ELO. Contra la IA
                    no puntúa.
                </p>
            </article>
        </div>

        <h3 className={styles.subTitle}>Un ejemplo</h3>
        <p className={styles.note}>Con 1000 puntos y en tus primeras 30 partidas, según el ELO del rival:</p>
        <div className={styles.tableWrap}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th scope="col">Rival</th>
                        <th scope="col">Si ganas</th>
                        <th scope="col">Si empatas</th>
                        <th scope="col">Si pierdes</th>
                    </tr>
                </thead>
                <tbody>
                    {EXAMPLES.map(row => (
                        <tr key={row.opponent}>
                            <th scope="row">{row.opponent} ELO</th>
                            <td className={styles.gain}>{row.win}</td>
                            <td>{row.draw}</td>
                            <td className={styles.loss}>{row.loss}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <h3 className={styles.subTitle}>Los rangos</h3>
        <p className={styles.note}>Tu rango depende solo de tu ELO: sube y baja con él.</p>
        <ol className={styles.ladder}>
            {LADDER.map((rank, index) => (
                <li key={rank.tier} className={styles.rank}>
                    <RankBadge tier={rank.tier} size={64} />
                    <span className={styles.rankName}>{rank.name}</span>
                    <span className={styles.rankRange}>{rangeLabel(rank, index)}</span>
                </li>
            ))}
        </ol>
    </>
);
