//FEAT-08
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface AuthUser {
    id: string;
    username: string;
}

export interface AuthResponse {
    token: string;
    user: AuthUser;
}

