import { createContext, useContext, useState, useEffect } from 'react';
import type { RegisterRequest, LoginRequest, AuthUser } from '../../../shared';
import { AuthApi } from '../services/authApi';

interface AuthContextState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    register: (payload: RegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => {},
    register: async () => {},
    logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        AuthApi.me()
            .then((restoredUser) => setUser(restoredUser))
            .catch(() => {
                // sin cookie de sesión válida -- se queda como invitado
            })
            .finally(() => setIsLoading(false));
    }, []);

    const login = async (credentials: LoginRequest) => {
        const response = await AuthApi.login(credentials);
        setUser(response.user);
    };

    const register = async (payload: RegisterRequest) => {
        await AuthApi.register(payload);
        await login({ username: payload.username, password: payload.password });
    };

    const logout = async () => {
        await AuthApi.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    return useContext(AuthContext);
};