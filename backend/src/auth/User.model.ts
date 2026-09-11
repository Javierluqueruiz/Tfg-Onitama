import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    usernameLower: string;
    email: string;
    passwordHash: string;
    passwordChangedAt: Date;
    createdAt: Date;
    emailVerified: boolean;
}

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
});

userSchema.pre('validate', function () {
    if (this.isModified('username')) {
        this.usernameLower = this.username.toLowerCase();
    }
});

export const User = model<IUser>('User', userSchema);