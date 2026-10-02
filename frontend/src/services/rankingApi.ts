import type { RankingResponse } from '../../../shared';
import { getJson } from './httpClient';

export const RankingApi = {
    getRanking(): Promise<RankingResponse> {
        return getJson('/api/ranking');
    },
};