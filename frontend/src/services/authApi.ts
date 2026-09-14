import type { RegisterRequest, LoginRequest, AuthResponse, AuthUser, ForgotPasswordRequest, ResetPasswordRequest } from '../../../shared';
import { getJson, postJson } from './httpClient';

export const AuthApi = {
    register(payload: RegisterRequest): Promise<AuthUser> {
        return postJson('/api/auth/register', payload);
    },

    login(payload: LoginRequest): Promise<AuthResponse> {
        return postJson('/api/auth/login', payload);
    },

    logout(): Promise<{ message: string }> {
        return postJson('/api/auth/logout');
    },

    me(): Promise<AuthUser> {
        return getJson('/api/auth/me');
    },

    verifyEmail(token: string): Promise<AuthUser> {
        return postJson('/api/auth/verify-email', { token });
    },

    resendVerificationEmail(): Promise<{ message: string }> {
        return postJson('/api/auth/resend-verification');
    },

    forgotPassword(payload: ForgotPasswordRequest): Promise<{ message: string }> {
        return postJson('/api/auth/forgot-password', payload);
    },

    resetPassword(payload: ResetPasswordRequest): Promise<{ message: string }> {
        return postJson('/api/auth/reset-password', payload);
    },
};