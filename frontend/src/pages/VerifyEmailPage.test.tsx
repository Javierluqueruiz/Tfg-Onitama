import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { VerifyEmailPage } from "./VerifyEmailPage";
import { AuthApi } from "../services/authApi";

vi.mock('../services/authApi');

describe("VerifyEmailPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('muestra un error si no hay token en la URL', async () => {
        render(<MemoryRouter initialEntries={['/verify-email']}><VerifyEmailPage /></MemoryRouter>);

        expect(await screen.findByText('Token de verificación no proporcionado.')).toBeInTheDocument();
        expect(AuthApi.verifyEmail).not.toHaveBeenCalled();
    });

    it('muestra un mensaje de éxito si la verificación es exitosa', async () => {
        vi.mocked(AuthApi.verifyEmail).mockResolvedValue({ id: '123', username: 'testuser', emailVerified: true });

        render(<MemoryRouter initialEntries={['/verify-email?token=fake-token']}><VerifyEmailPage /></MemoryRouter>);

        expect(AuthApi.verifyEmail).toHaveBeenCalledWith('fake-token');
        expect(await screen.findByText('¡Correo electrónico verificado con éxito!')).toBeInTheDocument();
    });

    it('muestra un mensaje de error si la verificación falla', async () => {
        vi.mocked(AuthApi.verifyEmail).mockRejectedValue(new Error('El enlace de verificación es inválido o ha expirado.'));

        render(<MemoryRouter initialEntries={['/verify-email?token=invalid-token']}><VerifyEmailPage /></MemoryRouter>);

        expect(AuthApi.verifyEmail).toHaveBeenCalledWith('invalid-token');
        expect(await screen.findByText('El enlace de verificación es inválido o ha expirado.')).toBeInTheDocument();
    });
});