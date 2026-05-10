import { GameEngine } from "../game/GameEngine";

export class RoomManager {
    private static activeRooms: Map<string, GameEngine> = new Map();

    public static createRoom(roomId: string): GameEngine {
        const gameEngine = new GameEngine();
        this.activeRooms.set(roomId, gameEngine);
        return gameEngine;
    }

    public static getGameEngine(roomId: string): GameEngine | undefined {
        return this.activeRooms.get(roomId);
    }

    public static roomExists(roomId: string): boolean {
        return this.activeRooms.has(roomId);
    }

    public static deleteRoom(roomId: string): void {
        this.activeRooms.delete(roomId);
    }
    
}