import { describe, it, expect, afterAll, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../src/app';
import { User } from '../../src/auth/User.model';
import { RankingService } from '../../src/ranking/RankingService';

vi.mock('../../src/auth/emailService', () => ({
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    sendVerifyBeforeResetEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/auth/captchaService', () => ({
    verifyCaptcha: vi.fn().mockResolvedValue(true),
}));

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

function createPlayer(username: string, elo: number) {
    return User.create({
        username,
        email: `${username}@example.com`,
        passwordHash: 'hash',
        elo,
        gamesPlayed: RankingService.MIN_GAMES,
    });
}

describe('GET /api/ranking (Sub-11.1)', () => {
    it('es público: sin sesión devuelve la clasificación sin fila propia', async () => {
        await createPlayer('Alberto', 1000);
        await createPlayer('Berta', 1200);

        const response = await request(app).get('/api/ranking');

        expect(response.status).toBe(200);
        expect(response.body.entries.map((p: { username: string }) => p.username)).toEqual(['Berta', 'Alberto']);
        expect(response.body.me).toBeNull();
        expect(response.body.minGames).toBe(RankingService.MIN_GAMES);
    });

    it('con sesión devuelve la clasificación con fila propia', async () => {
        await createPlayer('Alberto', 1000);
        const agent = request.agent(app);
        await agent.post('/api/auth/register').set('X-Requested-With', 'XMLHttpRequest').send({
            username: 'Berta', email: 'berta@example.com', password: 'password123456',
        });
        await User.findOneAndUpdate({ username: 'Berta' }, { elo: 1200, gamesPlayed: RankingService.MIN_GAMES });

        const response = await agent.get('/api/ranking');

        expect(response.status).toBe(200);
        expect(response.body.me).toMatchObject({ position: 1, username: 'Berta', elo: 1200 });
    });

    it('una cookie de sesión inválida se trata como invitado, no como error', async () => {
        await createPlayer('Alberto', 1000);

        const response = await request(app).get('/api/ranking').set('Cookie', 'token=invalidtoken');

        expect(response.status).toBe(200);
        expect(response.body.me).toBeNull()
        expect(response.body.entries).toHaveLength(1);
    });

    it('no expone correos electrónicos ni contraseñas', async () => {
        await createPlayer('Alberto', 1000);

        const response = await request(app).get('/api/ranking');

        const body = JSON.stringify(response.body);
        expect(body).not.toContain('@example.com');
        expect(body).not.toContain('passwordHash');
        expect(body).not.toContain('_id');
    });

    it('prohíbe cachear la respuesta, porque cambia según quién consulta', async () => {
        const response = await request(app).get('/api/ranking');

        expect(response.headers['cache-control']).toBe('no-store');
    });
});