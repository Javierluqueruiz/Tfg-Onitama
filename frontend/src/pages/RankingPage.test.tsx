import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { RankingEntry, RankingResponse } from '../../../shared';
import { RankingPage } from './RankingPage';
import { RankingApi } from '../services/rankingApi';
import { useAuth } from '../contexts/AuthContext';

vi.mock('../services/rankingApi');
vi.mock('../contexts/AuthContext');

function mockUseAuth(isAuthenticated: boolean) {
    vi.mocked(useAuth).mockReturnValue({
        user: null, isAuthenticated, isLoading: false,
        login: vi.fn(), logout: vi.fn(), register: vi.fn(), updateUser: vi.fn()
    });
}

const ana: RankingEntry = { position: 1, username: 'Ana', elo: 1300, gamesPlayed: 10, wins: 7, losses: 3, draws: 0 };

const ranking = (overrides: Partial<RankingResponse> = {}): RankingResponse => ({
    entries: [ana], me: null, minGames: 5, ...overrides
});

const renderPage = () => render(<MemoryRouter><RankingPage /></MemoryRouter>);

describe('RankingPage', () => {
    beforeEach(() => {
        vi.mocked(RankingApi.getRanking).mockReset();
        mockUseAuth(false);
    });

    it('muestra un aviso de carga mientras se obtiene el ranking', () => {
        vi.mocked(RankingApi.getRanking).mockReturnValue(new Promise(() => {}));

        renderPage();

        expect(screen.getByRole('status')).toHaveTextContent(/cargando/i);
    });

    it('muestra la tabla con los jugadores' , async () => {
        vi.mocked(RankingApi.getRanking).mockResolvedValue(ranking());

        renderPage();

        expect(await screen.findByRole('row', { name: /ana/i })).toBeInTheDocument();
    });

    it('si falla, muestra un mensaje de error y permite reintentar', async () => {
        vi.mocked(RankingApi.getRanking).mockRejectedValueOnce(new Error('Error de red. No se pudo conectar con el servidor.'))
            .mockResolvedValueOnce(ranking());
        renderPage();
        expect(await screen.findByRole('alert')).toHaveTextContent(/error de red/i);

        fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));

        expect(await screen.findByRole('row', { name: /ana/i })).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('si nadie cumple el mínimo, lo explica en lugar de mostrar una tabla vacía', async () => {
        vi.mocked(RankingApi.getRanking).mockResolvedValue(ranking({ entries: [] }));

        renderPage();

        expect(await screen.findByText(/nadie ha jugado lo suficiente/i)).toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('si el usuario no está autenticado, lo invita a iniciar sesión', async () => {
        vi.mocked(RankingApi.getRanking).mockResolvedValue(ranking());

        renderPage();

        expect(await screen.findByText(/al menos 5 partidas/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /inicia sesión/i })).toHaveAttribute('href', '/login');
    });

    it('si el jugador no aparece, le dice cuántas partidas le faltan para aparecer', async () => {
        mockUseAuth(true);
        vi.mocked(RankingApi.getRanking).mockResolvedValue(ranking());

        renderPage();

        expect(await screen.findByText(/necesitas al menos 5 partidas/i)).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /inicia sesión/i })).not.toBeInTheDocument();
    });

    it('no muestra ninguna nota si el jugador que consulta aparece en la tabla', async () => {
        vi.mocked(RankingApi.getRanking).mockResolvedValue(ranking({ me: ana }));

        renderPage();

        await screen.findByRole('row', { name: /ana/i });
        expect(screen.queryByText(/al menos 5 partidas/i)).not.toBeInTheDocument();
    });
});