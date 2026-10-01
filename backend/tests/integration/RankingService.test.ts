import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../../src/auth/User.model';
import { RankingService } from '../../src/ranking/RankingService';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
}, 60000);

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await User.deleteMany({});
});

// Por defecto, el jugador cumple el mínimo de partidas para aparecer en el ranking.
function createPlayer(username: string, stats: Partial<{ elo: number; gamesPlayed: number; wins: number; losses: number; draws: number; }> = {}) {
    return User.create({
        username, 
        email: `${username}@example.com`,
        passwordHash: 'password',
        gamesPlayed: RankingService.MIN_GAMES,
        ...stats,
    });
}

describe('RankingService.getTop', () => {
    it('devuelve una lista vacía si nadie cumple el mínimo de partidas', async () => {
        await createPlayer('Alberto', { gamesPlayed: RankingService.MIN_GAMES - 1 });

        expect(await RankingService.getTop()).toEqual([]);
    });

    it('excluye jugadores que no cumplen el mínimo de partidas', async () => {
        await createPlayer('Alberto', { gamesPlayed: RankingService.MIN_GAMES - 1 });
        await createPlayer('Berta', { gamesPlayed: RankingService.MIN_GAMES });

        const top = await RankingService.getTop();
        expect(top.map((p) => p.username)).toEqual(['Berta']);
    });

    it('ordena por ELO descendente', async () => {
        await createPlayer('Alberto', { elo: 1000 });
        await createPlayer('Berta', { elo: 1200 });
        await createPlayer('Carmen', { elo: 1100 });

        const top = await RankingService.getTop();

        expect(top.map((p) => p.username)).toEqual(['Berta', 'Carmen', 'Alberto']);
        expect(top.map((p) => p.position)).toEqual([1, 2, 3]);
    });

    it('con el mismo ELO comparten posición y se ordenan por más partida primero, y luego por nombre', async () => {
        await createPlayer('Alberto', { elo: 1000, gamesPlayed: 10 });
        await createPlayer('Berta', { elo: 1000, gamesPlayed: 15 });
        await createPlayer('Carmen', { elo: 1000, gamesPlayed: 10 });
        await createPlayer('Diego', { elo: 999 });

        const top = await RankingService.getTop();

        expect(top.map((p) => p.username)).toEqual(['Berta', 'Alberto', 'Carmen', 'Diego']);
        expect(top.map((p) => p.position)).toEqual([1, 1, 1, 4]);
    });

    it('se limita a los primeros LIMIT jugadores y deja el resto fuera', async () => {
        await Promise.all(
            Array.from({ length: RankingService.LIMIT + 5 }, (_, i) =>
                createPlayer(`Player${i}`, { elo: 1000 + i })
            )
        );

        const top = await RankingService.getTop();

        expect(top).toHaveLength(RankingService.LIMIT);
        expect(top[0].username).toBe(`Player${RankingService.LIMIT + 4}`); 
        expect(top.map((e) => e.username)).not.toContain(`Player0`);
    });

    it('solo expone los datos públicos en el ranking, nunca contraseñas ni identificadores', async () => {
        await createPlayer('Ana', { elo: 1000, wins: 3, losses: 1, draws: 1 });

        const[entry] = await RankingService.getTop();

        expect(Object.keys(entry).sort()).toEqual(
            ['draws', 'elo', 'gamesPlayed', 'losses', 'position', 'username', 'wins']
        );

        expect(entry).toMatchObject({ position: 1, username: 'Ana', elo: 1000, gamesPlayed: 5, wins: 3, losses: 1, draws: 1 });
    });

    it('al desempatar ordena los nombres sin distinguir mayúsculas', async () => {
        await createPlayer('ana', { elo: 1000 });
        await createPlayer('Zoe', { elo: 1000 });

        const top = await RankingService.getTop();

        expect(top.map((p) => p.username)).toEqual(['ana', 'Zoe']);
    });
});

