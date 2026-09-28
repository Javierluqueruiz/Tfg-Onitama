import React from 'react';
import styles from './Modals.module.css';
import btnStyles from '../../../shared/ui/Button.module.css';

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
        <div className={styles.rematchBanner}>
            {rematchState === 'none' && (
                <>
                    <h3 className={styles.rematchTitle}>Partida Finalizada</h3>
                    <p className={styles.rematchText}>¿Quieres solicitar una revancha?</p>
                    <button className={`${styles.btnRematchOffer} ${btnStyles.btnCarved}`}  onClick={onOfferRematch}>
                        <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
                        Solicitar Revancha
                    </button>
                </>
            )}

            {rematchState === 'offered' && (
                <div className={styles.rematchWaiting}>
                    <span className={styles.rematchIcon}>⏳</span>
                    Esperando respuesta del rival...
                </div>
            )}

            {rematchState === 'received' && (
                <>
                    <h3 className={styles.rematchTitleReceived}>¡Nueva propuesta!</h3>
                    <p className={styles.rematchText}>El rival quiere la revancha</p>
                    <div className={styles.rematchButtons}>
                        <button className={`${styles.btnAccept} ${btnStyles.btnCarved}`} onClick={onAcceptRematch}>
                            <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
                            Aceptar
                        </button>
                        <button className={`${styles.btnReject} ${btnStyles.btnCarved}`} onClick={onRejectRematch}>
                            <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
                            Rechazar
                        </button>
                    </div>
                </>
            )}

            {rematchState === 'rejected' && (
                <div className={styles.rematchRejected}>
                    <span className={styles.rematchIcon}>❌</span>
                    Revancha rechazada.
                </div>
            )}
        </div>
    );
};