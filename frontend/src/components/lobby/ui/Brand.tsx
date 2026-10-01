import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Brand.module.css';

// Kanji del sello rojo (hanko). Provisional: se puede cambiar por otro.
const SEAL_KANJI = '鬼';

interface BrandProps {
    // En el lobby, pulsar la marca recarga la página (vuelve a la pantalla principal
    // aunque se esté dentro de crear/unirse a sala); en el resto, navega sin recargar.
    reload?: boolean;
}

// Pincelada bajo el título: mismo trazo que el campo de texto (Input.module.css).
const BrushStroke: React.FC = () => (
    <svg className={styles.stroke} viewBox="0 0 320 10" preserveAspectRatio="none" aria-hidden="true">
        <path d="M2 6 C8 2,22 1,36 3 C58 6,80 7,102 4 C130 1,158 2,186 5 C214 8,242 7,266 4 C284 1,304 1,316 4 C304 8,282 9,258 8 C230 6,202 9,174 7 C146 5,116 8,88 8 C58 7,28 9,10 8 C4 7,2 7,2 6 Z" />
    </svg>
);

export const Brand: React.FC<BrandProps> = ({ reload = false }) => {
    const content = (
        <>
            <span className={styles.seal} aria-hidden="true">{SEAL_KANJI}</span>
            <span className={styles.text}>
                <span className={styles.wordmark}>ONITAMA</span>
                <BrushStroke />
                <span className={styles.tagline}>El Camino del Maestro</span>
            </span>
        </>
    );

    return reload
        ? <a className={styles.brand} href="/" aria-label="Onitama, El Camino del Maestro">{content}</a>
        : <Link className={styles.brand} to="/" aria-label="Onitama, El Camino del Maestro">{content}</Link>;
};
