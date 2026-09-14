import { describe, it, expect, vi, afterEach } from 'vitest';
import { GameResultService } from '../../src/network/GameResultService';
import { User } from '../../src/auth/User.model';
import { RoomSession } from '../../../shared';

function createFakeUser(overrides: Partial<{ elo: number; username: string }> = {}) {
    return {
        elo: 1000,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        lastMatches: [] as unknown[],
        username: 'testuser',
        save: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

function createRoom(overrides: Partial<RoomSession> = {}): RoomSession {
    return {
        roomId: 'room1',
        roomCode: 'ABCDE',
        mode: 'casual',
        chatHistory: [],
        drawOfferedBy: null,
        rematchOfferedBy: null,
        resultPersisted: false,
        players: {
            red: { socketId: 'redSocket', name: 'RedPlayer', userId: 'redId' },
            blue: { socketId: 'blueSocket', name: 'BluePlayer', userId: 'blueId' },
        },
        // @ts-expect-error -- mock simplificado, no implementa el tipo completo de GameState
        gameState: { winner: 'red'},
        ...overrides,
    };
}

describe('GameResultService.recordMatchResult', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('actualiza correctamente el ELO y las estadísticas de los jugadores cuando los dos son cuentas registradas', async () => {
        const redUser = createFakeUser({ elo: 1000, username: 'RedPlayer' });
        const blueUser = createFakeUser({ elo: 1000, username: 'BluePlayer' });

        vi.spyOn(User, 'findById')
            .mockResolvedValueOnce(redUser)
            .mockResolvedValueOnce(blueUser);

        await GameResultService.recordMatchResult(createRoom());

        expect(redUser.wins).toBe(1);
        expect(redUser.elo).toBe(1016);
        expect(redUser.save).toHaveBeenCalled();

        expect(blueUser.losses).toBe(1);
        expect(blueUser.elo).toBe(984);
        expect(blueUser.save).toHaveBeenCalled();
        console.log('Red User Last Matches:', redUser.lastMatches);
        console.log('Blue User Last Matches:', blueUser.lastMatches);
        expect(redUser.lastMatches[0]).toMatchObject({ opponentName: 'BluePlayer', result: 'win', eloChange: 16 });
        expect(blueUser.lastMatches[0]).toMatchObject({ opponentName: 'RedPlayer', result: 'loss', eloChange: -16 });
    });

    it('registra un empate correctamente y no cambia el ELO de los jugadores si ya eran iguales', async () => {
        const redUser = createFakeUser({ elo: 1000, username: 'RedPlayer' });
        const blueUser = createFakeUser({ elo: 1000, username: 'BluePlayer' });

        vi.spyOn(User, 'findById')
            .mockResolvedValueOnce(redUser)
            .mockResolvedValueOnce(blueUser);
        
        await GameResultService.recordMatchResult(createRoom({ 
            // @ts-expect-error -- mock simplificado, no implementa el tipo completo de GameState
            gameState: { winner: 'draw' } 
        }));

        expect(redUser.draws).toBe(1);
        expect(blueUser.draws).toBe(1);
        expect(redUser.elo).toBe(1000);
        expect(blueUser.elo).toBe(1000);
    });

    it('no actualiza el ELO de nadie si uno de los jugadores no es una cuenta registrada', async () => {
        const findByIdSpy = vi.spyOn(User, 'findById');

        await GameResultService.recordMatchResult(createRoom({
            players: {
                red: { socketId: 'redSocket', name: 'RedPlayer', userId: 'redId' },
                blue: { socketId: 'blueSocket', name: 'BluePlayer' }, // BluePlayer no es una cuenta registrada
            },
        }));

        expect(findByIdSpy).not.toHaveBeenCalled();
    });

    it('no actualiza a ningún jugador si la cuenta del rival ya no existe', async () => {
        const redUser = createFakeUser();

        vi.spyOn(User, 'findById')
            .mockResolvedValueOnce(redUser) // RedPlayer existe
            .mockResolvedValueOnce(null); // BluePlayer no existe
        
        await GameResultService.recordMatchResult(createRoom());

        expect(redUser.save).not.toHaveBeenCalled();
    });
});