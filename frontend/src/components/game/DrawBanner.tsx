import React from 'react';
import styles from './GameScreen.module.css';

interface DrawBannerProps {
    drawOfferReceived: boolean;
    drawRejectedMessage: boolean;
    onAcceptDraw: () => void;
    onRejectDraw: () => void;
}

export const DrawBanner: React.FC<DrawBannerProps> = ({ 
drawOfferReceived, drawRejectedMessage, onAcceptDraw, onRejectDraw
}) => {

    if (!drawOfferReceived && !drawRejectedMessage) return null;

    return (
        <>
        {drawRejectedMessage && (
                <div className={styles.toastError}>
                    El oponente ha rechazado tu oferta de empate. La partida continúa.
                </div>
            )}

            {drawOfferReceived && ( 
                <div className={styles.drawBanner}>
                    <p>Tu oponente ha ofrecido un empate. ¿Aceptas?</p>
                    <div className={styles.drawActions}>
                        <button className={styles.btnAccept} onClick={onAcceptDraw}>Aceptar</button>
                        <button className={styles.btnReject} onClick={onRejectDraw}>Rechazar</button>
                    </div>
                </div>
            )}
        </>
    )
}