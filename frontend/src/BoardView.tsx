import React from 'react';
import type { Board } from '../../shared/types';

interface BoardViewProps {
    board: Board;
}

export const BoardView: React.FC<BoardViewProps> = ({ board }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {board.map((row, y) => (
                <div key={`row-${y}`} style={{display: 'flex', gap: '5px'}}>
                    
                    {row.map((cell, x) => (
                        <div
                            key={`cell-${x}-${y}`}
                            style={{
                                width: '100px',
                                height: '100px',
                                backgroundColor: '#f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                            }}
                        >
                            {cell ? (
                                <div style={{
                                    color: cell.color === 'red' ? 'red' : 'blue',
                                    fontWeight: 'bold',
                                }}>
                                    {cell.type === 'master' ? 'MAESTRO' : 'ESTUDIANTE'}
                                </div>
                            ) : (
                                <span style={{ color: '#ccc' }}>·</span>
                            )}
                            </div>
                    ))}
                </div>
            ))}
        </div>
    );
};