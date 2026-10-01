import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateRoom } from './CreateRoom';
import { JoinRoom } from './JoinRoom';
import { WaitingRoom } from './WaitingRoom';

describe('CreateRoom', () => {
    const renderCreate = (accountName?: string) => {
        const props = { onCreateRoom: vi.fn(), onBack: vi.fn(), setPlayerName: vi.fn() };
        render(<CreateRoom playerName="" accountName={accountName} {...props} />);
        return props;
    };

    it('crea la sala en modo normal si no se elige otro', () => {
        const { onCreateRoom } = renderCreate();

        fireEvent.click(screen.getByRole('button', { name: 'Crear sala' }));

        expect(onCreateRoom).toHaveBeenCalledWith('normal');
    });

    it('crea la sala con el modo que se elija', () => {
        const { onCreateRoom } = renderCreate();

        fireEvent.click(screen.getByRole('radio', { name: /Rápido/ }));
        expect(screen.getByRole('radio', { name: /Rápido/ })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('radio', { name: /Normal/ })).toHaveAttribute('aria-checked', 'false');
        fireEvent.click(screen.getByRole('button', { name: 'Crear sala' }));

        expect(onCreateRoom).toHaveBeenCalledWith('fast');
    });

    it('pide el nombre a los invitados y no a los usuarios con cuenta', () => {
        renderCreate();
        expect(screen.getByPlaceholderText('Ej. Maestro Nuby')).toBeInTheDocument();
    });

    it('no pide el nombre si hay una cuenta', () => {
        renderCreate('testuser');
        expect(screen.queryByPlaceholderText('Ej. Maestro Nuby')).not.toBeInTheDocument();
    });

    it('vuelve atrás', () => {
        const { onBack } = renderCreate();
        fireEvent.click(screen.getByRole('button', { name: /Volver/ }));
        expect(onBack).toHaveBeenCalledTimes(1);
    });
});

describe('JoinRoom', () => {
    const renderJoin = (joinCode = '') => {
        const props = { onJoinRoom: vi.fn(), onBack: vi.fn(), setPlayerName: vi.fn(), setJoinCode: vi.fn() };
        render(<JoinRoom playerName="" joinCode={joinCode} {...props} />);
        return props;
    };

    it('comunica el código escrito, limitado a 5 caracteres', () => {
        const { setJoinCode } = renderJoin();
        const input = screen.getByPlaceholderText('ABC12');

        expect(input).toHaveAttribute('maxlength', '5');
        fireEvent.change(input, { target: { value: 'XY123' } });

        expect(setJoinCode).toHaveBeenCalledWith('XY123');
    });

    it('se une a la sala al enviar el formulario', () => {
        const { onJoinRoom } = renderJoin('XY123');

        fireEvent.click(screen.getByRole('button', { name: 'Unirse a la sala' }));

        expect(onJoinRoom).toHaveBeenCalledTimes(1);
    });

    it('vuelve atrás', () => {
        const { onBack } = renderJoin();
        fireEvent.click(screen.getByRole('button', { name: /Volver/ }));
        expect(onBack).toHaveBeenCalledTimes(1);
    });
});

describe('WaitingRoom', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('muestra el código de la sala y avisa de que se espera al rival', () => {
        render(<WaitingRoom roomCode="AB12C" onCancel={vi.fn()} />);

        expect(screen.getByLabelText('Código de la sala: A B 1 2 C')).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent('Esperando a que tu rival se una');
    });

    it('copia el código al portapapeles y lo confirma', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
        render(<WaitingRoom roomCode="AB12C" onCancel={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Copiar código' }));

        expect(writeText).toHaveBeenCalledWith('AB12C');
        await waitFor(() => expect(screen.getByRole('button', { name: '¡Copiado!' })).toBeInTheDocument());
    });

    it('cancela y sale', () => {
        const onCancel = vi.fn();
        render(<WaitingRoom roomCode="AB12C" onCancel={onCancel} />);

        fireEvent.click(screen.getByRole('button', { name: 'Cancelar y salir' }));

        expect(onCancel).toHaveBeenCalledTimes(1);
    });
});
