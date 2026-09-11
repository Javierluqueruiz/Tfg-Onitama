import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { VerifyEmailPage } from "./VerifyEmailPage";
import { AuthApi } from "../services/authApi";
import { useAuth } from "../contexts/AuthContext";

vi.mock('../services/authApi');
vi.mock('../contexts/AuthContext');

const updateUser = vi.fn();

describe("VerifyEmailPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuth).mockReturnValue({
            user: null, isAuthenticated: false, isLoading: false,
            login: vi.fn(), register: vi.fn(), logout: vi.fn(), updateUser,
        });
    });

    it('muestra un error si no hay token en la URL', async () => {
        render(<MemoryRouter initialEntries={['/verify-email']}><VerifyEmailPage /></MemoryRouter>);

        expect(await screen.findByText('Token de verificación no proporcionado.')).toBeInTheDocument();
        expect(AuthApi.verifyEmail).not.toHaveBeenCalled();
    });

    it('muestra un mensaje de éxito si la verificación es exitosa', async () => {
        const verifiedUser = { id: '123', username: 'testuser', emailVerified: true };
        vi.mocked(AuthApi.verifyEmail).mockResolvedValue(verifiedUser);

        render(<MemoryRouter initialEntries={['/verify-email?token=fake-token']}><VerifyEmailPage /></MemoryRouter>);

        expect(AuthApi.verifyEmail).toHaveBeenCalledWith('fake-token');
        expect(await screen.findByText('¡Correo electrónico verificado con éxito!')).toBeInTheDocument();

        // Sin esto, AuthStatus se queda con el usuario desactualizado (todavía
        // sin verificar) que AuthContext pidió a /me al arrancar la app, y
        // seguiría mostrando el aviso de correo pendiente hasta recargar.
        expect(updateUser).toHaveBeenCalledWith(verifiedUser);
    });

    it('muestra un mensaje de error si la verificación falla', async () => {
        vi.mocked(AuthApi.verifyEmail).mockRejectedValue(new Error('El enlace de verificación es inválido o ha expirado.'));

        render(<MemoryRouter initialEntries={['/verify-email?token=invalid-token']}><VerifyEmailPage /></MemoryRouter>);

        expect(AuthApi.verifyEmail).toHaveBeenCalledWith('invalid-token');
        expect(await screen.findByText('El enlace de verificación es inválido o ha expirado.')).toBeInTheDocument();
        expect(updateUser).not.toHaveBeenCalled();
    });
});