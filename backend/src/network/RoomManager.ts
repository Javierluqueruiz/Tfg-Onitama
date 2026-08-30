import { ChatMessage, GameMode, GameState, PlayerProfile, Winner } from "../../../shared";
import { GameEngine } from "../game/GameEngine";

export interface RoomSession {
    roomId: string;
    gameState: GameState;
    roomCode: string;
    mode: GameMode;
    chatHistory: ChatMessage[];
    players: {
        red: PlayerProfile | null;
        blue: PlayerProfile | null;
    }
}

export class RoomManager {

    //Guarda las salas activas en memoria. A lo mejor se puede quitar el string, y dejar solo el RoomSession, pero por ahora lo dejo así para facilitar la búsqueda por id.
    private static activeRooms: Map<string, RoomSession> = new Map();
    //Sub-05.2
    private static disconnectTimers: Map<string, NodeJS.Timeout> = new Map();
    //Sub-05.3
    private static gameTimers: Map<string, NodeJS.Timeout> = new Map();

    public static DISCONNECT_TIMEOUT_MS = 30000; 

    //Sub-06.1
    private static matchmakingQueue: Record<GameMode, string[]> = {
        casual: [],
        normal: [],
        fast: []
    };

    public static getActiveRooms(): Map<string, RoomSession> {
        return this.activeRooms;
    }

    private static generateUniqueRoomCode(): string {
        let roomCode: string;
        
        do {
            roomCode = Math.random().toString(36).substring(2,7).toUpperCase();
        } while (this.getRoomByCode(roomCode));

        return roomCode;
    }

    public static createRoom(hostProfile: PlayerProfile, mode: GameMode): RoomSession { 
        const roomCode = this.generateUniqueRoomCode();


        //Genera un id de sala aleatorio. Se puede investigar otras formas de generar ids.
        const roomId = `room-${Math.random().toString(36).substring(2, 17)}`; 

        const isHostRed = Math.random() < 0.5;

        const newRoom: RoomSession = {
            roomId,
            gameState: null as unknown as GameState, // Inicialmente null, se establecerá cuando se cree un nuevo juego.
            roomCode,
            mode,
            chatHistory: [],
            players: {
                red: isHostRed ? hostProfile : null,
                blue: isHostRed ? null : hostProfile
            }
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

    public static getRoomBySocketId(socketId: string): RoomSession | undefined {
        for (const room of this.activeRooms.values()) {
            if (room.players.red?.socketId === socketId || room.players.blue?.socketId === socketId) {
                return room;
            }
        }  
    }

    private static finishGame(room: RoomSession, winner: Winner): GameState {
        room.gameState = {
            ...room.gameState,
            status: 'finished',
            winner: winner
        };
        return room.gameState;
    }

    //Sub-05.1
    public static surrenderGame(roomId: string, surrenderingPlayerSocketId: string): GameState | null {
        const room = this.getRoomById(roomId);
        if (!room || room.gameState.status === 'finished') return null;

        const isRed = room.players.red?.socketId === surrenderingPlayerSocketId;
        const winner = isRed ? 'blue' : 'red';

        return this.finishGame(room, winner);
    }
    
    //SUB-05.2: Desconexión
    public static setDisconnectTimer(roomId: string, timer: NodeJS.Timeout): void {
        this.disconnectTimers.set(roomId, timer);
    }

    public static clearDisconnectTimer(roomId: string): void {
        const timer = this.disconnectTimers.get(roomId);
        if (timer) {
            clearTimeout(timer);
            this.disconnectTimers.delete(roomId);
        }
    }

    //Sub-05.2: Reconexión 
    public static reconnectPlayer(roomId: string, oldSocketId: string, newSocketId: string): RoomSession | null {
        const room = this.getRoomById(roomId);

        if (!room || room.gameState.status === 'finished') return null;

        if (room.players.red?.socketId === oldSocketId) {
            room.players.red.socketId = newSocketId;
        } else if (room.players.blue?.socketId === oldSocketId) {
            room.players.blue.socketId = newSocketId;
        } else {
            return null;
        }

        this.clearDisconnectTimer(roomId);

        return room;
    }
    
    //Sub-05.3: Temporizador de juego
    public static startGameTimer(
        roomId: string,
        onTick: (remainingTime: { red: number; blue: number }) => void,
        onTimeUp: (finalState: GameState) => void
    ): void {
        if (this.gameTimers.has(roomId)) {
            clearTimeout(this.gameTimers.get(roomId)!);
        }

        const timer = setInterval(() => {
            const room = this.getRoomById(roomId);
            if (!room || room.gameState.status === 'finished') {
                this.stopGameTimer(roomId);
                return;
            }

            const activeColor = room.gameState.currentTurn;
            room.gameState.timeRemaining[activeColor] -= 1;

            onTick(room.gameState.timeRemaining);

            if(room.gameState.timeRemaining[activeColor] <= 0) {
                this.stopGameTimer(roomId);
                room.gameState.status = 'finished';
                room.gameState.winner = activeColor === 'red' ? 'blue' : 'red';
                onTimeUp(room.gameState);
            }
        }, 1000);

        this.gameTimers.set(roomId, timer);
    }


    public static stopGameTimer(roomId: string): void {
        const timer = this.gameTimers.get(roomId);
        if (timer) {
            clearInterval(timer);
            this.gameTimers.delete(roomId);
        }
    }

    //Sub-05.4
    public static resolveDraw(roomId: string): GameState | null {
        const room = this.getRoomById(roomId);
        if (!room || room.gameState.status === 'finished') return null;

        return this.finishGame(room, 'draw');
    }

    //Sub-06.1
    public static joinQueue(socketId: string, mode: GameMode): {matchFound: boolean, roomId?: string, roomCode?: string, opponentId?: string} {
        this.leaveQueue(socketId); 

        const queue = this.matchmakingQueue[mode];
        if (queue.length > 0) {
            const opponentId = queue.shift()!; // Jugador más antiguo

            const hostProfile: PlayerProfile = { socketId: opponentId, name: 'Invitado 1' };
            const guestProfile: PlayerProfile = { socketId, name: 'Invitado 2' };
            const newRoom = this.createRoom(hostProfile, mode);
            
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
        } else {
            queue.push(socketId);
            return { matchFound: false };
        }
    }

    public static leaveQueue(socketId: string): void {
        const modes: GameMode[] = ['casual', 'normal', 'fast'];
        for (const mode of modes) {
            this.matchmakingQueue[mode] = this.matchmakingQueue[mode].filter(id => id !== socketId);
        }
    }

    //Sub-05.5: Rematch
    public static resetGameForRematch(roomId: string): GameState | null {
        const room = this.getRoomById(roomId);
        if (!room) return null;

        this.stopGameTimer(roomId);
        room.gameState = GameEngine.createNewGame(roomId);

        if (room.mode === 'normal') {
            room.gameState.timeRemaining = { red: 600, blue: 600 };
        } else if (room.mode === 'fast') {
            room.gameState.timeRemaining = { red: 300, blue: 300 };
        } 

        return room.gameState;
    }

    //Sub-07.1: Chat
    public static addChatMessage(roomId: string, message: ChatMessage): void {
        const room = this.getRoomById(roomId);
        if (room) {
            if (room.chatHistory.length >= 50) {
                room.chatHistory.shift();
            }
            room.chatHistory.push(message);
        }
    }
}