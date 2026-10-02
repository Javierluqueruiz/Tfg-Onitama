import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SocketEvents, type ChatMessage } from '../../../../../../shared';
import { createMockSocket } from '../../../../test-utils/mockSocket';
import { useSocket } from '../../../../contexts/SocketContext';
import { ChatBox } from './ChatBox';

vi.mock('../../../../contexts/SocketContext');

const fromMe = (text: string): ChatMessage => ({ socketId: 'mock-socket-id', name: 'Yo', message: text, timestamp: 1000 });
const fromRival = (text: string): ChatMessage => ({ socketId: 'rival-id', name: 'Rival', message: text, timestamp: 2000 });

describe('ChatBox', () => {
    let socket: ReturnType<typeof createMockSocket>;

    beforeEach(() => {
        socket = createMockSocket();
        vi.mocked(useSocket).mockReturnValue({ socket, isConnected: true, lastError: null } as unknown as ReturnType<typeof useSocket>);
    });

    const receive = (message: ChatMessage) => act(() => socket.trigger(SocketEvents.CHAT_UPDATE, message));

    it('muestra un estado vacío mientras no hay mensajes', () => {
        render(<ChatBox localColor="blue" />);

        expect(screen.getByText('Aún no hay mensajes')).toBeInTheDocument();
    });

    it('distingue los mensajes propios ("Tú") de los del rival (su nombre)', () => {
        render(<ChatBox localColor="blue" />);

        receive(fromMe('hola'));
        receive(fromRival('buenas'));

        expect(screen.getByText('Tú')).toBeInTheDocument();
        expect(screen.getByText('Rival')).toBeInTheDocument();
        expect(screen.getByText('hola')).toBeInTheDocument();
        expect(screen.getByText('buenas')).toBeInTheDocument();
    });

    it('oculta los mensajes del rival al silenciarlo, pero no los propios', () => {
        render(<ChatBox localColor="red" />);
        receive(fromMe('hola'));
        receive(fromRival('buenas'));

        fireEvent.click(screen.getByRole('button', { name: 'Silenciar al rival' }));

        expect(screen.getByText('hola')).toBeInTheDocument();
        expect(screen.queryByText('buenas')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Dejar de silenciar al rival' }));
        expect(screen.getByText('buenas')).toBeInTheDocument();
    });

    it('deshabilita el envío con el campo vacío', () => {
        render(<ChatBox localColor="blue" />);

        expect(screen.getByRole('button', { name: 'Enviar mensaje' })).toBeDisabled();
    });

    it('envía el mensaje y vacía el campo', () => {
        render(<ChatBox localColor="blue" />);
        const input = screen.getByLabelText('Mensaje');

        fireEvent.change(input, { target: { value: 'buena suerte' } });
        fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

        expect(socket.emit).toHaveBeenCalledWith(SocketEvents.SEND_MESSAGE, { message: 'buena suerte' });
        expect(input).toHaveValue('');
    });

    it('conserva los mensajes al recibir el historial tras reconectar', () => {
        render(<ChatBox localColor="blue" />);

        act(() => socket.trigger(SocketEvents.RECONNECT_SUCCESS, { chatHistory: [fromRival('uno'), fromRival('dos')] }));

        expect(screen.getByText('uno')).toBeInTheDocument();
        expect(screen.getByText('dos')).toBeInTheDocument();
    });
});
