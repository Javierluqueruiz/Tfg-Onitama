import type { RegisterRequest, LoginRequest, AuthResponse, AuthUser, ForgotPasswordRequest, ResetPasswordRequest } from '../../../shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function postJson<TResponse>(path: string, body?: unknown): Promise<TResponse> {
    let response: Response;

    try {
        response = await fetch(`${API_URL}${path}`, {
            method: 'POST',
            credentials: 'include',
            // El backend exige esta cabecera en toda petición que cambia estado
            // (protección CSRF, ver authRoutes.ts) -- un <form> HTML no puede
            // añadirla, solo fetch/XHR puede.
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
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

async function getJson<TResponse>(path: string): Promise<TResponse> {
    let response: Response;

    try {
        response = await fetch(`${API_URL}${path}`, { credentials: 'include' });
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