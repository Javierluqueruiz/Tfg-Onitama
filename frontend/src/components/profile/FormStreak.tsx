import React from 'react';
import type { LastMatchEntry } from '../../../../shared';
import styles from './FormStreak.module.css';

interface FormStreakProps {
    matches: LastMatchEntry[];
}

const RESULT_LABEL: Record<LastMatchEntry['result'], string> = { win: 'V', loss: 'D', draw: 'E' };

export const FormStreak: React.FC<FormStreakProps> = ({ matches }) => {
    if (matches.length === 0) return null;

    // Se muestran de más antigua a más reciente (izquierda -> derecha), como
    // se lee el tiempo -- lastMatches llega al revés (más reciente primero),
    // así que se invierte aquí, no en el origen.
    const ordered = [...matches].slice(0, 10).reverse();

    return (
        <div className={styles.streak} aria-label="Racha de resultados recientes">
            {ordered.map((match, index) => (
                <span
                    key={index}
                    className={`${styles.chip} ${styles[match.result]}`}
                    title={`vs ${match.opponentName}`}
                >
                    {RESULT_LABEL[match.result]}
                </span>
            ))}
        </div>
    );
};