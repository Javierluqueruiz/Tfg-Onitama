import { GameEngine } from "../game/GameEngine";

export interface RoomSession {
    roomId: string;
    gameEngine: GameEngine;
    password: string;
}

export class RoomManager {
    private static activeRooms: Map<string, RoomSession> = new Map();

    public static createRoom(password: string): RoomSession | null {

        for (const room of this.activeRooms.values()) {
            if (room.password === password) {
                return null;
            }
        }

        const roomId = `room-${Math.random().toString(36).substr(2, 15)}`;

        const newRoom: RoomSession = {
            roomId,
            gameEngine: new GameEngine(),
            password
        };

        this.activeRooms.set(roomId, newRoom);
        return newRoom;
    }

    public static getRoomByPassword(password: string): RoomSession | undefined {
        for (const room of this.activeRooms.values()) {
            if (room.password === password) {
                return room;
            }
        }
        return undefined;
    }

    public static roomExists(roomId: string): boolean {
        return this.activeRooms.has(roomId);
    }

    public static getRoomById(roomId: string): RoomSession | undefined {
        return this.activeRooms.get(roomId);
    }

    public static deleteRoom(roomId: string): void {
        this.activeRooms.delete(roomId);
    }
    
}