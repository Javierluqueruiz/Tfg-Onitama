import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEffect } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { useAuth } from '../contexts/AuthContext';

vi.mock('../contexts/AuthContext');

// No hay window.turnstile real en el entorno de test -- se simula que el
// captcha ya se resolvió, para poder probar el envío del formulario en sí.
vi.mock('../components/TurnstileWidget', () => ({
    TurnstileWidget: ({ onVerify }: { onVerify: (token: string) => void }) => {
        useEffect(() => {
            onVerify('fake-captcha-token');
        }, [onVerify]);
        return null;
    },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

function mockUseAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
    vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
        ...overrides,
    });
}

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('llama a login con las credenciales correctas', async () => {
        const login = vi.fn().mockResolvedValue(undefined);
        mockUseAuth({ login });

        render(<MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );
        fireEvent.change(screen.getByLabelText(/usuario/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password' } });
        fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/i }));

        await waitFor(() => expect(login).toHaveBeenCalledWith({ username: 'testuser', password: 'password', captchaToken: 'fake-captcha-token' }));
    });

    it('navega a la página de inicio después de un inicio de sesión exitoso', async () => {
        mockUseAuth({ login: vi.fn().mockResolvedValue(undefined) });

        render(<MemoryRouter>
                <LoginPage />
            </MemoryRouter> 
        );
        fireEvent.change(screen.getByLabelText(/usuario/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'password' } });
        fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/i }));

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
    });

    it('tiene un enlace a la recuperación de contraseña', () => {
        mockUseAuth();

        render(<MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        expect(screen.getByRole('link', { name: /olvidaste tu contraseña/i })).toHaveAttribute('href', '/forgot-password');
    });

    it('muestra un mensaje de error si el inicio de sesión falla', async () => {
        mockUseAuth({ login: vi.fn().mockRejectedValue(new Error('Nombre de usuario o contraseña incorrectos')) });

        render(<MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );
        fireEvent.change(screen.getByLabelText(/usuario/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'wrongpassword' } });
        fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/i }));

        expect(await screen.findByText(/Nombre de usuario o contraseña incorrectos/i)).toBeInTheDocument();
    });

});