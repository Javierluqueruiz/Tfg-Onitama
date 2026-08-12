import React from 'react';
import type { GameState } from '../../../../shared';

interface GameScreenProps {
    gameState: GameState;
}

export const GameScreen: React.FC<GameScreenProps> = ({ gameState })  => {
    const { board, currentTurn, cards } = gameState;

    return (
        <div>
            <h2>Partida en curso - Turno de: <span style={{ color: currentTurn === 'red' ? 'red' : 'blue'}}>{currentTurn}</span></h2>

        </div>

    );
};