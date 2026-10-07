import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { Socket } from 'socket.io-client';
import { SocketEvents } from '../../../../../shared';
import { createMockSocket } from '../../../test-utils/mockSocket';
import { useSocket } from '../../../contexts/SocketContext';
import { MatchmakingRoom } from './MatchmakingRoom';

vi.mock('../../../contexts/SocketContext');

describe('MatchmakingRoom', () => {
    let socket: ReturnType<typeof createMockSocket>;

    beforeEach(() => {
        socket = createMockSocket();
        vi.mocked(useSocket).mockReturnValue({
            socket: socket as unknown as Socket, isConnected: true, lastError: null, setLastError: vi.fn(),
        });
    });

    const renderRoom = (onCancel = vi.fn()) =>
        render(<MatchmakingRoom mode="casual" onCancel={onCancel} onMatchFound={vi.fn()} />);

    it('entra en la cola del modo elegido al montarse', () => {
        renderRoom();

        expect(socket.emit).toHaveBeenCalledWith(SocketEvents.JOIN_QUEUE, { mode: 'casual' });
    });

    // Evita quedarse en "Buscando rival…" para siempre tras una caída de la conexión.
    it('vuelve a entrar en la cola si la conexión se cae y se recupera', () => {
        renderRoom();
        socket.emit.mockClear();

        act(() => socket.trigger('connect'));

        expect(socket.emit).toHaveBeenCalledWith(SocketEvents.JOIN_QUEUE, { mode: 'casual' });
    });

    it('al cancelar sale de la cola y avisa al lobby', () => {
        const onCancel = vi.fn();
        renderRoom(onCancel);

        fireEvent.click(screen.getByRole('button', { name: /cancelar búsqueda/i }));

        expect(socket.emit).toHaveBeenCalledWith(SocketEvents.LEAVE_QUEUE);
        expect(onCancel).toHaveBeenCalledTimes(1);
    });
});