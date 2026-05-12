import { PlayerProfile } from "../../../shared/types";
import { GameEngine } from "../game/GameEngine";

export interface RoomSession {
    roomId: string;
    gameEngine: GameEngine;
    roomCode: string;
    hostProfile: PlayerProfile;
    guestProfile?: PlayerProfile;
}

export class RoomManager {

    //Guarda las salas activas en memoria. A lo mejor se puede quitar el string, y dejar solo el RoomSession, pero por ahora lo dejo así para facilitar la búsqueda por id.
    private static activeRooms: Map<string, RoomSession> = new Map();

    public static createRoom(hostProfile: PlayerProfile): RoomSession { 
        let roomCode: string = '';
        let isUnique: boolean = false;
    
        do {
            roomCode = Math.random().toString(36).substring(2,7).toUpperCase();

            const existingRoom = this.getRoomByCode(roomCode);
            if (!existingRoom) {
                isUnique = true;
            }
        } while (!isUnique);


        //Genera un id de sala aleatorio. Se puede investigar otras formas de generar ids.
        const roomId = `room-${Math.random().toString(36).substring(2, 17)}`; 

        //Crea una sala con un nuevo GameEngine.
        const newRoom: RoomSession = {
            roomId,
            gameEngine: new GameEngine(),
            roomCode,
            hostProfile
        };

        this.activeRooms.set(roomId, newRoom);
        return newRoom;
    }

    public static getRoomByCode(roomCode: string): RoomSession | undefined {
        for (const room of this.activeRooms.values()) {
            if (room.roomCode === roomCode) {
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