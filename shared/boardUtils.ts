import type { Position, Board, Cell } from "./domain.types";

export const BOARD_SIZE = 5;

export function isOutOfBounds(pos: Position): boolean {
    return pos.x < 0 || pos.x >= BOARD_SIZE || pos.y < 0 || pos.y >= BOARD_SIZE;
}

export function getCellAt(board: Board, pos: Position): Cell {
    return board[pos.y][pos.x];
}

export function setCellAt(board: Board, pos: Position, cell: Cell): void {
    board[pos.y][pos.x] = cell;
}