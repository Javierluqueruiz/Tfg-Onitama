//FEAT-08
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    captchaToken: string;
}

export interface LoginRequest {
    username: string;
    password: string;
    captchaToken: string;
}

export interface AuthUser {
    id: string;
    username: string;
    emailVerified: boolean;
}

export interface AuthResponse {
    user: AuthUser;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