describe('RankingService.getEntryOf', () => {
    it('devuelve null si el jugador no existe', async () => {
        const unknownId = new mongoose.Types.ObjectId().toString();

        expect(await RankingService.getEntryOf(unknownId)).toBeNull();
    });

    it('devuelve null si el jugador existe pero no cumple el mínimo de partidas', async () => {
        const player = await createPlayer('Alberto', { gamesPlayed: RankingService.MIN_GAMES - 1 });

        expect(await RankingService.getEntryOf(player.id)).toBeNull();
    });

    it('la posición es 1 más el número de jugadores con más ELO que él que cumplan el mínimo de partidas', async () => {
        await createPlayer('Alberto', { elo: 1500 });
        const yo = await createPlayer('Jugador', { elo: 1200, wins: 4, losses: 1, draws: 0 });
        await createPlayer('Berta', { elo: 1000 });
        await createPlayer('Carmen', { elo: 1900, gamesPlayed: RankingService.MIN_GAMES - 1 }); // No cumple el mínimo de partidas

        const entry = await RankingService.getEntryOf(yo.id);

        expect(entry).toEqual({
            position: 2, username: 'Jugador', elo: 1200, gamesPlayed: RankingService.MIN_GAMES, wins: 4, losses: 1, draws: 0
        });
    });

    it('calcula la posición real aunque el jugador no esté en el top', async () => {
        const players = await Promise.all(
            Array.from({ length: RankingService.LIMIT + 5 }, (_, i) =>
                createPlayer(`Player${i}`, { elo: 1000 + i })
            )
        );

        const entry = await RankingService.getEntryOf(players[0].id);
        expect(entry?.position).toBe(RankingService.LIMIT + 5);
    });

    it('coincide siempre con la posición que da getTop, también con empates', async () => {
        await createPlayer('Alberto', { elo: 1200, gamesPlayed: 10 });
        await createPlayer('Berta', { elo: 1200, gamesPlayed: 15 });
        await createPlayer('Carmen', { elo: 1100 });
        await createPlayer('Diego', { elo: 1100 });
        await createPlayer('Elena', { elo: 1000 });

        const top = await RankingService.getTop();

        for (const row of top) {
            const user = await User.findOne({ username: row.username });
            const entry = await RankingService.getEntryOf(user!.id);
            expect(entry?.position, row.username).toBe(row.position);
        }
    });
});

describe('RankingService.getRanking', () => {
    it('para un invitado, devuelve la clasificación sin fila propia', async () => {
        await createPlayer('Alberto', { elo: 1200 });
        await createPlayer('Berta', { elo: 1100 });

        const ranking = await RankingService.getRanking();

        expect(ranking.entries.map((e) => e.username)).toEqual(['Alberto', 'Berta']);
        expect(ranking.me).toBeNull();
        expect(ranking.minGames).toBe(RankingService.MIN_GAMES);
    });

    it('si el jugador que consulta está en el top, su fila es la misma que la del ranking', async () => {
        await createPlayer('Alberto', { elo: 1200 });
        const berta = await createPlayer('Berta', { elo: 1100 });

        const ranking = await RankingService.getRanking(berta.id);

        expect(ranking.me).toEqual(ranking.entries[1]);
    });

    it('si el jugador que consulta no está en el top, su fila muestra su posición real y no aparece en el ranking', async () => {
        const players = await Promise.all(
            Array.from({ length: RankingService.LIMIT + 5 }, (_, i) =>
                createPlayer(`Player${i}`, { elo: 1000 + i })
            )
        );

        const ranking = await RankingService.getRanking(players[0].id);

        expect(ranking.entries).toHaveLength(RankingService.LIMIT); 
        expect(ranking.entries.map((e) => e.username)).not.toContain(players[0].username);
        expect(ranking.me?.username).toBe(players[0].username);
        expect(ranking.me?.position).toBe(RankingService.LIMIT + 5);
    });

    it('si el jugador que consulta no cumple el mínimo de partidas, su fila es null', async () => {
        await createPlayer('Alberto', { elo: 1200 });
        const novato = await createPlayer('Novato', { elo: 1000, gamesPlayed: RankingService.MIN_GAMES - 1 });

        const ranking = await RankingService.getRanking(novato.id);

        expect(ranking.me).toBeNull();
        expect(ranking.entries.map((e) => e.username)).toEqual(['Alberto']);
    });
});

describe('índice del ranking', () => {
    it('la consulta del top recorre el índice y no ordena en memoria', async () => {
        await User.init();

        const plan = await RankingService.topQuery().explain('queryPlanner');

        const winningPlan = JSON.stringify(plan.queryPlanner.winningPlan);
        expect(winningPlan).toContain('IXSCAN');
        expect(winningPlan).not.toContain('"stage":"SORT"');
    });
});