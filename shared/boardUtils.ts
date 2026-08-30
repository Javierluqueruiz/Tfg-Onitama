import { Position } from "./domain.types";

export const BOARD_SIZE = 5;

export function isOutOfBounds(pos: Position): boolean {
    return pos.x < 0 || pos.x >= BOARD_SIZE || pos.y < 0 || pos.y >= BOARD_SIZE;
}