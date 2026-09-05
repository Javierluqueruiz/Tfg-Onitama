import type { RegisterRequest, LoginRequest, AuthResponse, AuthUser } from '../../../shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
    const response = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

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
};