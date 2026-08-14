import React from 'react';
import type { GameState } from '../../../../shared';
import { BoardView } from './BoardView';

interface GameScreenProps {
    gameState: GameState;
}

export const GameScreen: React.FC<GameScreenProps> = ({ gameState })  => {

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
                <h2>Sala de Juego</h2>
                <h3 style={{ margin: 0 }}>
                    Turno actual: <span style={{ color: gameState.currentTurn === 'red' ? 'red' : 'blue' }}>
                        {gameState.currentTurn}
                    </span>
                </h3>
            </div>
            <BoardView board={gameState.board} />
        </div>

    );
};