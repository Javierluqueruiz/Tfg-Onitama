import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
}

const userSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minLength: 3,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El correo no tiene un formato válido'],
    },
    passwordHash: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export const User = model<IUser>('User', userSchema);