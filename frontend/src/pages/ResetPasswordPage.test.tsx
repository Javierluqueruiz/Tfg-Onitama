import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ResetPasswordPage } from './ResetPasswordPage';
import { AuthApi } from '../services/authApi';

vi.mock('../services/authApi');

describe('ResetPasswordPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('muestra un error si las conrtraseñas no coinciden', async () => {
        render(<MemoryRouter initialEntries={['/reset-password?token=abc123']}><ResetPasswordPage /></MemoryRouter>);

        fireEvent.change(screen.getByLabelText(/^Nueva contraseña:/i), { target: { value: 'password1' } });
        fireEvent.change(screen.getByLabelText(/Confirmar nueva contraseña:/i), { target: { value: 'password2' } });
        fireEvent.click(screen.getByRole('button', { name: /restablecer contraseña/i }));

        expect(await screen.findByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
        expect(AuthApi.resetPassword).not.toHaveBeenCalled();
    });

    it('llama a resetPassword con el token y la nueva contraseña si las contraseñas coinciden', async () => {
        vi.mocked(AuthApi.resetPassword).mockResolvedValueOnce({message: 'ok'});

        render(<MemoryRouter initialEntries={['/reset-password?token=abc123']}><ResetPasswordPage /></MemoryRouter>);
        fireEvent.change(screen.getByLabelText(/^Nueva contraseña:/i), { target: { value: 'password1' } });
        fireEvent.change(screen.getByLabelText(/Confirmar nueva contraseña:/i), { target: { value: 'password1' } });
        fireEvent.click(screen.getByRole('button', { name: /restablecer contraseña/i }));

        await waitFor(() => expect(AuthApi.resetPassword).toHaveBeenCalledWith({ token: 'abc123', newPassword: 'password1' }));
        expect (await screen.findByText(/Contraseña actualizada con éxito/i)).toBeInTheDocument();
    });

    it('muestra mensaje de error si falta el token', async () => {
        render(<MemoryRouter initialEntries={['/reset-password']}><ResetPasswordPage /></MemoryRouter>);

        fireEvent.change(screen.getByLabelText(/^Nueva contraseña:/i), { target: { value: 'password1' } });
        fireEvent.change(screen.getByLabelText(/Confirmar nueva contraseña:/i), { target: { value: 'password1' } });
        fireEvent.click(screen.getByRole('button', { name: /restablecer contraseña/i }));

        expect(await screen.findByText(/Token de restablecimiento de contraseña no proporcionado/i)).toBeInTheDocument();
        expect(AuthApi.resetPassword).not.toHaveBeenCalled();
    });

    it('muestra mensaje de error si el token es inválido', async () => {
        vi.mocked(AuthApi.resetPassword).mockRejectedValueOnce(new Error('El token es inválido o ha expirado'));

        render(<MemoryRouter initialEntries={['/reset-password?token=invalidtoken']}><ResetPasswordPage /></MemoryRouter>);
        fireEvent.change(screen.getByLabelText(/^Nueva contraseña:/i), { target: { value: 'password1' } });
        fireEvent.change(screen.getByLabelText(/Confirmar nueva contraseña:/i), { target: { value: 'password1' } });
        fireEvent.click(screen.getByRole('button', { name: /restablecer contraseña/i }));

        expect(await screen.findByText(/El token es inválido o ha expirado/i)).toBeInTheDocument();
    });
});