import React from 'react';
import type { Board } from '../../../../shared';
import styles from './BoardView.module.css';

interface BoardViewProps {
    board: Board;
}

export const BoardView: React.FC<BoardViewProps> = ({ board }) => {
    return (
        <div className={styles.boardContainer}>
            {board.map((row, y) => ( 
                    row.map((cell, x) => (
                        <div 
                            key={`cell-${x}-${y}`}
                            className={styles.cell}
                        >
                            {cell ? (
                                <div className={`
                                    ${styles.piece}
                                    ${cell.color === 'red' ? styles.pieceRed : styles.pieceBlue}
                                    ${cell.type === 'master' ? styles.master : styles.student}
                                `}>
                                    {cell.type === 'master' ? 'M' : 'E'}
                                </div>
                            ) : (
                                <span className={styles.emptyCell}>·</span>
                            )}
                            </div>
                    ))
                
            ))}
        </div>
    );
};