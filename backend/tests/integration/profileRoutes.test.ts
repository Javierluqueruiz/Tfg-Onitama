import { describe, it, expect, afterAll, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../src/app';
import { User } from '../../src/auth/User.model';

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

describe('GET /api/profile/me (Sub-09.3)', () => {
    it('devuelve 401 si no se proporciona un token de sesión', async () => {
        const response = await request(app).get('/api/profile/me');
        expect(response.status).toBe(401);
    });
    it('devuelve las estadísticas por defecto para un usuario registrado sin estadísticas previas', async () => {
        const agent = request.agent(app);

        await agent.post('/api/auth/register').set('X-Requested-With', 'XMLHttpRequest').send({
            username: 'testuser', email: 'testuser@example.com', password: 'password123'
        });

        const response = await agent.get('/api/profile/me');

        expect(response.status).toBe(200);
        expect(response.body.username).toBe('testuser');
        expect(response.body.elo).toBe(1000);
        expect(response.body.gamesPlayed).toBe(0);
        expect(response.body.wins).toBe(0);
        expect(response.body.losses).toBe(0);
        expect(response.body.draws).toBe(0);
        expect(response.body.lastMatches).toEqual([]);
    });

    it('refleja el ELO y el historial de una cuenta con partidas previas', async () => {
        const agent = request.agent(app);

        await agent.post('/api/auth/register').set('X-Requested-With', 'XMLHttpRequest').send({
            username: 'testuser2', email: 'testuser2@example.com', password: 'password123'
        });

        await User.findOneAndUpdate({ username: 'testuser2' }, {
            elo: 1050,
            gamesPlayed: 2,
            wins: 1,
            losses: 1,
            draws: 0,
            lastMatches: [
                { opponentName: 'opponent1', result: 'win', eloChange: 100, date: new Date('2026-01-01T00:00:00Z') },
                { opponentName: 'opponent2', result: 'loss', eloChange: -50, date: new Date('2026-01-02T00:00:00Z') }],
            }
        );  

        const response = await agent.get('/api/profile/me');

        expect(response.status).toBe(200);
        expect(response.body.username).toBe('testuser2');
        expect(response.body.elo).toBe(1050);
        expect(response.body.gamesPlayed).toBe(2);
        expect(response.body.wins).toBe(1);
        expect(response.body.losses).toBe(1);
        expect(response.body.draws).toBe(0);
        expect(response.body.lastMatches[0].date).toBe('2026-01-01T00:00:00.000Z');
    });
});
