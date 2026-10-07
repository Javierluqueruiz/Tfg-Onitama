import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PlayerProfile } from '../../../shared';
import { RoomManager } from '../../src/network/RoomManager';
import { GameResultService, type MatchEloUpdates } from '../../src/network/GameResultService';
import { GameEngine } from '../../src/game/GameEngine';

describe('RoomManager.onMatchRecorded', () => {
    const updates: MatchEloUpdates = {
        red : { ranked: true, eloChange: 16, newElo: 1016 },
        blue: { ranked: true, eloChange: -16, newElo: 984 }
    };

    const makeHost = (): PlayerProfile => ({ socketId: 'host-socket', name: 'Host' });
    const makeGuest = (): PlayerProfile => ({ socketId: 'guest-socket', name: 'Guest' });

    const createRoom = () => {
        const room = RoomManager.createRoom(makeHost(), 'casual');
        if (room.players.red) {
            room.players.blue = makeGuest();
        } else {
            room.players.red = makeGuest();
        }
        room.gameState = GameEngine.createNewGame(room.roomId);
        return room;
    };

    beforeEach(() => {
        RoomManager.clearActiveRooms();
    });

    afterEach(() => {
        RoomManager.onMatchRecorded(null);
        vi.restoreAllMocks();
    });

    it('avisa cuando termina de guardarse el resultado', async () => {
        vi.spyOn(GameResultService, 'recordMatchResult').mockResolvedValue(updates);
        const listener = vi.fn();
        RoomManager.onMatchRecorded(listener);
        const room = createRoom();

        RoomManager.surrenderGame(room.roomId, 'host');

        await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1));
        expect(listener).toHaveBeenCalledWith(room, updates);
    });

    it('si no se puede guardar el resultado, no avisa a nadie y deja el error en el registro', async () => {
        vi.spyOn(GameResultService, 'recordMatchResult').mockRejectedValue(new Error('caída de la base de datos'));
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const listener = vi.fn();
        RoomManager.onMatchRecorded(listener);
        const room = createRoom();

        RoomManager.surrenderGame(room.roomId, 'host');

        await vi.waitFor(() => expect(consoleError).toHaveBeenCalled());
        expect(listener).not.toHaveBeenCalled();
    });

    it('sin función registrada la partida termina igual y se guarda el resultado', async () => {
        const record = vi.spyOn(GameResultService, 'recordMatchResult').mockResolvedValue(updates);
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const room = createRoom();

        const finalState = RoomManager.surrenderGame(room.roomId, 'host');

        await vi.waitFor(() => expect(record).toHaveBeenCalledTimes(1));
        expect(finalState?.status).toBe('finished');
        expect(consoleError).not.toHaveBeenCalled();
    });

    it('registrar una función nueva sustituye a la anterior', async () => {
        vi.spyOn(GameResultService, 'recordMatchResult').mockResolvedValue(updates);
        const first = vi.fn();
        const second = vi.fn();
        RoomManager.onMatchRecorded(first);
        RoomManager.onMatchRecorded(second);
        const room = createRoom();

        RoomManager.surrenderGame(room.roomId, 'host');

        await vi.waitFor(() => expect(second).toHaveBeenCalledTimes(1));
        expect(first).not.toHaveBeenCalled();
    });

    it('actualiza el ELO de los perfiles de la sala con el resultado de la partida', async () => {
        vi.spyOn(GameResultService, 'recordMatchResult').mockResolvedValue(updates);
        const listener = vi.fn();
        RoomManager.onMatchRecorded(listener);
        const room = createRoom();
        room.players.red!.elo = 1000;
        room.players.blue!.elo = 1000;

        RoomManager.surrenderGame(room.roomId, 'host-socket');

        await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1));
        expect(room.players.red!.elo).toBe(1016);
        expect(room.players.blue!.elo).toBe(984);
    });

    it('ya están actualizadas cuando se avisa al listener, para que quien lo reciba no vea el ELO antiguo', async () => {
        vi.spyOn(GameResultService, 'recordMatchResult').mockResolvedValue(updates);
        let redEloAlAvisar: number | undefined;
        RoomManager.onMatchRecorded((room) => { redEloAlAvisar = room.players.red?.elo; });
        const room = createRoom();
        room.players.red!.elo = 1000;
        room.players.blue!.elo = 1000;

        RoomManager.surrenderGame(room.roomId, 'host-socket');

        await vi.waitFor(() => expect(redEloAlAvisar).toBe(1016));
    });

    it('no toca el ELO de los perfiles si la partida no puntúa', async () => {
        vi.spyOn(GameResultService, 'recordMatchResult').mockResolvedValue({ red: { ranked: false }, blue: { ranked: false } });
        const listener = vi.fn();
        RoomManager.onMatchRecorded(listener);
        const room = createRoom();
        room.players.red!.elo = 1000;
        room.players.blue!.elo = 1000;

        RoomManager.surrenderGame(room.roomId, 'host-socket');

        await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1));
        expect(room.players.red!.elo).toBe(1000);
        expect(room.players.blue!.elo).toBe(1000);
    });
});

//Un asiento solo lo recupera quien lo ocupó: mismo socket anterior y misma identidad (cuenta o invitado)
describe('RoomManager.reconnectPlayer: identidad', () => {
    beforeEach(() => {
        RoomManager.clearActiveRooms();
    });

    const createRoomWithHost = (hostUserId?: string) => {
        const room = RoomManager.createRoom({ socketId: 'host-old', name: 'Host', userId: hostUserId }, 'casual');
        const guest: PlayerProfile = { socketId: 'guest', name: 'Guest' };
        if (room.players.red) {
            room.players.blue = guest;
        } else {
            room.players.red = guest;
        }
        return room;
    };

    const hostSeat = (room: ReturnType<typeof createRoomWithHost>) =>
        room.players.red?.name === 'Host' ? room.players.red : room.players.blue;

    // Evita romper la reconexión legítima (el invitado sigue siendo invitado, la cuenta sigue siendo la misma).
    it.each([undefined, 'user-1'])('acepta la reconexión con la misma identidad (userId: %s)', (userId) => {
        const room = createRoomWithHost(userId);

        const result = RoomManager.reconnectPlayer(room.roomId, 'host-old', 'host-new', userId);

        expect(result).not.toBeNull();
        expect(hostSeat(room)?.socketId).toBe('host-new');
    });

    // Evita tu bug: cambiar de identidad no hereda la partida del perfil anterior.
    it.each([
        { caso: 'un invitado que ha iniciado sesión', seatUserId: undefined, socketUserId: 'user-1' },
        { caso: 'una cuenta que ha cerrado sesión', seatUserId: 'user-1', socketUserId: undefined },
        { caso: 'otra cuenta distinta', seatUserId: 'user-1', socketUserId: 'user-2' },
    ])('rechaza la reconexión de $caso y no toca el asiento', ({ seatUserId, socketUserId }) => {
        const room = createRoomWithHost(seatUserId);

        const result = RoomManager.reconnectPlayer(room.roomId, 'host-old', 'host-new', socketUserId);

        expect(result).toBeNull();
        expect(hostSeat(room)?.socketId).toBe('host-old');
    });
});