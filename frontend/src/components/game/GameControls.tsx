import React from "react";
import styles from "./GameScreen.module.css";

interface GameControlsProps {
    status: string;
    isGameOver: boolean;
    drawOfferSent: boolean;
    drawOfferReceived: boolean;
    onOfferDraw: () => void;
    onSurrender: () => void;
    onExit: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
    status,
    isGameOver,
    drawOfferSent,
    drawOfferReceived,
    onOfferDraw,
    onSurrender,
    onExit
}) => {
    return (
        <div className={styles.gameControls}>
            {status !== 'finished' && (
                <button
                    className={styles.btnOfferDraw}
                    onClick={onOfferDraw}
                    disabled={drawOfferSent || drawOfferReceived || isGameOver}
                >
                    {drawOfferSent ? 'Oferta de Empate Enviada' : 'Ofrecer Empate'}
                </button>
            )}

            {status === 'finished' ? (
                <button 
                    className={styles.btnExit}
                    onClick={onExit}>
                    Salir de la Partida
                </button>
            ) : (

                <button
                    className={styles.btnSurrender}
                    onClick={onSurrender}
                    disabled={isGameOver}
                >
                    Rendirse
                </button>
            )}
        </div>
    );
};
