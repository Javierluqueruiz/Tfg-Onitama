//FEAT-08 Sub-08.1/2
import { describe, it, expect, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { AuthService, AuthError } from '../../src/auth/authService';
import { User, IUser } from '../../src/auth/User.model';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('AuthService - hashing y JWT', () => {
    it('hashPassword genera un hash distinto al texto original', async () => {
        const hash = await AuthService.hashPassword('miContraseña');
        expect(hash).not.toBe('miContraseña');
    });

    it('comparePassword devuelve true para la contraseña correcta', async () => {
        const hash = await AuthService.hashPassword('miContraseña');
        const isValid = await AuthService.comparePassword('miContraseña', hash);
        expect(isValid).toBe(true);
    });

    it('comparePassword devuelve false para la contraseña incorrecta', async () => {
        const hash = await AuthService.hashPassword('miContraseña');
        const isValid = await AuthService.comparePassword('otraContraseña', hash);
        expect(isValid).toBe(false);
    });

    it('signToken y verifyToken son funciones complementarias', () => {
        const fakeUser = { _id: new mongoose.Types.ObjectId(), username: 'usuarioPrueba' } as IUser;
        const token = AuthService.signToken(fakeUser);
        const payload = AuthService.verifyToken(token);

        expect(payload.sub).toBe(fakeUser._id.toString());
        expect(payload.username).toBe(fakeUser.username);
    });

    it('verifyToken lanza un error para un token inválido', () => {
        expect(() => AuthService.verifyToken('tokenInvalido')).toThrow();
    });
});

describe('AuthService.register', async () => {
    it('registra al ususario con la contraseña hasheada', async () => {
        const createSpy = vi.spyOn(User, 'create')
        //@ts-expect-error
        .mockResolvedValue({
            _id: new mongoose.Types.ObjectId(),
            username: 'usuarioPrueba'
        } as IUser);

        await AuthService.register('usuarioPrueba', 'usuario@prueba.com', 'miContraseña');

        const savedData = createSpy.mock.calls[0][0] as { passwordHash: string };
        expect(savedData.passwordHash).not.toBe('miContraseña');
    });

    it('lanza un error 409 si el email o username ya existen', async () => {
        vi.spyOn(User, 'create').mockRejectedValue({ code: 11000 });

        await expect(AuthService.register('usuarioPrueba', 'usuario@prueba.com', 'miContraseña')
        ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('lanza un error 400 si falla la validación de datos', async () => {
        const validationError = new mongoose.Error.ValidationError();
        validationError.errors.username = new mongoose.Error.ValidatorError({ message: 'Username muy corto'});
        vi.spyOn(User, 'create').mockRejectedValue(validationError);

        await expect(AuthService.register('us', 'usuario@prueba.com', 'miContraseña')
        ).rejects.toBeInstanceOf( AuthError );
    });
});

describe('AuthService.login', async () => {
    it('lanza un error 401 si el usuario no existe', async () => {
        vi.spyOn(User, 'findOne').mockResolvedValue(null);

        await expect(AuthService.login('usuarioInexistente', 'miContraseña')
        ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('lanza un error 401 si la contraseña es incorrecta', async () => {
        const hash = await AuthService.hashPassword('miContraseña');
        //@ts-expect-error
        vi.spyOn(User, 'findOne').mockResolvedValue({ username: 'usuarioPrueba', passwordHash: hash });

        await expect(AuthService.login('usuarioPrueba', 'contraseñaIncorrecta')
        ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('devuelve el usuario y token si las credenciales son correctas', async () => {
        const hash = await AuthService.hashPassword('miContraseña');
        const fakeUser = { _id: new mongoose.Types.ObjectId(), username: 'usuarioPrueba', passwordHash: hash } as IUser;

        //@ts-expect-error
        vi.spyOn(User, 'findOne').mockResolvedValue(fakeUser);

        const { token, user } = await AuthService.login('usuarioPrueba', 'miContraseña');

        expect(user.username).toBe(fakeUser.username);
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(AuthService.verifyToken(token).username).toBe('usuarioPrueba');
    });
});