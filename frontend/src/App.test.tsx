import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SocketEvents, type ChatMessage } from '../../shared';
import { createMockSocket } from './test-utils/mockSocket';
import { buildReconnectPayload } from './test-utils/gameFixtures';
import { useSocket } from './contexts/SocketContext';
import { useAuth } from './contexts/AuthContext';
import { App } from './App';

vi.mock('./contexts/SocketContext');
vi.mock('./contexts/AuthContext');

// Prueba de integración de la Sub-05.2 (reconexión) en el cliente: monta App completo y comprueba
// lo que ve el jugador tras recargar la página. Las pruebas de cada hook por separado no pueden
// detectar este fallo, porque lo provoca el orden entre el evento RECONNECT_SUCCESS y el montaje de
// la pantalla de partida: el evento es el que hace que la pantalla se monte, así que sus hooks
// llegan siempre después de que haya pasado.
describe('App: restauración de la sesión tras recargar la página', () => {
    let socket: ReturnType<typeof createMockSocket>;

    const reconnect = (payload: ReturnType<typeof buildReconnectPayload>) => {
        act(() => socket.trigger(SocketEvents.RECONNECT_SUCCESS, payload));
    };

    const renderApp = () => render(<MemoryRouter><App /></MemoryRouter>);

    beforeEach(() => {
        localStorage.clear();
        socket = createMockSocket();
        vi.mocked(useSocket).mockReturnValue({ socket, isConnected: true, lastError: null, setLastError: vi.fn() } as unknown as ReturnType<typeof useSocket>);
        vi.mocked(useAuth).mockReturnValue({
            user: null, isAuthenticated: false, isLoading: false,
            login: vi.fn(), register: vi.fn(), logout: vi.fn(), updateUser: vi.fn(),
        });
    });

    it('sin reconexión se muestra el lobby', () => {
        renderApp();

        expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument();
    });

    it('el chat de la partida muestra el historial que envió el servidor, con cada mensaje en su lado', () => {
        const history: ChatMessage[] = [
            { socketId: 'rival-socket', name: 'Rival', message: 'suerte', timestamp: 1000 },
            { socketId: 'mock-socket-id', name: 'Yo', message: 'gracias', timestamp: 2000 },
        ];
        renderApp();

        reconnect(buildReconnectPayload({ chatHistory: history }));

        expect(screen.getByText('suerte')).toBeInTheDocument();
        expect(screen.getByText('gracias')).toBeInTheDocument();
        // El mensaje propio se identifica como "Tú"; el del rival, con su nombre.
        expect(screen.getByText('Tú')).toBeInTheDocument();
        expect(screen.getByText('Rival')).toBeInTheDocument();
    });

    it('restaura la oferta de empate que el rival hizo antes de recargar', () => {
        renderApp();

        reconnect(buildReconnectPayload({ drawOffered: true }));

        expect(screen.getByText(/te propone tablas/i)).toBeInTheDocument();
    });

    it('no muestra ninguna oferta ni mensajes si el servidor no tenía nada pendiente', () => {
        renderApp();

        reconnect(buildReconnectPayload());

        expect(screen.getByText('Aún no hay mensajes')).toBeInTheDocument();
        expect(screen.queryByText(/te propone tablas/i)).not.toBeInTheDocument();
    });
});
