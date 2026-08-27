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
        <div className={styles.rematchBanner}>
            {rematchState === 'none' && (
                <>
                    <h3 style={{ color: '#000000', margin: '0 0 16px 0' }}>Partida Finalizada</h3>
                    <p style={{ color: '#010101', marginBottom: '20px', fontSize: '0.9rem' }}>¿Quieres solicitar una revancha?</p>
                    <button className={styles.btnExit} style={{ backgroundColor: '#fbbf24', color: '#111827', width: '100%' }} onClick={onOfferRematch}>
                        Solicitar Revancha
                    </button>
                </>
            )}

            {rematchState === 'offered' && (
                <div style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                    <span style={{ display: 'block', fontSize: '1.5rem', marginBottom: '8px' }}>⏳</span>
                    Esperando respuesta del rival...
                </div>
            )}

            {rematchState === 'received' && (
                <>
                    <h3 style={{ color: '#4ade80', margin: '0 0 16px 0' }}>¡Nueva propuesta!</h3>
                    <p style={{ color: '#070707', marginBottom: '20px' }}>El rival quiere la revancha</p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button className={styles.btnExit} style={{ backgroundColor: '#4ade80', color: '#111827', flex: 1 }} onClick={onAcceptRematch}>
                            Aceptar
                        </button>
                        <button className={styles.btnExit} style={{ backgroundColor: '#f87171', color: '#111827', flex: 1 }} onClick={onRejectRematch}>
                            Rechazar
                        </button>
                    </div>
                </>
            )}

            {rematchState === 'rejected' && (
                <div style={{ color: '#f87171', fontWeight: 'bold' }}>
                    <span style={{ display: 'block', fontSize: '1.5rem', marginBottom: '8px' }}>❌</span>
                    Revancha rechazada.
                </div>
            )}
        </div>
    );
};