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
        countsForStats: true,
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

    it('no persiste nada si countsForStats es false', async () => {
        const findById = vi.spyOn(User, 'findById');

        await GameResultService.recordMatchResult(createRoom({ countsForStats: false }));

        expect(findById).not.toHaveBeenCalled();
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

    it('guarda la partida en el historial del registrado como no clasificatoria, sin tocar su ELO, si el rival es un invitado', async () => {
        const redUser = createFakeUser({ elo: 1000, username: 'RedPlayer' });
        vi.spyOn(User, 'findById').mockResolvedValueOnce(redUser);

        await GameResultService.recordMatchResult(createRoom({
            players: {
                red: { socketId: 'redSocket', name: 'RedPlayer', userId: 'redId' },
                blue: { socketId: 'blueSocket', name: 'BluePlayer' }, // invitado
            },
        }));

        expect(redUser.elo).toBe(1000);
        expect(redUser.gamesPlayed).toBe(0);
        expect(redUser.wins).toBe(0);
        expect(redUser.save).toHaveBeenCalled();
        expect(redUser.lastMatches[0]).toMatchObject({ opponentName: 'BluePlayer', result: 'win', eloChange: 0, ranked: false });
    });

    it('lo mismo, pero cuando el registrado es el jugador azul', async () => {
        const blueUser = createFakeUser({ elo: 1000, username: 'BluePlayer' });
        vi.spyOn(User, 'findById').mockResolvedValueOnce(blueUser);

        await GameResultService.recordMatchResult(createRoom({
            players: {
                red: { socketId: 'redSocket', name: 'RedPlayer' }, // invitado
                blue: { socketId: 'blueSocket', name: 'BluePlayer', userId: 'blueId' },
            },
        }));

        expect(blueUser.elo).toBe(1000);
        expect(blueUser.save).toHaveBeenCalled();
        expect(blueUser.lastMatches[0]).toMatchObject({ opponentName: 'RedPlayer', result: 'loss', eloChange: 0, ranked: false });
    });

    it('no toca nada si los dos jugadores son invitados', async () => {
        const findByIdSpy = vi.spyOn(User, 'findById');

        await GameResultService.recordMatchResult(createRoom({
            players: {
                red: { socketId: 'redSocket', name: 'RedPlayer' },
                blue: { socketId: 'blueSocket', name: 'BluePlayer' },
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

    describe('variación de ELO que devuelve (Sub-11.3)', () => {
        const unranked = { red: { ranked: false }, blue: { ranked: false } };

        it('no hay variación si la partida no cuenta para estadísticas', async () => {
            const updates = await GameResultService.recordMatchResult(createRoom({ countsForStats: false }));
            expect(updates).toEqual(unranked);
        });

        it('entre dos cuentas devuelve a cada lado su variación y su nuevo ELO', async () => {
            vi.spyOn(User, 'findById')
                .mockResolvedValueOnce(createFakeUser({ elo: 1000 }))
                .mockResolvedValueOnce(createFakeUser({ elo: 1000 }));

            const updates = await GameResultService.recordMatchResult(createRoom());

            expect(updates).toEqual({
                red: { ranked: true, eloChange: 16, newElo: 1016 },
                blue: { ranked: true, eloChange: -16, newElo: 984 },
            });
        });

        it('un empate entre cuentas sigue siendo clasificatorio aunque no haya variación de ELO', async () => {
            vi.spyOn(User, 'findById')
                .mockResolvedValueOnce(createFakeUser({ elo: 1000 }))
                .mockResolvedValueOnce(createFakeUser({ elo: 1000 }));

            const updates = await GameResultService.recordMatchResult(createRoom({
                // @ts-expect-error -- mock simplificado, no implementa el tipo completo de GameState
                gameState: { winner: 'draw' }
            }));

            expect(updates).toEqual({
                red: { ranked: true, eloChange: 0, newElo: 1000 },
                blue: { ranked: true, eloChange: 0, newElo: 1000 },
            });
        });

        it('cada lado se calcula con el ELO previo del rival, no con el actualizado', async () => {
            vi.spyOn(User, 'findById')
                .mockResolvedValueOnce(createFakeUser({ elo: 1000 }))
                .mockResolvedValueOnce(createFakeUser({ elo: 1200 }));

            const updates = await GameResultService.recordMatchResult(createRoom());

            expect(updates).toEqual({
                red: { ranked: true, eloChange: 24, newElo: 1024 },
                blue: { ranked: true, eloChange: -24, newElo: 1176 },
            });
        });

        it('contra un invitado, nadie tiene variación de ELO', async () => {
            vi.spyOn(User, 'findById').mockResolvedValueOnce(createFakeUser({ elo: 1000 }));

            const updates = await GameResultService.recordMatchResult(createRoom({
                players: {
                    red: { socketId: 'redSocket', name: 'RedPlayer', userId: 'redId' },
                    blue: { socketId: 'blueSocket', name: 'BluePlayer' }, // invitado
                },
            }));

            expect(updates).toEqual(unranked);
        });

        it('entre dos invitados, nadie tiene variación de ELO', async () => {
            const updates = await GameResultService.recordMatchResult(createRoom({
                players: {
                    red: { socketId: 'redSocket', name: 'RedPlayer' },
                    blue: { socketId: 'blueSocket', name: 'BluePlayer' },
                },
            }));

            expect(updates).toEqual(unranked);
        });

        it('si una de las cuentas ya no existe, nadie tiene variación de ELO', async () => {
            vi.spyOn(User, 'findById')
                .mockResolvedValueOnce(createFakeUser({ elo: 1000 }))
                .mockResolvedValueOnce(null); // BluePlayer no existe

            const updates = await GameResultService.recordMatchResult(createRoom());

            expect(updates).toEqual(unranked);
        });

        it('si la partida no tiene ganador definido, nadie tiene variación de ELO', async () => {
            const updates = await GameResultService.recordMatchResult(createRoom({
                // @ts-expect-error -- mock simplificado, no implementa el tipo completo de GameState
                gameState: { winner: null }
            }));

            expect(updates).toEqual(unranked);
        });

        it('una cuenta que juega contra sí misma no puntúa y no se guarda nada', async () => {
            const findById = vi.spyOn(User, 'findById');

            const updates = await GameResultService.recordMatchResult(createRoom({
                players: {
                    red: { socketId: 'redSocket', name: 'RedPlayer', userId: 'sameId' },
                    blue: { socketId: 'blueSocket', name: 'RedPlayer', userId: 'sameId' },
                },
            }));
            
            expect(updates).toEqual(unranked);
            expect(findById).not.toHaveBeenCalled();
        });
    });
});