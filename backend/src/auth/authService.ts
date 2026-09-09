import { env } from '../config/env';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUser, User } from './User.model';
import mongoose from 'mongoose';
import { sendVerificationEmail, sendPasswordResetEmail, sendVerifyBeforeResetEmail } from './emailService';

const SALT_ROUNDS = 10;

const COMMON_PASSWORDS = new Set([
        '12345678', 'password', '123456789', 'password1', 'qwerty123', 
        '11111111', '87654321', 'abcdefgh', '123123123', 'admin1234',
        'onitama1', 'letmein', 'welcome1', 'abc12345', 'iloveyou1', 'monkey123', 
        'dragon12', 'sunshine', 'princess', 'football', 'baseball',
        'superman', 'batman', 'starwars', 'pokemon', 'shadow12', 'master12',
        'hello123', 'freedom1', 'whatever', 'trustno1', 'qazwsx12', 'zaq12wsx',
    ])

export class AuthError extends Error {
    constructor(message: string, public readonly statusCode: number) {
        super(message);
        this.name = 'AuthError';
    }
}

export interface TokenPayload {
    purpose: 'session';
    sub: string;
    username: string;
    passwordChangedAt: number;
}

interface EmailVerificationPayload {
    purpose: 'emailVerification';
    sub: string;
}

interface PasswordResetPayload {
    purpose: 'passwordReset';
    sub: string;
    passwordChangedAt: number;
}

export class AuthService {
    private static getJwtSecret(): string {
        if (!env.jwtSecret) {
            throw new Error('Falta la variable de entorno JWT_SECRET');
        }
        return env.jwtSecret;
    }

    

    private static assertStrongPassword(password: string): void {
        if (password.length < 8) {
            throw new AuthError('La contraseña debe tener al menos 8 caracteres', 400);
        }
        if (COMMON_PASSWORDS.has(password.toLocaleLowerCase())) {
            throw new AuthError('La contraseña es demasiado común', 400);
        }
    }

