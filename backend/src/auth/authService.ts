import { env } from '../config/env';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUser, User } from './User.model';
import mongoose from 'mongoose';
import { sendVerificationEmail, sendPasswordResetEmail, sendVerifyBeforeResetEmail } from './emailService';

const SALT_ROUNDS = 10;

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
}

interface EmailVerificationPayload {
    purpose: 'emailVerification';
    sub: string;
}

interface PasswordResetPayload {
    purpose: 'passwordReset';
    sub: string;
}

export class AuthService {
    private static getJwtSecret(): string {
        if (!env.jwtSecret) {
            throw new Error('Falta la variable de entorno JWT_SECRET');
        }
        return env.jwtSecret;
    }

    static hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, SALT_ROUNDS);
    }

    static comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    static signToken(user: IUser): string {
        const payload: TokenPayload = { purpose: 'session', sub: user._id.toString(), username: user.username };
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

    static async register(username: string, email: string, password: string): Promise<IUser> {
        if (password.length < 6) {
            throw new AuthError('La contraseña debe tener al menos 6 caracteres', 400);
        }
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

        const user = await User.findOne({ username });
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
    static signPasswordResetToken(userId: string): string {
        return jwt.sign(
            { purpose: 'passwordReset', sub: userId},
            AuthService.getJwtSecret(),
            { expiresIn: '1h' }
        );
    }

    static verifyPasswordResetToken(token: string): string {
        const payload = jwt.verify(token, AuthService.getJwtSecret()) as PasswordResetPayload;

        if (payload.purpose !== 'passwordReset') {
            throw new AuthError('Token inválido', 401);
        }
        return payload.sub;
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
            
            const token = AuthService.signPasswordResetToken(user._id.toString());
            const resetUrl = `${env.frontendOrigin}/reset-password?token=${token}`;
            await sendPasswordResetEmail(user.email, resetUrl);
        } catch (error) {
            console.error('Error al enviar el correo de restablecimiento de contraseña:', error);
        }   
    }

    static async resetPassword(token: string, newPassword: string): Promise<void> {
        if (newPassword.length < 6) {
            throw new AuthError('La contraseña debe tener al menos 6 caracteres', 400);
        }

        let userId: string;
        try {
            userId = AuthService.verifyPasswordResetToken(token);
        } catch {
            throw new AuthError('El enlace de restablecimiento de contraseña es inválido o ha expirado', 401);
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new AuthError('Usuario no encontrado', 404);
        }

        user.passwordHash = await AuthService.hashPassword(newPassword);
        await user.save();
    }
}

function isDuplicateKeyError(error: unknown): error is { code: number } {
    return typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown}).code === 11000;
}