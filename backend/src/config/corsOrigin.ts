import { env } from './env';

export function getAllowedOrigins(): string[] {
    return env.frontendOrigin.split(',').map((origin) => origin.trim());
}

