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

});