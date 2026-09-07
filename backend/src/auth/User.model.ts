import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    emailVerified: boolean;
}

const userSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
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
    emailVerified: {
        type: Boolean,
        default: false,
    },
});

export const User = model<IUser>('User', userSchema);