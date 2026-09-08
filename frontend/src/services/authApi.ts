import type { RegisterRequest, LoginRequest, AuthResponse, AuthUser, ForgotPasswordRequest, ResetPasswordRequest } from '../../../shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
    let response: Response;
    
    try {
        response = await fetch(`${API_URL}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    } catch {
        throw new Error('Error de red. No se pudo conectar con el servidor.');
    }
    
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Error en la solicitud');
    }

    return data as TResponse;
}

async function getJson<TResponse>(path: string, token: string): Promise<TResponse> {
    let response: Response;

    try {
        response = await fetch(`${API_URL}${path}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    } catch {
        throw new Error('Error de red. No se pudo conectar con el servidor.');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Error en la solicitud');
    }

    return data as TResponse;
    
}

async function authPost<TResponse>(path: string, token: string): Promise<TResponse> {
    let response: Response;

    try {
        response = await fetch(`${API_URL}${path}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    } catch {
        throw new Error('Error de red. No se pudo conectar con el servidor.');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Error en la solicitud');
    }

    return data as TResponse;
}

export const AuthApi = {
    register(payload: RegisterRequest): Promise<AuthUser> {
        return postJson('/api/auth/register', payload);
    },

    login(payload: LoginRequest): Promise<AuthResponse> {
        return postJson('/api/auth/login', payload);
    },

    me(token: string): Promise<AuthUser> {
        return getJson('/api/auth/me', token);
    },

    verifyEmail(token: string): Promise<AuthUser> {
        return postJson('/api/auth/verify-email', { token });
    },

    resendVerificationEmail(token: string): Promise<{ message: string }> {
        return authPost('/api/auth/resend-verification', token);
    },

    forgotPassword(payload: ForgotPasswordRequest): Promise<{ message: string }> {
        return postJson('/api/auth/forgot-password', payload);
    },

    resetPassword(payload: ResetPasswordRequest): Promise<{ message: string }> {
        return postJson('/api/auth/reset-password', payload);
    },
};