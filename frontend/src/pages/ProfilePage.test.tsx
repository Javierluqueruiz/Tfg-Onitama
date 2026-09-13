import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProfilePage } from './ProfilePage';
import { ProfileApi } from '../services/profileApi';
import { useAuth } from '../contexts/AuthContext';
import type { ProfileStats } from '../../../shared';

vi.mock('../services/profileApi');
vi.mock('../contexts/AuthContext');

function mockUseAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
    vi.mocked(useAuth).mockReturnValue({
        user: null, isAuthenticated: false, isLoading: false, 
        login: vi.fn(), register: vi.fn(), logout: vi.fn(), updateUser: vi.fn(), ...overrides
    });
}

function renderWithRoutes() {
    return render(
        <MemoryRouter initialEntries={['/profile']}>
            <Routes>
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/login" element={<div>Página de inicio de sesión</div>} />
            </Routes>
        </MemoryRouter>
    );
}

const baseStats: ProfileStats = {
    id: '1',
    username: 'testuser',
    emailVerified: true,
    elo: 1120,
    gamesPlayed: 10,
    wins: 6,
    losses: 3,
    draws: 1,
    lastMatches: [
        { opponentName: 'opponent1', result: 'win', eloChange: 18, date: '2026-01-01T00:00:00.000Z' },
    ],
};

describe('ProfilePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('redirige a loggin si no hay usuario autenticado', async () => {
        mockUseAuth({ isAuthenticated: false, isLoading: false });
        renderWithRoutes();

        expect(await screen.findByText('Página de inicio de sesión')).toBeInTheDocument();
        expect(ProfileApi.getStats).not.toHaveBeenCalled();
    });

    it('no muestra nada mientras se está cargando la autenticación', () => {
        mockUseAuth({ isAuthenticated: false, isLoading: true });
        const { container } = renderWithRoutes();
        expect(container).toBeEmptyDOMElement();
    });

    it('muestra las estadísticas, el rango y las últimas partidas del usuario autenticado', async () => {
        mockUseAuth({ isAuthenticated: true });
        vi.mocked(ProfileApi.getStats).mockResolvedValue(baseStats);

        renderWithRoutes();

        expect(await screen.findByText('testuser')).toBeInTheDocument();
        expect(screen.getByText(/Oro/)).toBeInTheDocument();
        expect(screen.getByText('1120 ELO', { exact: false })).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('6')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('vs opponent1')).toBeInTheDocument();
        expect(screen.getByText('+18')).toBeInTheDocument();
    });

    it('muestra un mensaje si todavía no ha jugado ninguna partida', async () => {
        mockUseAuth({ isAuthenticated: true });
        vi.mocked(ProfileApi.getStats).mockResolvedValue({ ...baseStats, lastMatches: [] });

        renderWithRoutes();

        expect(await screen.findByText('Todavía no has jugado ninguna partida.')).toBeInTheDocument();
    });

    it('muestra un mensaje de error si falla la carga de estadísticas', async () => {
        mockUseAuth({ isAuthenticated: true });
        vi.mocked(ProfileApi.getStats).mockRejectedValue(new Error('Error de red. No se pudo conectar con el servidor.'));

        renderWithRoutes();

        expect(await screen.findByText(/Error de red. No se pudo conectar con el servidor./)).toBeInTheDocument();
    });
});