    static hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, SALT_ROUNDS);
    }

    static comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    static signToken(user: IUser): string {
        const payload: TokenPayload = {
            purpose: 'session',
            sub: user._id.toString(),
            username: user.username,
            passwordChangedAt: user.passwordChangedAt.getTime(),
        };
        return jwt.sign(payload, AuthService.getJwtSecret(), {
            expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
        })
    }

    static verifyToken(token: string): TokenPayload {
        const payload =  jwt.verify(token, AuthService.getJwtSecret()) as TokenPayload;
        
        if (payload.purpose !== 'session') {
            throw new AuthError('Token inválido', 401);
        }
        return payload;
    }

    static async isSessionStillValid(payload: TokenPayload): Promise<boolean> {
        const user = await User.findById(payload.sub);
        if (!user) return false;

        return user.passwordChangedAt.getTime() === payload.passwordChangedAt;
    }

    static async register(username: string, email: string, password: string): Promise<IUser> {
        AuthService.assertStrongPassword(password);
        const passwordHash = await AuthService.hashPassword(password);
        let user: IUser;
        try {
            user = await User.create({ username, email, passwordHash });
        } catch (error) {
            if (isDuplicateKeyError(error)) {
                throw new AuthError('El nombre de usuario o correo ya está en uso', 409);  
            }
            if (error instanceof mongoose.Error.ValidationError) {
                const message = Object.values(error.errors).map(e => e.message).join(', ');
                throw new AuthError(`Error de validación: ${message}`, 400);
            }
            throw error;
        }

        await AuthService.sendVerificationEmail(user);
        return user;
    }

    static async login(username: string, password: string): Promise<{user: IUser, token: string}> {
        if (typeof username !== 'string' || typeof password !== 'string') {
            throw new AuthError('Nombre de usuario o contraseña incorrectos', 401);
        }

        const user = await User.findOne({ usernameLower: username.trim().toLowerCase() });
        if (!user) {
            throw new AuthError('Nombre de usuario o contraseña incorrectos', 401);
        }

        const isValid = await AuthService.comparePassword(password, user.passwordHash);
        if (!isValid) {
            throw new AuthError('Nombre de usuario o contraseña incorrectos', 401);
        }

        const token = AuthService.signToken(user);
        return { user, token };
    }

    static signEMailVerificationToken(userId: string): string {
        return jwt.sign(
            { purpose: 'emailVerification', sub: userId},
            AuthService.getJwtSecret(),
            { expiresIn: '1d'}
        );
    }    

    static verifyEmailVerificationToken(token: string): string {
        const payload = jwt.verify(token, AuthService.getJwtSecret()) as EmailVerificationPayload;

        if (payload.purpose !== 'emailVerification') {
            throw new AuthError('Token inválido', 401);
        }

        return payload.sub;
    }

    static async verifyEmail(token: string): Promise<IUser> {
        let userId: string;

        try {
            userId = AuthService.verifyEmailVerificationToken(token);
        } catch {
            throw new AuthError('El enlace de verificación es inválido o ha expirado', 400);
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new AuthError('Usuario no encontrado', 404);
        }

        user.emailVerified = true;
        await user.save();

        return user;
    }

    static async resendVerificationEmail(userId: string): Promise<void> {
        const user = await User.findById(userId);
        if (!user) {
            throw new AuthError('Usuario no encontrado', 404);
        }
        if (user.emailVerified) {
            throw new AuthError('El correo ya ha sido verificado', 400);
        }
        await AuthService.sendVerificationEmail(user);
    }

    private static async sendVerificationEmail(user: IUser): Promise<void> {
        try {
            const token = AuthService.signEMailVerificationToken(user._id.toString());
            const verificationLink = `${env.frontendOrigin}/verify-email?token=${token}`;
            await sendVerificationEmail(user.email, verificationLink);
        } catch (error) {
            console.error('Error al enviar el correo de verificación:', error);
        }
    }

    // Recuperación de contraseña
    static signPasswordResetToken(user: IUser): string {
        return jwt.sign(
            {
                purpose: 'passwordReset',
                sub: user._id.toString(),
                passwordChangedAt: user.passwordChangedAt.getTime(),
            },
            AuthService.getJwtSecret(),
            { expiresIn: '1h' }
        );
    }

    static verifyPasswordResetToken(token: string): PasswordResetPayload {
        const payload = jwt.verify(token, AuthService.getJwtSecret()) as PasswordResetPayload;

        if (payload.purpose !== 'passwordReset') {
            throw new AuthError('Token inválido', 401);
        }
        return payload;
    }

    static async requestPasswordReset(email: string): Promise<void> {
        const user = await User.findOne({ email });
        if (!user) {
            return; // No revelar si el correo existe o no
        }

        try {
            if (!user.emailVerified) {
                const verificationToken = AuthService.signEMailVerificationToken(user._id.toString());
                const verificationUrl = `${env.frontendOrigin}/verify-email?token=${verificationToken}`;
                await sendVerifyBeforeResetEmail(user.email, verificationUrl);
                return;
            }
            
            const token = AuthService.signPasswordResetToken(user);
            const resetUrl = `${env.frontendOrigin}/reset-password?token=${token}`;
            await sendPasswordResetEmail(user.email, resetUrl);
        } catch (error) {
            console.error('Error al enviar el correo de restablecimiento de contraseña:', error);
        }   
    }

    static async resetPassword(token: string, newPassword: string): Promise<void> {
        AuthService.assertStrongPassword(newPassword);

        let payload: PasswordResetPayload;
        try {
            payload = AuthService.verifyPasswordResetToken(token);
        } catch {
            throw new AuthError('El enlace de restablecimiento de contraseña es inválido o ha expirado', 401);
        }

        const user = await User.findById(payload.sub);
        if (!user) {
            throw new AuthError('Usuario no encontrado', 404);
        }

        // Si passwordChangedAt ya no coincide con lo que llevaba el token, es que
        // este mismo enlace ya se usó una vez (o la contraseña cambió por otra vía)
        // -- se rechaza en vez de dejar reutilizarlo.
        if (user.passwordChangedAt.getTime() !== payload.passwordChangedAt) {
            throw new AuthError('Este enlace de restablecimiento ya se ha utilizado', 401);
        }

        user.passwordHash = await AuthService.hashPassword(newPassword);
        user.passwordChangedAt = new Date();
        await user.save();
    }
}

function isDuplicateKeyError(error: unknown): error is { code: number } {
    return typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown}).code === 11000;
}