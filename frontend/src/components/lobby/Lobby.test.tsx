import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import { SocketEvents } from '../../../../shared';
import { createMockSocket } from '../../test-utils/mockSocket';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { Lobby } from './Lobby';

vi.mock('../../contexts/SocketContext');
vi.mock('../../contexts/AuthContext');

describe('Lobby: enlaces de la cabecera', () => {
    let socket: ReturnType<typeof createMockSocket>;

    beforeEach(() => {
        socket = createMockSocket();
        vi.mocked(useSocket).mockReturnValue({
            socket: socket as unknown as Socket, isConnected: true, lastError: null, setLastError: vi.fn(),
        });
        vi.mocked(useAuth).mockReturnValue({
            user: null, isAuthenticated: false, isLoading: false,
            login: vi.fn(), logout: vi.fn(), register: vi.fn(), updateUser: vi.fn(),
        });
    });

    const renderLobby = () => render(<MemoryRouter><Lobby /></MemoryRouter>);

    it('muestra los enlaces a las reglas y a la clasificación en el menú principal', () => {
        renderLobby();

        expect(screen.getByRole('link', { name: /reglas/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /clasificación/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /iniciar sesión/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /registrarse/i })).toBeInTheDocument();
    });

    it('los oculta en la sala de espera, para no dejar una sala privada abierta sin nadie mirándola', () => {
        renderLobby();

        act(() => socket.trigger(SocketEvents.ROOM_CREATED, { roomCode: 'ABCDE' }));

        expect(screen.queryByRole('link', { name: /reglas/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /clasificación/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /iniciar sesión/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /registrarse/i })).not.toBeInTheDocument();
    });

    // Evita la sala fantasma: sin LEAVE_ROOM la sala sigue viva y un amigo con el código arrastra al anfitrión a una partida cancelada.
    it('"Cancelar y salir" de la sala de espera cierra la sala en el servidor y vuelve al menú', () => {
        renderLobby();
        act(() => socket.trigger(SocketEvents.ROOM_CREATED, { roomCode: 'ABCDE' }));

        fireEvent.click(screen.getByRole('button', { name: /cancelar y salir/i }));

        expect(socket.emit).toHaveBeenCalledWith(SocketEvents.LEAVE_ROOM);
        expect(screen.queryByText(/esperando a que tu rival/i)).not.toBeInTheDocument();
    });
    
    it('el aviso de correo sin verificar sale fuera de la cabecera, para que esta no crezca en móvil', () => {
        vi.mocked(useAuth).mockReturnValue({
            user: { id: '1', username: 'ana', emailVerified: false }, isAuthenticated: true, isLoading: false,
            login: vi.fn(), logout: vi.fn(), register: vi.fn(), updateUser: vi.fn(),
        });

        const { container } = renderLobby();

        expect(screen.getByText(/tu correo no está verificado/i)).toBeInTheDocument();
        expect(container.querySelector('header')).not.toHaveTextContent(/verificad/i);
    });
});