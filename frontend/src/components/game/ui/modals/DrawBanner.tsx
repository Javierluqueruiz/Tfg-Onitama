import React from 'react';
import styles from './Modals.module.css';

interface DrawBannerProps {
    drawOfferReceived: boolean;
    onAcceptDraw: () => void;
    onRejectDraw: () => void;
}

// Oferta de empate del rival: se muestra en el panel lateral, sin tapar el tablero.
export const DrawBanner: React.FC<DrawBannerProps> = ({ drawOfferReceived, onAcceptDraw, onRejectDraw }) => {
    if (!drawOfferReceived) return null;

    return (
        <div className={styles.drawBanner} role="alert">
            <p>Tu rival te propone tablas. ¿Aceptas?</p>
            <div className={styles.drawActions}>
                <button type="button" className={styles.btnAccept} onClick={onAcceptDraw}>
                    Aceptar
                </button>
                <button type="button" className={styles.btnReject} onClick={onRejectDraw}>
                    Rechazar
                </button>
            </div>
        </div>
    );
};

// Aviso pasajero (arriba, centrado) de que el rival ha rechazado tu oferta.
export const DrawRejectedToast: React.FC = () => (
    <div className={styles.toastError} role="status">
        El oponente ha rechazado tu oferta de empate. La partida continúa.
    </div>
);
