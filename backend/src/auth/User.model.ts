import { Schema, model, Document } from 'mongoose';
import { LastMatchEntry, MatchResult } from '../../../shared';

export interface IUser extends Document {
    username: string;
    usernameLower: string;
    email: string;
    passwordHash: string;
    passwordChangedAt: Date;
    createdAt: Date;
    emailVerified: boolean;
    elo: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    lastMatches: LastMatchEntry[];
}

const lastMatchSchema = new Schema({
    opponentName: { type: String, required: true },
    result: { type: String, enum: ['win', 'loss', 'draw'] as MatchResult[], required: true },
    eloChange: { type: Number, required: true },
    date: { type: Date, default: Date.now },
}, { _id: false });


const userSchema = new Schema<IUser>({
    username: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
    },
    usernameLower: {
        type: String,
        required: true,
        unique: true,
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
    passwordChangedAt: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    emailVerified: {
        type: Boolean,
        default: false,
    },
    elo: {
        type: Number,
        default: 1000,
    },
    gamesPlayed: {
        type: Number,
        default: 0,
    },
    wins: {
        type: Number,
        default: 0,
    },
    losses: {
        type: Number,
        default: 0,
    },
    draws: {
        type: Number,
        default: 0,
    },
    lastMatches: {
        type: [lastMatchSchema],
        default: [],
    },
});

userSchema.pre('validate', function () {
    if (this.isModified('username')) {
        this.usernameLower = this.username.toLowerCase();
    }
});

export const User = model<IUser>('User', userSchema);