import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { AuthApi } from '../services/authApi';

vi.mock('../services/authApi');

describe('ForgotPasswordPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('llama a forgortPassword con el correo introducido', async () => {
        vi.mocked(AuthApi.forgotPassword).mockResolvedValueOnce({message: 'ok'});

        render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);

        fireEvent.change(screen.getByLabelText(/correo electrónico:/i), { target: { value: 'user@example.com' } });
        fireEvent.click(screen.getByRole('button', { name: /enviar instrucciones/i }));

        await waitFor(() => expect(AuthApi.forgotPassword).toHaveBeenCalledWith({ email: 'user@example.com' }));
    });

    it('muestra mensaje de éxito después de enviar el formulario, exista o no la cuenta', async () => {
        vi.mocked(AuthApi.forgotPassword).mockResolvedValueOnce({message: 'ok'});

        render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
        fireEvent.change(screen.getByLabelText(/correo electrónico:/i), { target: { value: 'user@example.com' } });
        fireEvent.click(screen.getByRole('button', { name: /enviar instrucciones/i }));

        expect(await screen.findByText(/instrucciones enviadas/i)).toBeInTheDocument();
    });

    it('muestra mensaje de error si la llamada a la API falla', async () => {
        vi.mocked(AuthApi.forgotPassword).mockRejectedValueOnce(new Error('Error de prueba'));

        render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
        fireEvent.change(screen.getByLabelText(/correo electrónico:/i), { target: { value: 'user@example.com' } });
        fireEvent.click(screen.getByRole('button', { name: /enviar instrucciones/i }));

        expect(await screen.findByText(/Error de prueba/i)).toBeInTheDocument();
    });
});