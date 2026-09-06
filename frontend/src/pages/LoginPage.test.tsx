import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { useAuth } from '../contexts/AuthContext';

vi.mock('../contexts/AuthContext');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

function mockUseAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
    vi.mocked(useAuth).mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
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

        await waitFor(() => expect(login).toHaveBeenCalledWith({ username: 'testuser', password: 'password' }));
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