import { env } from '../config/env';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUser, User } from './User.model';
import mongoose from 'mongoose';

const SALT_ROUNDS = 10;

export class AuthError extends Error {
    constructor(message: string, public readonly statusCode: number) {
        super(message);
        this.name = 'AuthError';
    }
}

export interface TokenPayload {
    sub: string;
    username: string;
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
        const payload: TokenPayload = { sub: user._id.toString(), username: user.username };
        return jwt.sign(payload, AuthService.getJwtSecret(), {
            expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
        })
    }

    static verifyToken(token: string): TokenPayload {
        return jwt.verify(token, AuthService.getJwtSecret()) as TokenPayload;
    }

    static async register(username: string, email: string, password: string): Promise<IUser> {
        if (password.length < 6) {
            throw new AuthError('La contraseña debe tener al menos 6 caracteres', 400);
        }
        const passwordHash = await AuthService.hashPassword(password);
        try {
            return await User.create({ username, email, passwordHash });
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
    }

    static async login(username: string, password: string): Promise<{user: IUser, token: string}> {
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
}

function isDuplicateKeyError(error: unknown): error is { code: number } {
    return typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown}).code === 11000;
}