import { GameMode, PlayerProfile, SocketEvents } from "../../../shared";
import { RoomManager } from "./RoomManager";
import { Server } from "socket.io";
import { GameEngine } from "../game/GameEngine";

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

interface InternalQueueEntry extends QueueEntry {
    joinedAt: number; // Timestamp para gestionar el tiempo de espera
}

//Sub-09.2
const BASE_TOLERANCE = 100; // Diferencia de ELO base para emparejar
const TOLERANCE_INCREMENT = 20; // Incremento de tolerancia por cada segundo en la cola
const MAX_TOLERANCE = 800; // Tolerancia máxima de diferencia de ELO
const SEARCH_INTERVAL = 3000; // Intervalo de búsqueda en milisegundos (3 segundos)

//Sub-06.1: Cola de emparejamiento automático
export class MatchmakingService {

    private static registeredQueue: Record<GameMode, InternalQueueEntry[]> = {
        casual: [],
        normal: [],
        fast: []
    };

    private static guestQueue: Record<GameMode, InternalQueueEntry[]> = {
        casual: [],
        normal: [],
        fast: []
    };

    private static io: Server | null = null;
    private static searchInterval: ReturnType<typeof setInterval> | null = null;

    public static joinQueue(entry: QueueEntry, mode: GameMode, io?: Server): MatchmakingResult {
        if (io) this.ensureSweepRunning(io);

        this.leaveQueue(entry.socketId);
        const fullEntry: InternalQueueEntry = { ...entry, joinedAt: Date.now() };
        const queue = fullEntry.userId ? this.registeredQueue[mode] : this.guestQueue[mode];

        const match = this.findBestMatch(queue, fullEntry);
        if (match) {
            queue.splice(match.index, 1);
            return this.createMatch(fullEntry, match.entry, mode);
        }

        queue.push(fullEntry);
        return { matchFound: false };
    }

    public static leaveQueue(socketId: string): void {
        const modes: GameMode[] = ['casual', 'normal', 'fast'];
        for (const mode of modes) {
            this.guestQueue[mode] = this.guestQueue[mode].filter(e => e.socketId !== socketId);
            this.registeredQueue[mode] = this.registeredQueue[mode].filter(e => e.socketId !== socketId);
        }
    }

    
    private static ensureSweepRunning(io: Server): void {
        this.io = io;
        if (this.searchInterval) return;
        this.searchInterval = setInterval(() => this.runMatchmakingSweep(), SEARCH_INTERVAL);
    }

    public static stopMatchmakingLoop(): void {
        if (this.searchInterval) clearInterval(this.searchInterval);
        this.searchInterval = null;
        this.io = null;
    }

    public static runMatchmakingSweep(): void {
        const modes: GameMode[] = ['casual', 'normal', 'fast'];
        for (const mode of modes) {
            this.sweepQueue(this.registeredQueue[mode], mode);
            this.sweepQueue(this.guestQueue[mode], mode);
        }
    }

    private static sweepQueue(queue: InternalQueueEntry[], mode: GameMode): void {
        let matched = true;
        while (matched && queue.length >= 2) {
            matched = false;
            for (let i = 0; i < queue.length; i++) {
                const match = this.findBestMatch(queue, queue[i], i);
                if (match) {
                    const [firstIndex, secondIndex] = i < match.index ? [i, match.index] : [match.index, i];
                    const entryA = queue[firstIndex];
                    const entryB = queue[secondIndex];
                    queue.splice(secondIndex, 1);
                    queue.splice(firstIndex, 1);
                    this.createMatch(entryA, entryB, mode);
                    matched = true;
                    break; 
                }
            }
        }
    }

    private static createMatch(entryA: InternalQueueEntry, entryB: InternalQueueEntry, mode: GameMode): MatchmakingResult {
        const profileA: PlayerProfile = {
            socketId: entryA.socketId,
            name: entryA.name,
            userId: entryA.userId,
            elo: entryA.userId ? entryA.elo : undefined
        };

        const profileB: PlayerProfile = {
            socketId: entryB.socketId,
            name: entryB.name,
            userId: entryB.userId,
            elo: entryB.userId ? entryB.elo : undefined
        };

        const newRoom = RoomManager.createRoom(profileA, mode);
        if (newRoom.players.red?.socketId === profileA.socketId) {
            newRoom.players.blue = profileB;
        } else {
            newRoom.players.red = profileB;
        }

        if (this.io) {
            this.notifyMatch(this.io, newRoom.roomId, newRoom.roomCode, mode, entryA.socketId, entryB.socketId);
        }

        return {
            matchFound: true,
            roomId: newRoom.roomId,
            roomCode: newRoom.roomCode,
            opponentId: entryB.socketId
        };
    }

    private static notifyMatch(io: Server, roomId: string, roomCode: string, mode: GameMode, socketIdA: string, socketIdB: string): void {
        const socketA = io.sockets.sockets.get(socketIdA);
        const socketB = io.sockets.sockets.get(socketIdB);
        socketA?.join(roomId);
        socketB?.join(roomId);

        io.to(roomId).emit(SocketEvents.MATCH_FOUND, { roomId, roomCode, mode }); 

        const room = RoomManager.getRoomById(roomId);
        if (!room) return;

        room.gameState = GameEngine.createNewGame(room.roomId);
        room.gameState.timeRemaining = RoomManager.getInitialTimeForMode(mode);
        io.to(roomId).emit(SocketEvents.GAME_START, { gameState: room.gameState, players: room.players });

        if (mode != 'casual') {
            RoomManager.startGameTimer(roomId, 
                (timeRemaining) => io.to(roomId).emit(SocketEvents.TIME_TICK, { timeRemaining }),
                (finalState) => io.to(roomId).emit(SocketEvents.GAME_UPDATE, { gameState: finalState })
            );
        }
    }

    private static getTolerance(entry: InternalQueueEntry): number {
        const secondsInQueue = (Date.now() - entry.joinedAt) / 1000;
        return Math.min(BASE_TOLERANCE + secondsInQueue * TOLERANCE_INCREMENT, MAX_TOLERANCE);
    }

    private static canMatch(entryA: InternalQueueEntry, entryB: InternalQueueEntry): boolean {
        const diff = Math.abs(entryA.elo - entryB.elo);
        return diff <= Math.min(this.getTolerance(entryA), this.getTolerance(entryB)); 
    }

    private static findBestMatch(queue: InternalQueueEntry[], entry: InternalQueueEntry, excludeIndex = -1): { entry: InternalQueueEntry; index: number } | null {
        let bestIndex = -1;
        let bestDifference = Infinity;

        for (let i = 0; i < queue.length; i++) {
            if (i === excludeIndex) continue;
            const candidate = queue[i];
            if (!this.canMatch(entry, candidate)) continue;

            const diff = Math.abs(candidate.elo - entry.elo);
            if (diff < bestDifference) {
                bestDifference = diff;
                bestIndex = i;
            }
        }
        return bestIndex === -1 ? null : { entry: queue[bestIndex], index: bestIndex };
    }

}