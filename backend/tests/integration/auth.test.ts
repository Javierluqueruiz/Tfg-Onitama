import { describe, it, expect, afterAll, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../src/app';
import { User } from '../../src/auth/User.model';

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

describe('POST /api/auth/register', () => {
    it('crea un nuevo usuario y devuelve 201 sin la contraseña', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({ username: 'usuarioPrueba', email: 'usuarioPrueba@example.com', password: 'password123' });

        expect(response.status).toBe(201);
        expect(response.body.username).toBe('usuarioPrueba');
        expect(response.body.passwordHash).toBeUndefined();
    });

    it('devuelve 409 si el nombre de usuario o correo ya existen', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({ username: 'usuarioPrueba', email: 'prueba@test.com', password: 'password123' });

        const response = await request(app)
            .post('/api/auth/register')
            .send({ username: 'usuarioPrueba', email: 'otro@test.com', password: 'otrapassword123' });

        expect(response.status).toBe(409);
        expect(response.body.message).toBe('El nombre de usuario o correo ya está en uso');
    });

    it('devuelve 400 si el email no tiene un formato válido', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({ username: 'usuarioPrueba', email: 'correoInvalido', password: 'password123' });
        
        expect(response.status).toBe(400);
        expect(response.body.message).toContain('El correo no tiene un formato válido');
    });

    it('devuelve 400 si la contraseña es demasiado corta', async () => {
        const response = await request(app).post('/api/auth/register')
            .send({ username: 'usuarioPrueba', email: 'usuarioPrueba@example.com', password: '12345' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('La contraseña debe tener al menos 6 caracteres');
    });
});

describe('POST /api/auth/login', () => {
    beforeEach(async () => {
        await request(app)
            .post('/api/auth/register')
            .send({ username: 'usuarioPrueba', email: 'usuarioPrueba@example.com', password: 'password123' });
    });

    it('devuelve un token con las credenciales correctas', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'usuarioPrueba', password: 'password123' });
        
        expect(response.status).toBe(200);
        expect(response.body.token).toBeDefined();
        expect(response.body.user.username).toBe('usuarioPrueba');
    });

    it('devuelve 401 con constraseña incorrectas', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'usuarioPrueba', password: 'contraseñaIncorrecta' });
        
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Nombre de usuario o contraseña incorrectos');
    });

    it('devuelve 401 con usuario inexistente', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'usuarioInexistente', password: 'password123' });
        
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Nombre de usuario o contraseña incorrectos');
    });
});

describe('GET /api/auth/me', () => {
    it('devuelve los datos del usuario autenticado si el token es válido', async () => {
        await request(app).post('/api/auth/register')
        .send({ username: 'usuarioPrueba', email: 'usuarioPrueba@example.com', password: 'password123' });

        const loginResponse = await request(app).post('/api/auth/login')
        .send({ username: 'usuarioPrueba', password: 'password123' });

        const response = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${loginResponse.body.token}`);

        expect(response.status).toBe(200);
        expect(response.body.username).toBe('usuarioPrueba');
    });

    it('devuelve 401 si el token es inválido', async () => {
        const response = await request(app)
            .get('/api/auth/me');
        expect(response.status).toBe(401);
    });

    it('devuelve 401 sin token', async () => {
        const response = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer tokenInvalido');
        expect(response.status).toBe(401);
    });
});
