import React from 'react';
import styles from './Modals.module.css';

interface DiscardBannerProps {
    mustDiscard: boolean;
}

export const DiscardBanner: React.FC<DiscardBannerProps> = ({ mustDiscard }) => {
    if (!mustDiscard) return null;

    return (
        <div className={styles.discardBanner}>
            <p>No tienes ningún movimiento válido. Elige una de tus cartas para descartarla</p>
        </div>
    );
};