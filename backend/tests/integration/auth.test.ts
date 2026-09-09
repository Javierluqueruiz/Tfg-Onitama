import { describe, it, expect, afterAll, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../src/app';
import { User } from '../../src/auth/User.model';
import { AuthService } from '../../src/auth/authService';

vi.mock('../../src/auth/emailService', () => ({
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    sendVerifyBeforeResetEmail: vi.fn().mockResolvedValue(undefined),
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

describe('POST /api/auth/register', () => {
    it('crea un nuevo usuario y devuelve 201 sin la contraseña', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({ username: 'usuarioprueba', email: 'usuarioprueba@example.com', password: 'password123' });

        expect(response.status).toBe(201);
        expect(response.body.username).toBe('usuarioprueba');
        expect(response.body.passwordHash).toBeUndefined();
    });

    it('devuelve 409 si el nombre de usuario o correo ya existen', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({ username: 'usuarioprueba', email: 'prueba@test.com', password: 'password123' });

        const response = await request(app)
            .post('/api/auth/register')
            .send({ username: 'usuarioprueba', email: 'otro@test.com', password: 'otrapassword123' });

        expect(response.status).toBe(409);
        expect(response.body.message).toBe('El nombre de usuario o correo ya está en uso');
    });

    it('devuelve 400 si el email no tiene un formato válido', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({ username: 'usuarioprueba', email: 'correoInvalido', password: 'password123' });
        
        expect(response.status).toBe(400);
        expect(response.body.message).toContain('El correo no tiene un formato válido');
    });

    it('devuelve 400 si la contraseña es demasiado corta', async () => {
        const response = await request(app).post('/api/auth/register')
            .send({ username: 'usuarioprueba', email: 'usuarioprueba@example.com', password: '12345' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('La contraseña debe tener al menos 8 caracteres');
    });
});

describe('POST /api/auth/login', () => {
    beforeEach(async () => {
        await request(app)
            .post('/api/auth/register')
            .send({ username: 'usuarioprueba', email: 'usuarioprueba@example.com', password: 'password123' });
    });

    it('establece la cookie de sesión con las credenciales correctas', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'usuarioprueba', password: 'password123' });

        expect(response.status).toBe(200);
        expect(response.headers['set-cookie']).toBeDefined();
        expect(response.body.user.username).toBe('usuarioprueba');
    });

    it('devuelve 401 con constraseña incorrectas', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'usuarioprueba', password: 'contraseñaIncorrecta' });
        
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

describe('POST /api/auth/logout', () => {
    it('borra la cookie de sesión, dejando /me inaccesible después', async () => {
        const agent = request.agent(app);

        await agent.post('/api/auth/register')
            .send({ username: 'usuarioprueba', email: 'usuarioprueba@example.com', password: 'password123' });

        const meAntes = await agent.get('/api/auth/me');
        expect(meAntes.status).toBe(200);

        const logoutResponse = await agent.post('/api/auth/logout');
        expect(logoutResponse.status).toBe(200);

        const meDespues = await agent.get('/api/auth/me');
        expect(meDespues.status).toBe(401);
    });
});

describe('Invalidación de sesión al cambiar la contraseña', () => {
    it('un token emitido antes de restablecer la contraseña deja de servir', async () => {
        const registerResponse = await request(app).post('/api/auth/register')
            .send({ username: 'usuarioprueba', email: 'usuarioprueba@example.com', password: 'password123' });

        const loginAntiguo = await request(app).post('/api/auth/login')
            .send({ username: 'usuarioprueba', password: 'password123' });
        const cookieAntigua = loginAntiguo.headers['set-cookie'];

        const registeredUser = await User.findById(registerResponse.body.id);
        const resetToken = AuthService.signPasswordResetToken(registeredUser!);
        await request(app).post('/api/auth/reset-password')
            .send({ token: resetToken, newPassword: 'nuevaContraseña123' });

        const meConCookieAntigua = await request(app)
            .get('/api/auth/me')
            .set('Cookie', cookieAntigua);

        expect(meConCookieAntigua.status).toBe(401);
    });
});

describe('Política de contraseñas', () => {
    it('rechaza una contraseña de la lista de contraseñas comunes', async () => {
        const response = await request(app).post('/api/auth/register')
            .send({ username: 'usuarioprueba', email: 'usuarioprueba@example.com', password: 'password1' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('La contraseña es demasiado común');
    });
});

describe('Normalización de mayúsculas/minúsculas en el username', () => {
    it('permite iniciar sesión con una capitalización distinta a la del registro, conservando el nombre original', async () => {
        await request(app).post('/api/auth/register')
            .send({ username: 'UsuarioPrueba', email: 'mayusculas@example.com', password: 'password123' });

        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'usuarioprueba', password: 'password123' });

        expect(response.status).toBe(200);
        expect(response.body.user.username).toBe('UsuarioPrueba');
    });

    it('impide registrar dos cuentas cuyo username solo difiere en mayúsculas', async () => {
        await request(app).post('/api/auth/register')
            .send({ username: 'UsuarioPrueba', email: 'primero@example.com', password: 'password123' });

        const response = await request(app).post('/api/auth/register')
            .send({ username: 'usuarioprueba', email: 'segundo@example.com', password: 'password123' });

        expect(response.status).toBe(409);
    });
});

describe('GET /api/auth/me', () => {
    it('devuelve los datos del usuario autenticado si la cookie de sesión es válida', async () => {
        const agent = request.agent(app);

        await agent.post('/api/auth/register')
            .send({ username: 'usuarioprueba', email: 'usuarioprueba@example.com', password: 'password123' });

        const response = await agent.get('/api/auth/me');

        expect(response.status).toBe(200);
        expect(response.body.username).toBe('usuarioprueba');
    });

    it('devuelve 401 sin cookie de sesión', async () => {
        const response = await request(app)
            .get('/api/auth/me');
        expect(response.status).toBe(401);
    });

    it('devuelve 401 si la cookie de sesión es inválida', async () => {
        const response = await request(app)
            .get('/api/auth/me')
            .set('Cookie', 'token=tokenInvalido');
        expect(response.status).toBe(401);
    });
});

//Sub-08.4

describe('POST /api/auth/verify-email', () => {
    it('verifica el correo electrónico con un token válido', async () => {
        const registerResponse = await request(app).post('/api/auth/register')
            .send({ username: 'usuarioprueba', email: 'usuarioprueba@example.com', password: 'password123' });

        const token = AuthService.signEMailVerificationToken(registerResponse.body.id);
        const response = await request(app).post('/api/auth/verify-email').send({ token });
        
        expect(response.status).toBe(200);
        expect(response.body.emailVerified).toBe(true);
    });

    it('devuelve 400 con un token inválido', async () => {
        const response = await request(app).post('/api/auth/verify-email').send({ token: 'tokenInvalido' });
        expect(response.status).toBe(400);
    });
});


describe('POST /api/auth/resend-verification', () => {
    it('reenviar correo de verificación para un usuario autenticado', async () => {
        const agent = request.agent(app);

        await agent.post('/api/auth/register')
            .send({ username: 'usuarioprueba', email: 'usuarioprueba@example.com', password: 'password123' });

        const response = await agent.post('/api/auth/resend-verification');

        expect(response.status).toBe(200);
    });

    it('devuelve 401 si no hay token de sesión', async () => {
        const response = await request(app).post('/api/auth/resend-verification');
        expect(response.status).toBe(401);
    });
});

describe('POST /api/auth/forgot-password', () => {
    it('devuelve 200 con el mismo mensaje independientemente de si el correo existe o no', async () => {
        await request(app).post('/api/auth/register')
            .send({ username: 'usuarioprueba', email: 'usuarioprueba@example.com', password: 'password123' });
        
        const responseExist = await request(app).post('/api/auth/forgot-password').send({ email: 'usuarioprueba@example.com' });
        const responseNotExist = await request(app).post('/api/auth/forgot-password').send({ email: 'noExiste@example.com' });

        expect(responseExist.status).toBe(200);
        expect(responseNotExist.status).toBe(200);
        expect(responseExist.body.message).toBe(responseNotExist.body.message);
    });
});

describe('POST /api/auth/reset-password', () => {
    it('permite iniciar sesión con la nueva contraseña después de un restablecimiento exitoso', async () => {
        const registerResponse = await request(app).post('/api/auth/register')
            .send({ username: 'usuarioprueba', email: 'usuarioprueba@example.com', password: 'password123' });
        const registeredUser = await User.findById(registerResponse.body.id);
        const token = AuthService.signPasswordResetToken(registeredUser!);

        const resetResponse = await request(app).post('/api/auth/reset-password')
            .send({ token, newPassword: 'nuevaContraseña123' });
        expect(resetResponse.status).toBe(200);

        const loginAntiguaContraseña = await request(app).post('/api/auth/login')
            .send({ username: 'usuarioprueba', password: 'password123' });
        expect(loginAntiguaContraseña.status).toBe(401);

        const loginNuevaContraseña = await request(app).post('/api/auth/login')
            .send({ username: 'usuarioprueba', password: 'nuevaContraseña123' });
        expect(loginNuevaContraseña.status).toBe(200);
    });

    it('rechaza reutilizar el mismo enlace de restablecimiento una segunda vez', async () => {
        const registerResponse = await request(app).post('/api/auth/register')
            .send({ username: 'usuarioprueba', email: 'usuarioprueba@example.com', password: 'password123' });
        const registeredUser = await User.findById(registerResponse.body.id);
        const token = AuthService.signPasswordResetToken(registeredUser!);

        const primerUso = await request(app).post('/api/auth/reset-password')
            .send({ token, newPassword: 'primeraNueva123' });
        expect(primerUso.status).toBe(200);

        const segundoUso = await request(app).post('/api/auth/reset-password')
            .send({ token, newPassword: 'segundaNueva123' });
        expect(segundoUso.status).toBe(401);
    });

    it('devuelve error con un token inválido o expirado', async () => {
        const response = await request(app).post('/api/auth/reset-password')
            .send({ token: 'tokenInvalido', newPassword: 'nuevaContraseña123' });
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
    });
});

describe('Protección contra inyección NoSQL (sanitizeFilter)', () => {
    it('un operador de MongoDB en el filtro no actúa como comodín -- Mongoose rechaza la consulta', async () => {
        await request(app).post('/api/auth/register')
            .send({ username: 'usuarioprueba', email: 'usuarioprueba@example.com', password: 'password123' });

        // Sin sanitizeFilter, esto devolvería el primer usuario de la colección
        // (cualquier username "no nulo" cuela). Con sanitizeFilter, Mongoose deja
        // de tratar $ne como operador sobre el campo y en su lugar intenta castear
        // el objeto entero a String (el tipo declarado en el schema) -- falla el
        // cast y la consulta se rechaza, en vez de colar un comodín silenciosamente.
        await expect(
            User.findOne({ username: { $ne: null } } as unknown as { username: string })
        ).rejects.toThrow(/Cast to string failed/);
    });

    it('el mismo intento contra /login no autentica a nadie', async () => {
        await request(app).post('/api/auth/register')
            .send({ username: 'usuarioprueba', email: 'usuarioprueba@example.com', password: 'password123' });

        const response = await request(app).post('/api/auth/login')
            .send({ username: { $ne: null }, password: 'cualquiera' });

        expect(response.status).toBe(401);
    });
});