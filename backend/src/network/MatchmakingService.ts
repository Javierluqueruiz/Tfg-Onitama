import { GameMode, PlayerProfile } from "../../../shared";
import { RoomManager } from "./RoomManager";

export interface MatchmakingResult {
    matchFound: boolean;
    roomId?: string;
    roomCode?: string;
    opponentId?: string;
}

export interface QueueEntry {
    socketId: string;
    name: string;
    elo: number;
    userId?: string;
}

//Sub-06.1: Cola de emparejamiento automático
export class MatchmakingService {

    private static registeredQueue: Record<GameMode, QueueEntry[]> = {
        casual: [],
        normal: [],
        fast: []
    };

    private static guestQueue: Record<GameMode, QueueEntry[]> = {
        casual: [],
        normal: [],
        fast: []
    };



    public static joinQueue(entry: QueueEntry, mode: GameMode): MatchmakingResult {
        this.leaveQueue(entry.socketId);
        const queue = entry.userId ? this.registeredQueue[mode] : this.guestQueue[mode];
        const match = this.findClosestByElo(queue, entry.elo);
        
        if (match) {
            queue.splice(match.index, 1);

            const hostProfile: PlayerProfile = { 
                socketId: match.entry.socketId, 
                name: match.entry.name, 
                userId: match.entry.userId, 
                elo: match.entry.userId ? match.entry.elo : undefined
            };

            const guestProfile: PlayerProfile = { 
                socketId: entry.socketId, 
                name: entry.name,
                userId: entry.userId,
                elo: entry.userId ? entry.elo : undefined
            };

            const newRoom = RoomManager.createRoom(hostProfile, mode);

            if (newRoom.players.red?.socketId === match.entry.socketId) {
                newRoom.players.blue = guestProfile;
            } else {
                newRoom.players.red = guestProfile;
            }

            return {
                matchFound: true,
                roomId: newRoom.roomId,
                roomCode: newRoom.roomCode,
                opponentId: match.entry.socketId
            };
        }

        queue.push(entry);
        return { matchFound: false };
    }

    private static findClosestByElo(queue: QueueEntry[], elo: number): { entry: QueueEntry; index: number } | null {
        if (queue.length === 0) return null;

        let bestIndex = 0;
        let bestDifference = Math.abs(queue[0].elo - elo);

        for (let i = 1; i < queue.length; i++) {
            const diff = Math.abs(queue[i].elo - elo);
            if (diff < bestDifference) {
                bestDifference = diff;
                bestIndex = i;
            }
        }

        return { entry: queue[bestIndex], index: bestIndex };
    }

    public static leaveQueue(socketId: string): void {
        const modes: GameMode[] = ['casual', 'normal', 'fast'];
        for (const mode of modes) {
            this.guestQueue[mode] = this.guestQueue[mode].filter(e => e.socketId !== socketId);
            this.registeredQueue[mode] = this.registeredQueue[mode].filter(e => e.socketId !== socketId);
        }
    }
}