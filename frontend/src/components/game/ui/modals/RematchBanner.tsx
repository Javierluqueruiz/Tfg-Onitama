import React from 'react';
import styles from './Modals.module.css';

interface RematchBannerProps {
    rematchState: 'none' | 'offered' | 'received' | 'rejected';
    onOfferRematch: () => void;
    onAcceptRematch: () => void;
    onRejectRematch: () => void;
}

export const RematchBanner: React.FC<RematchBannerProps> = ({
    rematchState,
    onOfferRematch,
    onAcceptRematch,
    onRejectRematch
}) => {
    return (
        <div className={styles.rematchBanner} role="status">
            {rematchState === 'none' && (
                <>
                    <h3 className={styles.rematchTitle}>Partida Finalizada</h3>
                    <p className={styles.rematchText}>¿Quieres solicitar una revancha?</p>
                    <button type="button" className={styles.btnRematchOffer} onClick={onOfferRematch}>
                        Solicitar Revancha
                    </button>
                </>
            )}

            {rematchState === 'offered' && (
                <div className={styles.rematchWaiting}>
                                        Esperando respuesta del rival...
                </div>
            )}

            {rematchState === 'received' && (
                <>
                    <h3 className={styles.rematchTitleReceived}>¡Nueva propuesta!</h3>
                    <p className={styles.rematchText}>El rival quiere la revancha</p>
                    <div className={styles.rematchButtons}>
                        <button type="button" className={styles.btnAccept} onClick={onAcceptRematch}>
                            Aceptar
                        </button>
                        <button type="button" className={styles.btnReject} onClick={onRejectRematch}>
                            Rechazar
                        </button>
                    </div>
                </>
            )}

            {rematchState === 'rejected' && (
                <div className={styles.rematchRejected}>
                                        Revancha rechazada.
                </div>
            )}
        </div>
    );
};