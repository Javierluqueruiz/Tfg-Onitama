import dotenv from 'dotenv';

dotenv.config();

// Cada propiedad es un getter, no un valor capturado de una vez al importar este
// archivo -- así `env.jwtSecret` siempre refleja el process.env.JWT_SECRET actual en el
// momento en que se lee, y no una foto congelada del instante en que algo importó este
// módulo por primera vez (que en los tests, por el orden de carga de módulos, podía ser
// antes de que tests/setup.ts llegara a fijar su valor de repuesto).
export const env = {
    get port() { return Number(process.env.PORT) || 3000; },
    get mongodbUri() { return process.env.MONGODB_URI; },
    get jwtSecret() { return process.env.JWT_SECRET; },
    get jwtExpiresIn() { return process.env.JWT_EXPIRES_IN || '1d'; },
    // FRONTEND_ORIGIN admite varios orígenes separados por comas (ver app.ts, para CORS).
    // Esta versión sin procesar solo debe usarse ahí -- para construir una URL absoluta
    // (los enlaces de los correos, por ejemplo), usa publicFrontendUrl.
    get frontendOrigin() { return process.env.FRONTEND_ORIGIN || 'http://localhost:5173'; },
    // El primero de la lista de FRONTEND_ORIGIN: la única URL canónica que tiene sentido
    // para construir un enlace absoluto. Antes de esto, un enlace de verificación con
    // varios orígenes en FRONTEND_ORIGIN salía roto -- la lista entera se colaba en la URL.
    get publicFrontendUrl() { return (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',')[0].trim(); },
    // GMAIL_USER se conserva como identidad del remitente (la dirección que se ve en el
    // "De:" y la que se verifica en Brevo como remitente) -- ya no se usa para autenticar
    // contra un servidor SMTP de Gmail, así que GMAIL_APP_PASSWORD ha dejado de hacer falta.
    get gmailUser() { return process.env.GMAIL_USER; },
    get brevoApiKey() { return process.env.BREVO_API_KEY; },
    get turnstileSecretKey() { return process.env.TURNSTILE_SECRET_KEY; },
}