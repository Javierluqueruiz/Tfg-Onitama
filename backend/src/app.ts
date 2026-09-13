import express from 'express';
import cors from 'cors';
import { authRoutes } from './auth/authRoutes';
import { profileRoutes } from './auth/profileRoutes';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { getAllowedOrigins } from './config/corsOrigin';

export const app = express();

app.set('trust proxy', 1);
app.use(helmet());

// FRONTEND_ORIGIN admite varios orígenes separados por comas -- en desarrollo normalmente
// hay uno solo, pero en despliegue conviene poder aceptar a la vez producción y las
// distintas ramas de Vercel (develop, preview...) contra el mismo backend de Render, sin
// tener que tocar la variable de entorno cada vez que se prueba una rama nueva.
const allowedOrigins = getAllowedOrigins();

app.use(cors({
    origin: (origin, callback) => {
        // Sin cabecera Origin (peticiones que no vienen de un navegador, como los propios
        // tests con Supertest) se permiten igual -- CORS solo tiene sentido para el navegador.
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);