import React from 'react';
import type { Card } from '../../../../shared';
import styles from './CardView.module.css';

interface CardViewProps {
    card: Card;
    faction?: 'red' | 'blue' | 'neutral';
}

export const CardView: React.FC<CardViewProps> = ({ card, faction='neutral' }) => {
    const gridRows = [0, 1, 2, 3, 4];
    const gridCols = [0, 1, 2, 3, 4];

    const CENTER_X = 2;
    const CENTER_Y = 2;

    const isValidMove = (x:number, y:number) => {
        return card.moves.some(move => {
            return (CENTER_X + move.x === x) && (CENTER_Y + move.y === y);
        });
    };

    const factionClass = faction === 'red' ? styles.redFaction
        : faction === 'blue' ? styles.blueFaction
        : styles.neutralFaction;
    
    return (
        <div className={`${styles.cardContainer} ${factionClass}`}>
            <h4 className={styles.cardTitle}>{card.name}</h4>

            <div className={styles.miniGrid}>
                {gridRows.map(y => (
                    gridCols.map(x => {
                        const isCenter = (x === CENTER_X && y === CENTER_Y);
                        const isMove = isValidMove(x, y);

                        let cellClass = styles.gridCell;
                        if (isCenter) cellClass += ` ${styles.centerPiece}`;
                        else if (isMove) cellClass += ` ${styles.validMove}`;

                        return(
                            <div key={`mini-${x}-${y}`} className={cellClass}/>
                        );
                    })
                ))}
            </div>
        </div>
    )
};