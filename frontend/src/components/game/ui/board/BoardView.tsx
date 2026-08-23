import React from 'react';
import type { Board, PlayerColor, Position } from '../../../../../../shared';
import styles from './BoardView.module.css';

interface BoardViewProps {
    board: Board;
    isReversed?: boolean; 
    localColor: PlayerColor | null;
    currentTurn: PlayerColor | null;
    selectedPiece: Position | null;
    validTargets: Position[];
    onCellClick: (position: Position) => void;
    lastMove?: {
        from: Position;
        to: Position;
    };
}

export const BoardView: React.FC<BoardViewProps> = ({ 
    board, 
    isReversed=false,
    localColor,
    currentTurn,
    selectedPiece,
    validTargets,
    onCellClick,
    lastMove
}) => {
    return (
        <div className={styles.boardContainer}>
            {board.map((row, y) => ( 
                    row.map((cell, x) => {
                        const isSelected = selectedPiece?.x === x && selectedPiece?.y === y;
                        const isValidTarget = validTargets.some(pos => pos.x === x && pos.y === y);
                        const isMyPiece = cell && cell.color === localColor;
                        const isMyTurn = currentTurn === localColor;

                        const isLastMove = lastMove && 
                            ((lastMove.from.x === x && lastMove.from.y === y) ||
                            (lastMove.to.x === x && lastMove.to.y === y)
                        );

                        let cellClass = styles.cell;
                        if (isValidTarget) cellClass += ` ${styles.validTarget}`;
                        if (isLastMove) cellClass += ` ${styles.lastMove}`;

                        let pieceClass = styles.piece;
                        if (cell) pieceClass += cell.color === 'red' ? ` ${styles.pieceRed}` : ` ${styles.pieceBlue}`;
                        if (cell) pieceClass += cell.type === 'master' ? ` ${styles.master}` : ` ${styles.student}`;
                        if (isSelected) pieceClass += ` ${styles.selectedPiece}`;
                        if (isMyPiece && isMyTurn) pieceClass += ` ${styles.clickablePiece}`;

                        return (
                        <div 
                            key={`cell-${x}-${y}`}
                            className={cellClass}
                            onClick={() => onCellClick({ x, y })}
                        >
                            {cell ? (
                                <div className={pieceClass}>
                                    <span style={{ 
                                        display: 'inline-block', 
                                        transform: isReversed ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.5s ease'
                                    }}>
                                        {cell.type === 'master' ? 'M' : 'E'}
                                    </span>
                                    
                                </div>
                            ) : (
                                <span className={styles.emptyCell}>·</span>
                            )}
                            </div>
                        );
                    })
                
            ))}
        </div>
    );
};