//FEAT-08 Sub-08.1/2
import { describe, it, expect, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { AuthService, AuthError } from '../../src/auth/authService';
import { User, IUser } from '../../src/auth/User.model';

vi.mock('../../src/auth/emailService', () => ({
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    sendVerifyBeforeResetEmail: vi.fn().mockResolvedValue(undefined),
}));

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
        // @ts-expect-error -- mock simplificado, no implementa el tipo completo de documento de Mongoose
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

    it('lanza un error 400 si la contraseña es demasiado corta', async () => {
        await expect(AuthService.register('usuarioPrueba', 'usuario@prueba.com', '12345')
        ).rejects.toMatchObject({ statusCode: 400 });
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
        // @ts-expect-error -- mock simplificado, no implementa el tipo completo de documento de Mongoose
        vi.spyOn(User, 'findOne').mockResolvedValue({ username: 'usuarioPrueba', passwordHash: hash });

        await expect(AuthService.login('usuarioPrueba', 'contraseñaIncorrecta')
        ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('devuelve el usuario y token si las credenciales son correctas', async () => {
        const hash = await AuthService.hashPassword('miContraseña');
        const fakeUser = { _id: new mongoose.Types.ObjectId(), username: 'usuarioPrueba', passwordHash: hash } as IUser;

        // @ts-expect-error -- mock simplificado, no implementa el tipo completo de documento de Mongoose
        vi.spyOn(User, 'findOne').mockResolvedValue(fakeUser);

        const { token, user } = await AuthService.login('usuarioPrueba', 'miContraseña');

        expect(user.username).toBe(fakeUser.username);
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(AuthService.verifyToken(token).username).toBe('usuarioPrueba');
    });
});

//Sub-08.4

describe('AuthService - verificación de correo', () => {
    it('signEmailVerificationToken y verifyEmailVerificationToken son funciones complementarias', () => {
        const token = AuthService.signEMailVerificationToken('12345');
        expect(AuthService.verifyEmailVerificationToken(token)).toBe('12345');
    });

    it('verifyEmail marca al usuario como verificado', async () => {
        const save = vi.fn().mockResolvedValue(undefined);
        const fakeUser = { emailVerified: false, save };

        vi.spyOn(User, 'findById').mockResolvedValue(fakeUser);

        const token = AuthService.signEMailVerificationToken('12345');
        const user = await AuthService.verifyEmail(token);
        
        expect(user.emailVerified).toBe(true);
        expect(save).toHaveBeenCalledOnce();
    });

    it('verifyEmail lanza un error 400 si el token es inválido o ha expirado', async () => {
        await expect(AuthService.verifyEmail('tokenInvalido'))
            .rejects.toMatchObject({ statusCode: 400 });
    });

    it('verifyEmail lanza un error 404 si el usuario no existe', async () => {
        vi.spyOn(User, 'findById').mockResolvedValue(null);
        const token = AuthService.signEMailVerificationToken('12345');

        await expect(AuthService.verifyEmail(token))
            .rejects.toMatchObject({ statusCode: 404 });
    });

    it('resendVerificationEmail lanza un error 400 si el correo ya ha sido verificado', async () => {
        vi.spyOn(User, 'findById').mockResolvedValue({ emailVerified: true } as IUser);

        await expect(AuthService.resendVerificationEmail('12345'))
            .rejects.toMatchObject({ statusCode: 400 });
    });
});

describe('AuthService - recuperación de contraseña', () => {
    it('signPasswordResetToken y verifyPasswordResetToken son funciones complementarias', () => {
        const token = AuthService.signPasswordResetToken('12345');
        expect(AuthService.verifyPasswordResetToken(token)).toBe('12345');  
    });

    it('requestPasswordReset no revela si el correo existe o no', async () => {
        vi.spyOn(User, 'findOne').mockResolvedValue(null);
        await 
        expect(AuthService.requestPasswordReset('noExiste@example.com')).resolves.toBeUndefined();
    });

    it('resetPassword actualiza la contraseña del usuario si el token es válido', async () => {
        const save = vi.fn().mockResolvedValue(undefined);
        const fakeUser = { passwordHash: 'hash-antiguo', save };

        vi.spyOn(User, 'findById').mockResolvedValue(fakeUser);

        const token = AuthService.signPasswordResetToken('12345');
        await AuthService.resetPassword(token, 'nuevaContraseña');

        expect(fakeUser.passwordHash).not.toBe('hash-antiguo');
        expect(save).toHaveBeenCalledOnce();
    });

    it('resetPassword lanza un error 400 si la contraseña es demasiado corta', async () => {
        const token = AuthService.signPasswordResetToken('12345');
        await expect(AuthService.resetPassword(token, 'con'))
            .rejects.toMatchObject({ statusCode: 400 });
    });

    it('resetPassword lanza un error si el token no es válido', async () => {
        await expect(AuthService.resetPassword('tokenInvalido', 'nuevaContraseña'))
            .rejects.toBeInstanceOf(AuthError);
    });

    it('requestPasswordReset manda el correo de verificación, no el de reseteo, si el correo no está verificado', async () => {
        const fakeUser = { _id: new mongoose.Types.ObjectId(), email: 'usuarioPrueba@example.com', emailVerified: false };
        // @ts-expect-error -- mock simplificado, no implementa el tipo completo de documento de Mongoose
        vi.spyOn(User, 'findOne').mockResolvedValue(fakeUser);
        
        await expect(AuthService.requestPasswordReset('usuarioPrueba@example.com')).resolves.toBeUndefined();
        const emailService = await import('../../src/auth/emailService.js');
        expect(emailService.sendVerifyBeforeResetEmail).toHaveBeenCalledOnce();
        expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
});