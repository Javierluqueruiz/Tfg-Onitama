import { GameMode, PlayerProfile } from "../../../shared";
import { RoomManager } from "./RoomManager";

export interface MatchmakingResult {
    matchFound: boolean;
    roomId?: string;
    roomCode?: string;
    opponentId?: string;
}

//Sub-06.1: Cola de emparejamiento automático
export class MatchmakingService {

    private static queue: Record<GameMode, string[]> = {
        casual: [],
        normal: [],
        fast: []
    };

    public static joinQueue(socketId: string, mode: GameMode): MatchmakingResult {
        this.leaveQueue(socketId);

        const modeQueue = this.queue[mode];
        if (modeQueue.length > 0) {
            const opponentId = modeQueue.shift()!; // Jugador más antiguo

            const hostProfile: PlayerProfile = { socketId: opponentId, name: 'Invitado 1' };
            const guestProfile: PlayerProfile = { socketId, name: 'Invitado 2' };
            const newRoom = RoomManager.createRoom(hostProfile, mode);

            if (newRoom.players.red?.socketId === opponentId) {
                newRoom.players.blue = guestProfile;
            } else {
                newRoom.players.red = guestProfile;
            }

            return {
                matchFound: true,
                roomId: newRoom.roomId,
                roomCode: newRoom.roomCode,
                opponentId
            };
        }

        modeQueue.push(socketId);
        return { matchFound: false };
    }

    public static leaveQueue(socketId: string): void {
        const modes: GameMode[] = ['casual', 'normal', 'fast'];
        for (const mode of modes) {
            this.queue[mode] = this.queue[mode].filter(id => id !== socketId);
        }
    }
}