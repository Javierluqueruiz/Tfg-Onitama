import { type Board, type Card, type PlayerColor, type Position, isOutOfBounds, getCellAt } from '../../../../../shared';

export function getValidTargets(
    board: Board,
    selectedCard: Card | null,
    selectedPiece: Position | null,
    localColor: PlayerColor | null,
    isLocalRed: boolean
): Position[] {
    if (!selectedCard || !selectedPiece) return [];

    const multiplier = isLocalRed ? -1 : 1;

    return selectedCard.moves.map(move => ({
        x: selectedPiece.x + move.x * multiplier,
        y: selectedPiece.y + move.y * multiplier
    })).filter(pos => {
        if (isOutOfBounds(pos)) return false;
        const destCell = getCellAt(board, pos);
        return !destCell || destCell.color !== localColor; // vacía o pieza rival (captura)
    });
}