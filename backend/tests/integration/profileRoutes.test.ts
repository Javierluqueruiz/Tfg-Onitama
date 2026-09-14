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

describe('PATCH /api/profile/password (Sub-09.4)', () => {
    it('devuelve 401 si la contraseña actual no es correcta', async () => {
        const agent = request.agent(app);
        await agent.post('/api/auth/register').set('X-Requested-With', 'XMLHttpRequest').send({
            username: 'testuser3', email: 'testuser3@example.com', password: 'password123'
        });

        const response = await agent.patch('/api/profile/password').set('X-Requested-With', 'XMLHttpRequest').send({
            currentPassword: 'wrongpassword',
            newPassword: 'newpassword123'
        });

        expect(response.status).toBe(401);
    });

    it('la cookie de sesión se actualiza después de cambiar la contraseña', async () => {
        const registerResponse = await request(app).post('/api/auth/register').set('X-Requested-With', 'XMLHttpRequest').send({
            username: 'testuser4', email: 'testuser4@example.com', password: 'password123'
        });

        const cookieAntigua = registerResponse.headers['set-cookie'];
        expect(cookieAntigua).toBeDefined();

        const cambioResponse = await request(app).patch('/api/profile/password').set('X-Requested-With', 'XMLHttpRequest').set('Cookie', cookieAntigua).send({
            currentPassword: 'password123',
            newPassword: 'newpassword123'
        });

        expect(cambioResponse.status).toBe(200);
        const cookieNueva = cambioResponse.headers['set-cookie'];
        expect(cookieNueva).toBeDefined();

        // La cookie antigua ya no sirve
        const meConCookieAntigua = await request(app).get('/api/profile/me').set('X-Requested-With', 'XMLHttpRequest').set('Cookie', cookieAntigua);
        expect(meConCookieAntigua.status).toBe(401);

        const meConCookieNueva = await request(app).get('/api/profile/me').set('X-Requested-With', 'XMLHttpRequest').set('Cookie', cookieNueva);
        expect(meConCookieNueva.status).toBe(200);
    });
});

describe('DELETE /api/profile/me (Sub-09.5)', () => {
    it('devuelve 400 si el nombre de usuario no coincide', async () => {
        const agent = request.agent(app);
        await agent.post('/api/auth/register').set('X-Requested-With', 'XMLHttpRequest').send({
            username: 'testuser5', email: 'testuser5@example.com', password: 'password123'
        });

        const response = await agent.delete('/api/profile/me').set('X-Requested-With', 'XMLHttpRequest').send({
            username: 'wrongusername',
            password: 'password123'
        });

        expect(response.status).toBe(400);
    });

    it('devuelve 401 si la contraseña no coincide', async () => {
        const agent = request.agent(app);
        await agent.post('/api/auth/register').set('X-Requested-With', 'XMLHttpRequest').send({
            username: 'testuser6', email: 'testuser6@example.com', password: 'password123'
        });

        const response = await agent.delete('/api/profile/me').set('X-Requested-With', 'XMLHttpRequest').send({
            username: 'testuser6',
            password: 'wrongpassword'
        });

        expect(response.status).toBe(401);
    });
    
    it('elimina la cuenta y la cookie de sesión después de una solicitud válida', async () => {
        const agent = request.agent(app);
        await agent.post('/api/auth/register').set('X-Requested-With', 'XMLHttpRequest').send({
            username: 'testuser7', email: 'testuser7@example.com', password: 'password123'
        });

        const response = await agent.delete('/api/profile/me').set('X-Requested-With', 'XMLHttpRequest').send({
            username: 'testuser7',
            password: 'password123'
        });

        expect(response.status).toBe(200);
        expect(await User.findOne({ username: 'testuser7' })).toBeNull();

        const meDespues = await agent.get('/api/profile/me');
        expect(meDespues.status).toBe(401);
    });

    it('el historial de un rival conserva el nombre aunque la cuneta del jugador se haya eliminado', async () => {
        await User.create({
            username: 'jugadorA', email: 'jugadorA@example.com', passwordHash: 'hash', elo: 1018,
            gamesPlayed: 1, wins: 1,
        });

        await User.findOneAndUpdate({ username: 'jugadorA' }, {
            lastMatches: [{ opponentName: 'jugadorB', result: 'win', eloChange: 18, date: new Date('2026-01-01T00:00:00Z') }]
        });

        const agentB = request.agent(app);
        await agentB.post('/api/auth/register').set('X-Requested-With', 'XMLHttpRequest').send({
            username: 'jugadorB', email: 'userB@example.com', password: 'password123'
        });

        const deleteResponse = await agentB.delete('/api/profile/me').set('X-Requested-With', 'XMLHttpRequest').send({
            username: 'jugadorB', password: 'password123'
        });

        expect(deleteResponse.status).toBe(200);

        expect(await User.findOne({ username: 'jugadorB' })).toBeNull();

        const refreshedA = await User.findOne({ username: 'jugadorA' });
        expect(refreshedA?.lastMatches).toHaveLength(1);
        expect(refreshedA?.lastMatches[0].opponentName).toBe('jugadorB');
        expect(refreshedA?.lastMatches[0].result).toBe('win');
    });
});