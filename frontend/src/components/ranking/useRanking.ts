import { useCallback, useEffect, useState } from 'react';
import type { RankingResponse } from '../../../../shared';
import { RankingApi } from '../../services/rankingApi';

export type RankingState =
    | { status: 'loading' }
    | { status: 'ready', ranking: RankingResponse }
    | { status: 'error', message: string };

export function useRanking() {
    const [state, setState] = useState<RankingState>({ status: 'loading' });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let cancelled = false;

        RankingApi.getRanking()
            .then((ranking) => {
                if (!cancelled) setState({ status: 'ready', ranking });
            })
            .catch((error) => {
                if (!cancelled) setState({ status: 'error', message: error instanceof Error ? error.message : 'Error desconocido' });
            });
        return () => { cancelled = true; };
    }, [attempt]);

    const reload = useCallback(() => {
        setState({ status: 'loading' });
        setAttempt((previous) => previous + 1);
    }, []);

    return { state, reload };
}