import { describe, it, expect, beforeEach } from 'vitest';
import { ChatMessage, PlayerProfile } from '../../../shared/index';
import { RoomManager } from '../../src/network/RoomManager';

//Sub-05.2: reconexión y chat
describe('RoomManager.reconnectPlayer: historial de chat', () => {
    // Perfiles nuevos en cada llamada: reconnectPlayer modifica el socketId del perfil de la sala.
    const makeHost = (): PlayerProfile => ({ socketId: 'host-old', name: 'Host' });
    const makeGuest = (): PlayerProfile => ({ socketId: 'guest', name: 'Guest' });

    const message = (socketId: string, text: string): ChatMessage => ({ socketId, name: 'x', message: text, timestamp: 1 });

    beforeEach(() => {
        RoomManager.clearActiveRooms();
    });

    const createFullRoom = () => {
        const room = RoomManager.createRoom(makeHost(), 'casual');
        if (room.players.red) {
            room.players.blue = makeGuest();
        } else {
            room.players.red = makeGuest();
        }
        return room;
    };

    it('actualiza el socket.id de los mensajes del jugador que se reconecta', () => {
        const room = createFullRoom();
        RoomManager.addChatMessage(room.roomId, message('host-old', 'hola'));
        RoomManager.addChatMessage(room.roomId, message('guest', 'buenas'));
        RoomManager.addChatMessage(room.roomId, message('host-old', 'suerte'));

        RoomManager.reconnectPlayer(room.roomId, 'host-old', 'host-new');

        expect(room.chatHistory.map(m => m.socketId)).toEqual(['host-new', 'guest', 'host-new']);
    });

    it('no toca los mensajes del rival', () => {
        const room = createFullRoom();
        RoomManager.addChatMessage(room.roomId, message('guest', 'buenas'));

        RoomManager.reconnectPlayer(room.roomId, 'host-old', 'host-new');

        expect(room.chatHistory[0].socketId).toBe('guest');
    });

    it('mantiene la identificación tras reconexiones sucesivas', () => {
        const room = createFullRoom();
        RoomManager.addChatMessage(room.roomId, message('host-old', 'hola'));

        RoomManager.reconnectPlayer(room.roomId, 'host-old', 'host-2');
        RoomManager.reconnectPlayer(room.roomId, 'host-2', 'host-3');

        expect(room.chatHistory[0].socketId).toBe('host-3');
    });

    it('no modifica el chat si la reconexión falla', () => {
        const room = createFullRoom();
        RoomManager.addChatMessage(room.roomId, message('host-old', 'hola'));

        const result = RoomManager.reconnectPlayer(room.roomId, 'desconocido', 'nuevo');

        expect(result).toBeNull();
        expect(room.chatHistory[0].socketId).toBe('host-old');
    });
});
