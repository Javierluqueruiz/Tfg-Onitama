import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { authRoutes } from './auth/authRoutes';

export const app = express();

app.use(cors({ origin: env.frontendOrigin }));
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.use('/api/auth', authRoutes);