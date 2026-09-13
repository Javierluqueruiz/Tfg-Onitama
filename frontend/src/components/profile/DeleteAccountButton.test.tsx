import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteAccountButton } from './DeleteAccountButton';
import { ProfileApi } from '../../services/profileApi';

vi.mock('../../services/profileApi');

describe('DeleteAccountButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(window, 'location', {
            writable: true,
            value: { href: '' },
        });
    });

    it('no muestra el formulario de confirmación hasta que se haga clic en el botón', () => {
        render(<DeleteAccountButton />);

        expect(screen.queryByLabelText(/Usuario:/i)).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Eliminar cuenta/i })).toBeInTheDocument();
    });

    it('muestra el formulario de confirmación al hacer clic en el botón', () => {
        render(<DeleteAccountButton />);

        fireEvent.click(screen.getByRole('button', { name: /Eliminar cuenta/i }));

        expect(screen.getByLabelText(/Usuario:/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Contraseña:/i)).toBeInTheDocument();
    });

    it('cancelar oculta el formulario de confirmación', () => {
        render(<DeleteAccountButton />);

        fireEvent.click(screen.getByRole('button', { name: /Eliminar cuenta/i }));
        fireEvent.click(screen.getByLabelText(/Usuario:/i), { target: { value: 'testuser' } });
        fireEvent.click(screen.getByLabelText(/Contraseña:/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

        expect(screen.queryByLabelText(/Usuario:/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/Contraseña:/i)).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Eliminar cuenta/i })).toBeInTheDocument();
    });

    it('llama a deleteAccount y redirige al lobby si la eliminación es exitosa', async () => {
        vi.mocked(ProfileApi.deleteAccount).mockResolvedValue({ message: 'ok' });

        render(<DeleteAccountButton />);

        fireEvent.click(screen.getByRole('button', { name: /Eliminar cuenta/i }));
        fireEvent.change(screen.getByLabelText(/Usuario:/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/Contraseña:/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /Confirmar eliminación/i }));

        await waitFor(() => expect(window.location.href).toBe('/'));
        expect(ProfileApi.deleteAccount).toHaveBeenCalledWith({ username: 'testuser', password: 'password123' });
    });

    it('muestra un mensaje de error si deleteAccount falla', async () => {
        vi.mocked(ProfileApi.deleteAccount).mockRejectedValue(new Error('Error al eliminar la cuenta'));

        render(<DeleteAccountButton />);
        
        fireEvent.click(screen.getByRole('button', { name: /Eliminar cuenta/i }));
        fireEvent.change(screen.getByLabelText(/Usuario:/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/Contraseña:/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /Confirmar eliminación/i }));

        expect(await screen.findByText(/Error al eliminar la cuenta/i)).toBeInTheDocument();
        expect(window.location.href).toBe('');
    });
});