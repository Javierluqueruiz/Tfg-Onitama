import { createContext, useContext, useState, useEffect } from 'react';
import type { RegisterRequest, LoginRequest, AuthUser } from '../../../shared';
import { AuthApi } from '../services/authApi';

const TOKEN_STORAGE_KEY = 'onitama_token';

interface AuthContextState {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    register: (payload: RegisterRequest) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => {},
    register: async () => {},
    logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem(TOKEN_STORAGE_KEY));

    useEffect(() => {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

        if (!storedToken) {
            return;
        }

        AuthApi.me(storedToken)
            .then((restoredUser) => {
                setUser(restoredUser);
                setToken(storedToken);
            })
            .catch(() => {
                localStorage.removeItem(TOKEN_STORAGE_KEY);
            })
            .finally(() => {
                setIsLoading(false);
            })
    }, []);

    const login = async (credentials: LoginRequest) => {
        const response = await AuthApi.login(credentials);
        localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
        setToken(response.token);
        setUser(response.user);
    };

    const register = async (payload: RegisterRequest) => {
        await AuthApi.register(payload);
        await login({ username: payload.username, password: payload.password });
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    return useContext(AuthContext);
}