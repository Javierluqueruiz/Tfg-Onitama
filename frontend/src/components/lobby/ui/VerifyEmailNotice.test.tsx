import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { VerifyEmailNotice } from './VerifyEmailNotice';
import { AuthApi } from '../../../services/authApi';
import { useAuth } from '../../../contexts/AuthContext';

vi.mock('../../../services/authApi');
vi.mock('../../../contexts/AuthContext');

function mockUseAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
    vi.mocked(useAuth).mockReturnValue({
        user: null, isAuthenticated: false, isLoading: false,
        login: vi.fn(), register: vi.fn(), logout: vi.fn(), updateUser: vi.fn(), ...overrides,
    });
}

const unverified = { isAuthenticated: true, user: { id: '123', username: 'testuser', emailVerified: false } };

describe('VerifyEmailNotice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('no muestra nada mientras se restaura la sesión', () => {
        mockUseAuth({ isLoading: true });
        const { container } = render(<VerifyEmailNotice />);
        expect(container).toBeEmptyDOMElement();
    });

    it('no muestra nada si el usuario es un invitado', () => {
        mockUseAuth();
        const { container } = render(<VerifyEmailNotice />);
        expect(container).toBeEmptyDOMElement();
    });

    it('no muestra nada si el usuario ya ha verificado su correo', () => {
        mockUseAuth({ isAuthenticated: true, user: { id: '123', username: 'testuser', emailVerified: true } });
        const { container } = render(<VerifyEmailNotice />);
        expect(container).toBeEmptyDOMElement();
    });

    it('avisa de que el correo no está verificado y permite reenviar el correo de verificación', async () => {
        mockUseAuth(unverified);
        render(<VerifyEmailNotice />);

        expect(screen.getByText(/tu correo no está verificado/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /reenviar correo de verificación/i })).toBeInTheDocument();
    });

    it('reenvía el correo y muestra la confirmación', async () => {
        vi.mocked(AuthApi.resendVerificationEmail).mockResolvedValue({ message: 'ok'});
        mockUseAuth(unverified);
        render(<VerifyEmailNotice />);

        fireEvent.click(screen.getByRole('button', { name: /reenviar correo de verificación/i }));

        expect(await screen.findByText('Correo de verificación reenviado')).toBeInTheDocument();
        expect(AuthApi.resendVerificationEmail).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('mientras reenvía, deshabilita el botón', async () => {
        let finish!: (value: { message: string }) => void;
        vi.mocked(AuthApi.resendVerificationEmail).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
        mockUseAuth(unverified);
        render(<VerifyEmailNotice />);

        fireEvent.click(screen.getByRole('button', { name: /reenviar correo de verificación/i }));

        expect(screen.getByRole('button', { name: 'Reenviando...'})).toBeDisabled();
        await act(async () => { finish({ message: 'ok' }); });
        expect(screen.getByText('Correo de verificación reenviado')).toBeInTheDocument();
    });

    it('si el envío falla, vuelve a ofrecer el botón', async () => {
        vi.mocked(AuthApi.resendVerificationEmail).mockRejectedValue(new Error('Error de red'));
        mockUseAuth(unverified);
        render(<VerifyEmailNotice />);

        fireEvent.click(screen.getByRole('button', { name: /reenviar correo de verificación/i }));

        expect(await screen.findByRole('button', { name: /reenviar correo de verificación/i })).toBeInTheDocument();
    });
});