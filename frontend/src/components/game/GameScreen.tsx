import React from 'react';
import type { GameState } from '../../../../shared';
import { BoardView } from './BoardView';
import { CardView } from './CardView';

interface GameScreenProps {
    gameState: GameState;
}

export const GameScreen: React.FC<GameScreenProps> = ({ gameState })  => {
    const {board, currentTurn} = gameState;
    const redCards = gameState.cards.red;
    const blueCards = gameState.cards.blue;
    const neutralCard = gameState.cards.neutral;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
                <h2>Sala de Juego</h2>
                <h3 style={{ margin: 0 }}>
                    Turno actual: <span style={{ color: gameState.currentTurn === 'red' ? 'red' : 'blue' }}>
                        {currentTurn}
                    </span>
                </h3>
            </div>

            {/* Zona del Jugador Rival */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                {blueCards.map((card, index) => (
                    <CardView key={`blue-card-${index}`} card={card} faction="blue" />
                ))}
            </div>

            <BoardView board={board} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#7f8c8d', fontSize: '14px', textTransform: 'uppercase' }}>
                        Mesa (Siguiente)
                    </span>
                    {neutralCard && (
                        <CardView card={neutralCard} faction="neutral" />
                    )}
                </div>


            {/* Zona del Jugador Local */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                {redCards.map((card, index) => (
                    <CardView key={`red-card-${index}`} card={card} faction="red" />
                ))}
            </div>
        </div>

    );
};