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
    updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => {},
    register: async () => {},
    logout: async () => {},
    updateUser: () => {},
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
        // /api/auth/register ya deja la sesión iniciada (pone la cookie) en la
        // misma petición -- no hace falta un login aparte, y además el token de
        // Turnstile ya se habría gastado en el registro (es de un solo uso).
        const registeredUser = await AuthApi.register(payload);
        setUser(registeredUser);
    };

    const logout = async () => {
        await AuthApi.logout();
        setUser(null);
    };

    // Para cuando una acción fuera del propio login/register cambia al usuario
    // en el servidor (por ejemplo, verificar el correo) y el resultado ya
    // viaja en la respuesta de esa llamada -- evita tener que volver a pedir
    // /me solo para refrescar el estado local.
    const updateUser = (updatedUser: AuthUser) => {
        setUser(updatedUser);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    return useContext(AuthContext);
};