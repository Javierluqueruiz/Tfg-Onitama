import React from 'react';
import type { Board, Position } from '../../../../shared';
import { BoardView } from '../game/ui/board/BoardView';
import styles from './MiniBoard.module.css';

interface MiniBoardProps {
    board: Board;
    label: string;
    selectedPiece?: Position | null;
    validTargets?: Position[];
    markedCells?: Position[];
    scale?: number;
}

const noop = () => {};

// Tablero de solo lectura para ilustrar las reglas: reutiliza BoardView tal cual
// (mismas piezas y casillas que en partida) y solo lo reduce con `zoom`.
export const MiniBoard: React.FC<MiniBoardProps> = ({ board, label, selectedPiece = null, validTargets = [], markedCells = [], scale = 0.7 }) => (
    <div className={styles.miniBoard} style={{ zoom: scale }} role="group" aria-label={label}>
        <BoardView
            board={board}
            localColor={null}
            currentTurn={null}
            selectedPiece={selectedPiece}
            validTargets={validTargets}
            markedCells={markedCells}
            onCellClick={noop}
        />
    </div>
);
