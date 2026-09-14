import { describe , it , expect , beforeEach, afterEach, vi } from "vitest";
import { MatchmakingService, type QueueEntry } from "../../src/network/MatchmakingService";
import { RoomManager } from "../../src/network/RoomManager";

describe("MatchmakingService (Sub-09.2)", () => {
    const socketsIdToClean: string[] = [];

    const makeEntry = (overrides: Partial<QueueEntry> = {}): QueueEntry => {
        const entry: QueueEntry = {
            socketId: `socket-${Math.random().toString(36).slice(2)}`,
            name: 'Jugador',
            elo: 1000,
            ...overrides
        };
        socketsIdToClean.push(entry.socketId);
        return entry;
    };

    beforeEach(() => {
        RoomManager.clearActiveRooms();
    });

    afterEach(() => {
        socketsIdToClean.splice(0).forEach((id) => MatchmakingService.leaveQueue(id));
        vi.useRealTimers();
    });

    it('Empareja a dos jugadores registrados si la diferencia de ELO es menor o igual a la tolerancia inicial (100)', () => {
        const primero = makeEntry({ name: 'Primero', elo: 1050, userId: 'user1' });
        MatchmakingService.joinQueue(primero, 'casual');

        const segundo = makeEntry({ name: 'Segundo', elo: 1100, userId: 'user2' });
        const result = MatchmakingService.joinQueue(segundo, 'casual');

        expect(result.matchFound).toBe(true);
        expect(result.opponentId).toBe(primero.socketId);

    });

    it('No empareja a dos jugadores registrados si la diferencia de ELO es mayor a la tolerancia inicial (100)', () => {
        const primero = makeEntry({ name: 'Primero', elo: 1000, userId: 'user1' });
        MatchmakingService.joinQueue(primero, 'casual');

        const segundo = makeEntry({ name: 'Segundo', elo: 1200, userId: 'user2' });
        const result = MatchmakingService.joinQueue(segundo, 'casual');

        expect(result.matchFound).toBe(false);
    });

    it('Un registrado nunca se empareja con un invitado, incluso si la diferencia de ELO es menor a la tolerancia', () => {
        const invitado = makeEntry({ name: 'Invitado', elo: 1000 });
        MatchmakingService.joinQueue(invitado, 'casual');

        const registrado = makeEntry({ name: 'Registrado', elo: 1000, userId: 'user1' });
        const primerIntento = MatchmakingService.joinQueue(registrado, 'casual');
        expect(primerIntento.matchFound).toBe(false);

        const registrado2 = makeEntry({ name: 'Registrado2', elo: 1000, userId: 'user2' });
        const segundoIntento = MatchmakingService.joinQueue(registrado2, 'casual');
        expect(segundoIntento.matchFound).toBe(true);
        expect(segundoIntento.opponentId).toBe(registrado.socketId);
    });

    it('Las colas están separadas por modo de juego, por lo que jugadores en diferentes modos no se emparejan', () => {
        const jugador1 = makeEntry({ name: 'Jugador1', elo: 1000, userId: 'user1' });
        MatchmakingService.joinQueue(jugador1, 'casual');

        const jugador2 = makeEntry({ name: 'Jugador2', elo: 1000, userId: 'user2' });
        const result = MatchmakingService.joinQueue(jugador2, 'normal');

        expect(result.matchFound).toBe(false);
    });

    it('Con el tiempo, dos jugadores con una diferencia de ELO mayor a la tolerancia inicial pueden ser emparejados si esperan lo suficiente', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

        const primero = makeEntry({ name: 'Primero', elo: 1000, userId: 'user1' });
        MatchmakingService.joinQueue(primero, 'casual');

        const segundo = makeEntry({ name: 'Segundo', elo: 1300, userId: 'user2' });
        const result1 = MatchmakingService.joinQueue(segundo, 'casual');
        expect(result1.matchFound).toBe(false);

        MatchmakingService.runMatchmakingSweep();
        expect(RoomManager.getRoomBySocketId(primero.socketId)).toBeUndefined();

        vi.setSystemTime(new Date('2026-01-01T00:00:10Z'));
        MatchmakingService.runMatchmakingSweep();

        const room = RoomManager.getRoomBySocketId(primero.socketId);
        expect(room).toBeDefined();
        expect(RoomManager.getRoomBySocketId(segundo.socketId)).toBe(room); 
    });
    
    it('el barrido encuentra pareja aunque haya tres o más jugadores en la cola', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

        const e1000 = makeEntry({ name: 'Jugador1000', elo: 1000, userId: 'user1' });
        MatchmakingService.joinQueue(e1000, 'casual');

        const e1250 = makeEntry({ name: 'Jugador1250', elo: 1250, userId: 'user2' });
        MatchmakingService.joinQueue(e1250, 'casual');

        const e1500 = makeEntry({ name: 'Jugador1500', elo: 1500, userId: 'user3' });
        MatchmakingService.joinQueue(e1500, 'casual');

        vi.setSystemTime(new Date('2026-01-01T00:00:08Z'));
        MatchmakingService.runMatchmakingSweep();

        const roomE1000 = RoomManager.getRoomBySocketId(e1000.socketId);
        const roomE1250 = RoomManager.getRoomBySocketId(e1250.socketId);
        const roomE1500 = RoomManager.getRoomBySocketId(e1500.socketId);

        expect(roomE1000).toBeDefined();
        expect(roomE1250).toBeDefined();
        expect(roomE1000).toBe(roomE1250);
        expect(roomE1500).toBeUndefined();
    });

    it('el ELO de un invitado nunca llega al PlayerProfile de la sala, aunque sirva para emparejarlo', () => {
        const invitado1 = makeEntry({ name: 'Invitado1', elo: 1000 });
        MatchmakingService.joinQueue(invitado1, 'casual');

        const invitado2 = makeEntry({ name: 'Invitado2', elo: 1000});
        const result = MatchmakingService.joinQueue(invitado2, 'casual');

        const room = RoomManager.getRoomById(result.roomId!);
        expect(room?.players.red?.elo).toBeUndefined();
        expect(room?.players.blue?.elo).toBeUndefined();
    });

    it('el ELO de un jugador registrado sí llega al PlayerProfile de la sala', () => {
        const registrado1 = makeEntry({ name: 'Registrado1', elo: 1000, userId: 'user1' });
        MatchmakingService.joinQueue(registrado1, 'casual');

        const registrado2 = makeEntry({ name: 'Registrado2', elo: 1050, userId: 'user2' });
        const result = MatchmakingService.joinQueue(registrado2, 'casual');

        const room = RoomManager.getRoomById(result.roomId!);
        const elos = [room?.players.red?.elo, room?.players.blue?.elo].sort((a, b) => (a ?? 0) - (b ?? 0));
        expect(elos).toEqual([1000, 1050]);
    });

    it('leaveQueue elimina correctamente a un jugador de la cola', () => {
        const entry = makeEntry({ name: 'Jugador', elo: 1000, userId: 'user1' });
        MatchmakingService.joinQueue(entry, 'casual');
        MatchmakingService.leaveQueue(entry.socketId);

        const otro = makeEntry({ name: 'OtroJugador', elo: 1000, userId: 'user2' });
        const result = MatchmakingService.joinQueue(otro, 'casual');
        expect(result.matchFound).toBe(false);
    });
});