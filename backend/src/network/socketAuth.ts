import { Server } from 'socket.io';
import { parseCookie } from 'cookie';
import { AuthService } from '../auth/authService';
import './socketData';

// Vincula la sesión de socket con la cuenta autenticada, si la hay -- reutiliza la misma
// verificación que ya usa requireAuth para las peticiones REST, sin reimplementar nada.
// Si el token falta o no es válido, NO se rechaza la conexión: se trata como invitado,
// igual que hace AuthContext en el frontend cuando /me falla.
export function registerSocketAuth(io: Server): void {
    io.use(async (socket, next) => {
        const rawCookie = socket.handshake.headers.cookie;
        const token = rawCookie ? parseCookie(rawCookie).token : undefined;

        if (token) {
            try {
                const payload = AuthService.verifyToken(token);
                if (await AuthService.isSessionStillValid(payload)) {
                    socket.data.userId = payload.sub;
                }
            } catch {
                // Token inválido o sesión no válida -> se queda como invitado
            }
        }

        next();
    });
}