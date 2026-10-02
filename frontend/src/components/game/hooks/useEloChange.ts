import { useState } from 'react';
import type { Socket } from 'socket.io-client';
import { SocketEvents, type EloUpdate } from '../../../../../shared';
import { useSocketEvent } from '../../../hooks/useSocketEvent';

export function useEloChange(socket: Socket | null): EloUpdate | null {
    const [update, setUpdate] = useState<EloUpdate | null>(null);

    useSocketEvent<EloUpdate>(socket, SocketEvents.ELO_UPDATED, setUpdate);

    useSocketEvent(socket, SocketEvents.GAME_START, () => setUpdate(null));

    return update;
}