import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RankingApi } from './rankingApi';
import { jsonResponse } from '../test-utils/mockResponse';

describe('RankingApi', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('getRanking envía las credenciales para que el servidor identifique la fila de quien consulta', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse({ entries: [], me: null, minGames: 5 }));

        await RankingApi.getRanking();

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/ranking'),
            expect.objectContaining({ credentials: 'include' })
        );
    });

    it('getRanking devuelve la respuesta del servidor', async () => {
        const ranking = {
            entries: [
                { username: 'player1', wins: 10, losses: 5 },
                { username: 'player2', wins: 8, losses: 7 }],
            me: null,
            minGames: 5
        };

        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse(ranking));

        expect(await RankingApi.getRanking()).toEqual(ranking);
    });
});