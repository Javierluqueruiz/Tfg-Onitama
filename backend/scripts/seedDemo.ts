import mongoose from 'mongoose';
import { connectDB } from '../src/config/db';
import { User } from '../src/auth/User.model';
import { AuthService } from '../src/auth/authService';

interface DemoPlayer {
    username: string;
    elo: number;
    wins: number;
    losses: number;
    draws: number;
}

// Un jugador por tramo de rango, de Gran Maestro a Bronce.
const PLAYERS: DemoPlayer[] = [
    { username: 'Akira', elo: 1812, wins: 62, losses: 30, draws: 4 },
    { username: 'Hana', elo: 1690, wins: 55, losses: 31, draws: 2 },
    { username: 'Kenji', elo: 1604, wins: 44, losses: 28, draws: 2 },
    { username: 'Sakura', elo: 1504, wins: 30, losses: 20, draws: 1 },
    { username: 'Ryu', elo: 1465, wins: 34, losses: 19, draws: 0 },
    { username: 'Mei', elo: 1388, wins: 25, losses: 22, draws: 0 },
    { username: 'Takeshi', elo: 1331, wins: 21, losses: 18, draws: 0 },
    { username: 'Yuki', elo: 1205, wins: 15, losses: 17, draws: 1 },
    { username: 'Haruto', elo: 1158, wins: 10, losses: 12, draws: 0 },
    { username: 'Aiko', elo: 1096, wins: 12, losses: 13, draws: 0 },
    { username: 'Daichi', elo: 980, wins: 8, losses: 14, draws: 0 },
    { username: 'Noa', elo: 842, wins: 5, losses: 14, draws: 1 },
];

// Las dos cuentas de la demo: entran en la clasificación y tienen historial.
const DEMO_ACCOUNTS = ['Kaito', 'Rin'];

const EMAIL_DOMAIN = '@demo.test';
const DEMO_DB_SUFFIX = '_demo';

const RESULTS = ['win', 'win', 'loss', 'win', 'loss', 'win', 'win', 'loss'] as const;

const buildLastMatches = (opponents: string[]) =>
    RESULTS.map((result, index) => ({
        opponentName: opponents[index % opponents.length],
        result,
        eloChange: result === 'win' ? 12 + index : -(10 + index),
        ranked: true,
        date: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
    }));

const main = async (): Promise<void> => {
    const password = process.env.DEMO_PASSWORD;
    if (!password) throw new Error('Falta la variable de entorno DEMO_PASSWORD');

    await connectDB();

    const dbName = mongoose.connection.name;
    if (!dbName.endsWith(DEMO_DB_SUFFIX)) {
        throw new Error(`Base "${dbName}" no es una base de demostración (debe acabar en "${DEMO_DB_SUFFIX}")`);
    }

    // La base es exclusivamente de demostración: se vacía para poder repetir el script.
    await User.deleteMany({});

    const passwordHash = await AuthService.hashPassword(password);
    const opponents = PLAYERS.map((player) => player.username);

    const players = PLAYERS.map((player) => ({
        username: player.username,
        email: `${player.username.toLowerCase()}${EMAIL_DOMAIN}`,
        passwordHash,
        emailVerified: true,
        elo: player.elo,
        gamesPlayed: player.wins + player.losses + player.draws,
        wins: player.wins,
        losses: player.losses,
        draws: player.draws,
    }));

    const accounts = DEMO_ACCOUNTS.map((username) => ({
        username,
        email: `${username.toLowerCase()}${EMAIL_DOMAIN}`,
        passwordHash,
        emailVerified: true,
        elo: 1030,
        gamesPlayed: RESULTS.length,
        wins: RESULTS.filter((result) => result === 'win').length,
        losses: RESULTS.filter((result) => result === 'loss').length,
        draws: 0,
        lastMatches: buildLastMatches(opponents),
    }));

    await User.create([...players, ...accounts]);
    console.log(`Base "${dbName}": ${players.length + accounts.length} usuarios creados`);

    await mongoose.disconnect();
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});