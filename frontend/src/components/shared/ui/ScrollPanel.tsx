import React from 'react';
import styles from './ScrollPanel.module.css';

interface ScrollPanelProps {
    // Cabecera dentro del papel, encima del contenido (p. ej. las pestañas del lobby).
    header?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

// Panel con forma de pergamino (kakemono): papel entre dos rodillos de madera.
// Al montarse se "desenrolla". Sustituye a la antigua tarjeta plana, que se
// confundía con el papel del fondo.
export const ScrollPanel: React.FC<ScrollPanelProps> = ({ header, children, className = '' }) => (
    <div className={`${styles.scroll} ${className}`}>
        <div className={styles.roller} aria-hidden="true" />
        <div className={styles.paperWrap}>
            <div className={styles.paper}>
                {header && <div className={styles.header}>{header}</div>}
                <div className={styles.body}>{children}</div>
            </div>
        </div>
        <div className={styles.roller} aria-hidden="true" />
    </div>
);
