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

const PieceIconDefs: React.FC = () => (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
            <symbol id="pieceStudent" viewBox="0 0 44 56">
                <ellipse className={styles.plinthShadow} cx="22" cy="51.5" rx="14" ry="3" />
                <ellipse cx="22" cy="50" rx="13" ry="4.5" />
                <path d="M15,46 Q13,30 17,22 L27,22 Q31,30 29,46 Z"/>
                <circle cx="22" cy="14" r="8.5" />
                <ellipse className={styles.sheen} cx="19" cy="11" rx="2.6" ry="3.6" />
            </symbol>
            <symbol id="pieceMaster" viewBox="0 0 44 56">
                <ellipse className={styles.plinthShadow} cx="22" cy="52" rx="16" ry="3.2" />
                <ellipse cx="22" cy="50" rx="15" ry="5" />
                <path d="M13,45 Q11,28 16,20 L28,20 Q33,28 31,45 Z" />
                <ellipse cx="22" cy="20" rx="10.5" ry="3.2" />
                <circle cx="22" cy="10" r="7.5" />
                <circle cx="22" cy="2.5" r="3" />
                <ellipse className={styles.sheen} cx="19" cy="7" rx="2.4" ry="3.4" />
            </symbol>
        </defs>
    </svg>
);

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
            <PieceIconDefs />
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
                        if (isValidTarget) cellClass += ` ${cell ? styles.validCapture : styles.validMove}`;
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
                                <div 
                                    className={pieceClass}
                                    role="img"
                                    aria-label={`${cell.type === 'master' ? 'Maestro' : 'Estudiante'} ${cell.color === 'red' ? 'Rojo' : 'Azul'}`}
                                >
                                    <svg 
                                        className={styles.pieceIcon}
                                        aria-hidden="true"
                                        style={{
                                            transform: isReversed ? 'rotate(180deg)' : 'none',
                                            transition: 'transform 0.5s ease',
                                        }}
                                    >
                                        <use href={cell.type === 'master' ? '#pieceMaster' : '#pieceStudent'} />
                                    </svg>
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