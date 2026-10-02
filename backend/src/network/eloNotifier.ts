import type { Server } from 'socket.io';
import { SocketEvents, type PlayerColor, type RoomSession } from '../../../shared';
import type { MatchEloUpdates } from './GameResultService';

const COLORS: PlayerColor[] = ['red', 'blue'];

export function notifyEloUpdates(io: Server, room: RoomSession, updates: MatchEloUpdates): void {
    for (const color of COLORS) {
        const player = room.players[color];
        if (!player || player.isAi) continue;
        io.to(player.socketId).emit(SocketEvents.ELO_UPDATED, updates[color]);
    }
}