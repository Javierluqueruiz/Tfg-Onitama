import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthStatus } from "./AuthStatus";
import { AuthApi } from "../../../services/authApi";
import { useAuth } from "../../../contexts/AuthContext";

vi.mock('../../../services/authApi');
vi.mock('../../../contexts/AuthContext');

function mockUseAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
    vi.mocked(useAuth).mockReturnValue({
        user: null, token: null, isAuthenticated: false, isLoading: false, 
        login: vi.fn(), register: vi.fn(), logout: vi.fn(), ...overrides,
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

    it('muestra el modo invitado si no hay usuario autenticado', () => {
        mockUseAuth();
        render(<MemoryRouter><AuthStatus /></MemoryRouter>);
        expect(screen.getByText('Jugando como invitado')).toBeInTheDocument();
    });
    
    it('muestra el aviso de correo no verificado', () => {
        mockUseAuth({ isAuthenticated: true, token: 'fake-token', user: { id: '123', username: 'testuser', emailVerified: false } });
        render(<MemoryRouter><AuthStatus /></MemoryRouter>);
        expect(screen.getByRole('button', { name: 'Reenviar correo de verificación' })).toBeInTheDocument();
    });

    it('no muestra el aviso de correo no verificado si el correo está verificado', () => {
        mockUseAuth({ isAuthenticated: true, token: 'fake-token', user: { id: '123', username: 'testuser', emailVerified: true } });
        render(<MemoryRouter><AuthStatus /></MemoryRouter>);
        expect(screen.queryByRole('button', { name: 'Reenviar correo de verificación' })).not.toBeInTheDocument();
    });

    it('reenvia el correo y muestra confirmación al pulsar el botón', async () => {
        vi.mocked(AuthApi.resendVerificationEmail).mockResolvedValue({message: 'ok'});
        mockUseAuth({ isAuthenticated: true, token: 'fake-token', user: { id: '123', username: 'testuser', emailVerified: false } });
        
        render(<MemoryRouter><AuthStatus /></MemoryRouter>);
        fireEvent.click(screen.getByRole('button', { name: 'Reenviar correo de verificación' }));

        expect(await screen.findByText('Correo de verificación reenviado')).toBeInTheDocument();
        expect(AuthApi.resendVerificationEmail).toHaveBeenCalledWith('fake-token');
    });
}); 
