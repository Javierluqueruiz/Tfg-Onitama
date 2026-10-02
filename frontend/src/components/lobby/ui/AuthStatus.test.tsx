import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthStatus } from "./AuthStatus";
import { useAuth } from "../../../contexts/AuthContext";

vi.mock('../../../contexts/AuthContext');

function mockUseAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
    vi.mocked(useAuth).mockReturnValue({
        user: null, isAuthenticated: false, isLoading: false,
        login: vi.fn(), register: vi.fn(), logout: vi.fn(), updateUser: vi.fn(), ...overrides,
    });
}


describe("AuthStatus", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('no muestra nada mientras se restaura la sesión', () => {
        mockUseAuth({ isLoading: true });
        const { container } = render(<MemoryRouter><AuthStatus /></MemoryRouter>);
        expect(container).toBeEmptyDOMElement();
    });

    it('ofrece iniciar sesión y registrarse si no hay usuario autenticado', () => {
        mockUseAuth();
        render(<MemoryRouter><AuthStatus /></MemoryRouter>);
        expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login');
        expect(screen.getByRole('link', { name: 'Registrarse' })).toHaveAttribute('href', '/register');
        expect(screen.queryByText('Jugando como invitado')).not.toBeInTheDocument();
    });
    
        it('con sesión muestra el nombre y cerrar sesión, sin avisos de verificación aunque el correo no esté verificado', () => {
        mockUseAuth({ isAuthenticated: true, user: { id: '123', username: 'testuser', emailVerified: false } });
        render(<MemoryRouter><AuthStatus /></MemoryRouter>);

        expect(screen.getByRole('link', { name: /testuser/ })).toHaveAttribute('href', '/profile');
        expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /reenviar/i })).not.toBeInTheDocument();
    });

    it('cerrar sesión llama a logout', () => {
        const logout = vi.fn();
        mockUseAuth({ isAuthenticated: true, user: { id: '123', username: 'testuser', emailVerified: true }, logout });
        render(<MemoryRouter><AuthStatus /></MemoryRouter>);

        fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

        expect(logout).toHaveBeenCalledTimes(1);
    });
}); 
