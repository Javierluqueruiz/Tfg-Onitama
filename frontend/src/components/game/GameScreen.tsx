import React from 'react';
import type { GameState } from '../../../../shared';
import { BoardView } from './BoardView';
import { CardView } from './CardView';
import { PlayerInfo } from './PlayerInfo';

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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <PlayerInfo
                    playerName="Jugador Azul"
                    color="blue"
                    isActive={gameState.currentTurn === 'blue'}
                />
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    {blueCards.map((card, index) => (
                        <CardView key={`blue-card-${index}`} card={card} faction="blue" />
                    ))}
                </div>
            </div>

            {/* Zona Central: Tablero + Carta Neutral */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '50px',
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
            }}>
                <BoardView board={board} />
                
                {/* Contenedor para la carta neutral en la mesa */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 'bold', color: '#7f8c8d', fontSize: '14px', textTransform: 'uppercase' }}>
                        Mesa (Siguiente)
                    </span>
                    {neutralCard && (
                        <CardView card={neutralCard} faction="neutral" />
                    )}
                </div>
            </div>

            {/* Zona del Jugador Local */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <PlayerInfo
                    playerName="Jugador Rojo"
                    color="red"
                    isActive={gameState.currentTurn === 'red'}
                />
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    {redCards.map((card, index) => (
                        <CardView key={`red-card-${index}`} card={card} faction="red" />
                    ))}
                </div>
            </div>
        </div>

    );
};