import { describe, it, expect } from 'vitest';
import type { Server } from 'socket.io';
import { SocketEvents, type RoomSession } from '../../../shared';
import type { MatchEloUpdates } from '../../src/network/GameResultService';
import { notifyEloUpdates } from '../../src/network/eloNotifier';

//Sub-11.3
describe('notifyEloUpdates', () => {
    const ranked: MatchEloUpdates = {
        red: { ranked: true, eloChange: 16, newElo: 1016 },
        blue: { ranked: true, eloChange: -16, newElo: 984 },
    };

    // io falso que anota a quién se envía qué, en orden.
    const fakeIo = () => {
        const sent: { to: string; event: string; payload: unknown }[] = [];
        const io = {
            to: (to: string) => ({ emit: (event: string, payload: unknown) => { sent.push({ to, event, payload }); } }),
        } as unknown as Server;
        return { io, sent };
    };

    const roomWith = (players: Partial<RoomSession['players']>) =>
        ({ players: { red: null, blue: null, ...players } }) as RoomSession;

    it('envía a cada jugador su propia variación, a su propio socket', () => {
        const { io, sent } = fakeIo();

        notifyEloUpdates(io, roomWith({
            red: { socketId: 'red-socket', name: 'Rojo' },
            blue: { socketId: 'blue-socket', name: 'Azul' },
        }), ranked);

        expect(sent).toEqual([
            { to: 'red-socket', event: SocketEvents.ELO_UPDATED, payload: ranked.red },
            { to: 'blue-socket', event: SocketEvents.ELO_UPDATED, payload: ranked.blue },
        ]);
    });

    it('no envía nada a la IA', () => {
        const { io, sent } = fakeIo();

        notifyEloUpdates(io, roomWith({
            red: { socketId: 'red-socket', name: 'Humano' },
            blue: { socketId: 'ai-socket', name: 'IA', isAi: true },
        }), ranked);

        expect(sent.map((s) => s.to)).toEqual(['red-socket']);
    });

    it('ignora un asiento vacío', () => {
        const { io, sent } = fakeIo();

        notifyEloUpdates(io, roomWith({ blue: { socketId: 'blue-socket', name: 'Azul' } }), ranked);

        expect(sent.map((s) => s.to)).toEqual(['blue-socket']);
    });

    it('también comunica las partidas que no puntúan, para que el cliente no tenga que deducirlo', () => {
        const { io, sent } = fakeIo();
        const unranked: MatchEloUpdates = { red: { ranked: false }, blue: { ranked: false } };

        notifyEloUpdates(io, roomWith({
            red: { socketId: 'cuenta', name: 'Cuenta', userId: 'u1' },
            blue: { socketId: 'invitado', name: 'Invitado' },
        }), unranked);

        expect(sent.map((s) => s.payload)).toEqual([{ ranked: false }, { ranked: false }]);
    });
});