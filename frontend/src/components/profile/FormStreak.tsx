import React from 'react';
import type { LastMatchEntry } from '../../../../shared';
import styles from './FormStreak.module.css';

interface FormStreakProps {
    matches: LastMatchEntry[];
}

const RESULT_LABEL: Record<LastMatchEntry['result'], string> = { win: 'V', loss: 'D', draw: 'E' };

export const FormStreak: React.FC<FormStreakProps> = ({ matches }) => {
    // Solo partidas clasificatorias -- una victoria contra un invitado no dice
    // nada sobre tu nivel real, no debería distorsionar la racha.
    const ranked = matches.filter((match) => match.ranked);
    if (ranked.length === 0) return null;

    // Más reciente a la izquierda -- lastMatches ya llega en ese orden, no hace falta invertir.
    const recent = ranked.slice(0, 10);

    return (
        <div className={styles.wrapper}>
            <h3 className={styles.title}>Racha de resultados recientes</h3>
            <div className={styles.streak} aria-label="Racha de resultados recientes">
                {recent.map((match, index) => (
                    <span
                        key={index}
                        className={`${styles.chip} ${styles[match.result]}`}
                        title={`vs ${match.opponentName}`}
                    >
                        {RESULT_LABEL[match.result]}
                    </span>
                ))}
            </div>
            <p className={styles.caption}>Solo partidas clasificatorias (contra otras cuentas registradas).</p>
        </div>
    );
};