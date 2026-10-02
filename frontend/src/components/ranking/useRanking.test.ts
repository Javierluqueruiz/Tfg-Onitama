import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { RankingResponse } from '../../../../shared';
import { RankingApi } from '../../services/rankingApi';
import { useRanking } from './useRanking';

vi.mock('../../services/rankingApi');

const ranking = (username:string): RankingResponse => ({
    entries: [{ position: 1, username, elo: 1000, gamesPlayed: 10, wins: 5, losses: 3, draws: 2 }],
    me: null, 
    minGames: 5
});

describe('useRanking', () => {
    beforeEach(() => {
        vi.mocked(RankingApi.getRanking).mockReset();
    });

    it('empieza con el estado de carga', () => {
        vi.mocked(RankingApi.getRanking).mockReturnValue(new Promise(() => {}));

        const { result } = renderHook(() => useRanking());

        expect(result.current.state).toEqual({ status: 'loading' });
    });

    it('pasa al estado ready cuando la petición se resuelve', async () => {
        vi.mocked(RankingApi.getRanking).mockResolvedValue(ranking('Ana'));

        const { result } = renderHook(() => useRanking());

        await waitFor(() => expect(result.current.state).toEqual({ status: 'ready', ranking: ranking('Ana') }));
    });

    it('pasa al estado error cuando la petición falla', async () => {
        vi.mocked(RankingApi.getRanking).mockRejectedValue(new Error('Error de red. No se pudo conectar con el servidor.'));
        
        const { result } = renderHook(() => useRanking());

        await waitFor(() => expect(result.current.state).toEqual({
            status: 'error', message: 'Error de red. No se pudo conectar con el servidor.'
        }));
    });

    it('reload vuelve a pedir el ranking y actualiza el estado', async () => {
        vi.mocked(RankingApi.getRanking)
            .mockRejectedValueOnce(new Error('fallo'))
            .mockResolvedValueOnce(ranking('Ana'));
        const { result } = renderHook(() => useRanking());
        await waitFor(() => expect(result.current.state.status).toBe('error'));

        act(() => result.current.reload());

        expect(result.current.state).toEqual({ status: 'loading' });
        await waitFor(() => expect(result.current.state).toEqual({ status: 'ready', ranking: ranking('Ana') }))
        expect(RankingApi.getRanking).toHaveBeenCalledTimes(2);
    });

    it('una respuesta lenta de un intento anterior no sobrescribe el estado de un intento posterior', async () => {
        let resolveFirst!: (value: RankingResponse) => void;
        vi.mocked(RankingApi.getRanking)
            .mockReturnValueOnce(new Promise<RankingResponse>(resolve => { resolveFirst = resolve; }))      
            .mockResolvedValueOnce(ranking('segunda'));
        const { result } = renderHook(() => useRanking());

        act(() => result.current.reload());
        await waitFor(() => expect(result.current.state).toEqual({ status: 'ready', ranking: ranking('segunda') }));
        await act(async () => resolveFirst(ranking('primera')));

        expect(result.current.state).toEqual({ status: 'ready', ranking: ranking('segunda') });
    });
});