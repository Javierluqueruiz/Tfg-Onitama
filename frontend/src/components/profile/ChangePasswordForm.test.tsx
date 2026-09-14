import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChangePasswordForm } from './ChangePasswordForm';
import { ProfileApi } from '../../services/profileApi';

vi.mock('../../services/profileApi');

describe('ChangePasswordForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('muestra un error si las contraseñas no coinciden', async () => {
        render(<ChangePasswordForm />);

        fireEvent.change(screen.getByLabelText(/Contraseña actual/i), { target: { value: 'oldpass' } });
        fireEvent.change(screen.getByLabelText(/Nueva contraseña/i), { target: { value: 'newpass' } });
        fireEvent.change(screen.getByLabelText(/Confirmar contraseña/i), { target: { value: 'differentpass' } });
        fireEvent.click(screen.getByRole('button', { name: /Actualizar contraseña/i }));

        expect(await screen.findByText(/Las contraseñas no coinciden/i)).toBeInTheDocument();
        expect(ProfileApi.changePassword).not.toHaveBeenCalled();
    });

    it('llama a changePassword y muestra el mensaje de éxito si las contraseñas coinciden', async () => {
        vi.mocked(ProfileApi.changePassword).mockResolvedValue({ message: 'Ok' });

        render(<ChangePasswordForm />);

        fireEvent.change(screen.getByLabelText(/Contraseña actual/i), { target: { value: 'oldpass' } });
        fireEvent.change(screen.getByLabelText(/Nueva contraseña/i), { target: { value: 'newpass' } });
        fireEvent.change(screen.getByLabelText(/Confirmar contraseña/i), { target: { value: 'newpass' } });
        fireEvent.click(screen.getByRole('button', { name: /Actualizar contraseña/i }));

        expect(ProfileApi.changePassword).toHaveBeenCalledWith({
            currentPassword: 'oldpass',
            newPassword: 'newpass',
        });
        expect(await screen.findByText(/Contraseña actualizada con éxito/i)).toBeInTheDocument();
    });

    it('muestra un error si changePassword falla', async () => {
        vi.mocked(ProfileApi.changePassword).mockRejectedValue(new Error('La contraseña actual no es correcta'));

        render(<ChangePasswordForm />);

        fireEvent.change(screen.getByLabelText(/Contraseña actual/i), { target: { value: 'oldpass' } });
        fireEvent.change(screen.getByLabelText(/Nueva contraseña/i), { target: { value: 'newpass' } });
        fireEvent.change(screen.getByLabelText(/Confirmar contraseña/i), { target: { value: 'newpass' } });
        fireEvent.click(screen.getByRole('button', { name: /Actualizar contraseña/i }));

        expect(ProfileApi.changePassword).toHaveBeenCalledWith({
            currentPassword: 'oldpass',
            newPassword: 'newpass',
        });
        expect(await screen.findByText(/La contraseña actual no es correcta/i)).toBeInTheDocument();
    });
});