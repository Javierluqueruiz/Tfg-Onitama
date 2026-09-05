import { createContext, useContext, useState } from 'react';
import type { RegisterRequest, LoginRequest, AuthUser } from '../../../shared';
import { AuthApi } from '../services/authApi';

interface AuthContextState {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    register: (payload: RegisterRequest) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextState>({
    user: null,
    token: null,
    isAuthenticated: false,
    login: async () => {},
    register: async () => {},
    logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);

    const login = async (credentials: LoginRequest) => {
        const response = await AuthApi.login(credentials);
        setToken(response.token);
        setUser(response.user);
    };

    const register = async (payload: RegisterRequest) => {
        await AuthApi.register(payload);
        await login({ username: payload.username, password: payload.password });
    };

    const logout = () => {
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
}