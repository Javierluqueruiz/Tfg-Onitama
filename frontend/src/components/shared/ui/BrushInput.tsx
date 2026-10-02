import React from 'react';
import styles from './Input.module.css';

interface BrushInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    // Marca el campo como erróneo (la pincelada se queda fija en rojo).
    error?: boolean;
    // 'code': campo grande, centrado y espaciado, para códigos de sala.
    variant?: 'default' | 'code';
}

// Campo de texto con línea inferior que se rellena con una pincelada de tinta al
// enfocarlo (ver Input.module.css). Encapsula el <input> y el trazo SVG, que tienen
// que ser hermanos para que el selector `:focus ~ .brush` funcione.
export const BrushInput: React.FC<BrushInputProps> = ({ error = false, variant = 'default', className = '', ...inputProps }) => (
    <div className={`${styles.fieldWrap} ${error ? styles.error : ''}`}>
        <input
            {...inputProps}
            className={`${styles.field} ${styles.fieldBrush} ${variant === 'code' ? styles.fieldCode : ''} ${className}`}
        />
        <svg className={styles.brush} viewBox="0 0 320 10" preserveAspectRatio="none" aria-hidden="true">
            <path d="M2 6 C8 2,22 1,36 3 C58 6,80 7,102 4 C130 1,158 2,186 5 C214 8,242 7,266 4 C284 1,304 1,316 4 C304 8,282 9,258 8 C230 6,202 9,174 7 C146 5,116 8,88 8 C58 7,28 9,10 8 C4 7,2 7,2 6 Z" />
        </svg>
    </div>
);
