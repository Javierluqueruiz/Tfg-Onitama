# Onitama

[![CI - Motor Onitama](https://github.com/Javierluqueruiz/Tfg-Onitama/actions/workflows/ci.yml/badge.svg)](https://github.com/Javierluqueruiz/Tfg-Onitama/actions/workflows/ci.yml)

Implementación web y multijugador en tiempo real del juego de mesa abstracto **Onitama**, desarrollada como Trabajo de Fin de Grado. El proyecto cubre el motor de juego (reglas, cartas y condiciones de victoria), la infraestructura de red para que dos jugadores remotos se enfrenten desde el navegador, un sistema de cuentas con puntuación ELO y clasificación global, y dos oponentes virtuales (uno heurístico y otro basado en búsqueda Minimax) con los que se puede jugar en solitario.

## 🎮 Demo

| Servicio | URL |
|---|---|
| Frontend (Vercel) | https://tfg-onitama-psi.vercel.app/ |
| Backend (Render) | https://tfg-onitama.onrender.com/ |

> ⚠️ El backend está desplegado en el plan gratuito de Render, que suspende el servicio tras 15 minutos de inactividad. La primera conexión tras un periodo de inactividad puede tardar unos segundos en establecerse mientras la instancia se reactiva.

## ✨ Características

**Juego**

- **Motor de juego** completo de Onitama: tablero 5×5, mazo de 16 cartas, movimientos, capturas, descarte forzoso cuando no hay movimientos válidos y las dos condiciones de victoria (Camino del Maestro y Captura del Maestro).
- **Sección de reglas** (`/rules`) con explorador de cartas, ejemplo de un turno, modos de juego y explicación del ELO y los rangos.
- **Interfaz** para ordenador y móvil, con identidad visual propia.

**Multijugador en tiempo real**

- **Salas privadas** con código de acceso de 5 caracteres para jugar con amigos.
- **Cola de emparejamiento automático** por modo de juego (Rápido, 5 min por jugador; Normal, 10 min; Casual, sin reloj) y por nivel de ELO, con una tolerancia que se amplía con el tiempo de espera. Los invitados y las cuentas registradas tienen colas separadas.
- **Sincronización en tiempo real** del tablero con Socket.IO, con la perspectiva invertida según el color de cada jugador.
- **Reloj de partida**, **reconexión** ante desconexiones (con 30 segundos de gracia antes de dar la partida por perdida) y restauración del estado, el chat y las ofertas pendientes al recargar.
- **Rendición, tablas y revancha**, negociadas entre ambos jugadores. Abandonar la sala en mitad de una partida cuenta como rendición.
- **Chat de sala** con opción de silenciar al oponente e **indicador de latencia** en vivo.

**Cuentas, puntuación y clasificación**

- **Registro e inicio de sesión** con contraseñas cifradas (bcrypt) y sesión en una cookie `httpOnly` con JWT, **verificación de correo** y **recuperación de contraseña** por enlace.
- **Modo invitado**: se puede jugar sin cuenta (las partidas no puntúan).
- **Puntuación ELO** con factor K variable, estadísticas, historial de las últimas 20 partidas y siete rangos (de Bronce a Gran Maestro), con aviso del cambio de ELO al terminar cada partida.
- **Perfil** del jugador (cambio de contraseña y eliminación de cuenta) y **clasificación global** (`/ranking`) con los 50 mejores y la posición del jugador que consulta.

**Oponente virtual** (partidas sin reloj y fuera de las estadísticas)

- **Heurístico**: evalúa el tablero (material, posición, control del templo, movilidad y amenaza inmediata) y añade ruido según el nivel (fácil, medio, difícil).
- **Minimax** con poda alfa-beta y ordenación de movimientos, con profundidad 2, 3 y 4 según el nivel.
- Seis niveles de dificultad en total y experimentos reproducibles que calibran ambos oponentes (ver [Experimentos](#-experimentos-del-oponente-virtual)).

**Seguridad**

- Verificación anti-bots con **Cloudflare Turnstile** (validada siempre en el servidor), limitación de peticiones por IP, cabeceras de seguridad (`helmet`), protección frente a CSRF mediante una cabecera obligatoria en las peticiones que modifican datos y saneado de filtros de consulta contra inyección NoSQL.
- Tokens con propósito distinto (sesión, verificación de correo y recuperación de contraseña) y sesiones que se invalidan al cambiar la contraseña.

## 🏗️ Arquitectura

El repositorio es un monorepo con tres paquetes independientes:

```
tfg-onitama/
├── frontend/   # Cliente React + Vite + TypeScript
├── backend/    # Servidor Node.js + Express + Socket.IO + TypeScript
│   ├── src/
│   │   ├── game/       # Motor de reglas (tablero, cartas, movimientos, victoria) y cálculo del ELO
│   │   ├── ai/         # Oponentes virtuales: evaluador heurístico y búsqueda Minimax
│   │   ├── network/    # Salas, emparejamiento, manejador de eventos de Socket.IO y turno de la IA
│   │   ├── auth/       # Cuentas, sesiones, correo, captcha y perfil
│   │   ├── ranking/    # Clasificación global
│   │   └── config/     # Variables de entorno, base de datos y CORS
│   ├── experiments/    # Scripts de calibración y medición de los oponentes virtuales
│   ├── scripts/        # Datos de demostración
│   └── tests/
└── shared/     # Contratos de tipos y eventos de red compartidos por ambos
```

El paquete `shared/` centraliza los eventos de Socket.IO (`SocketEvents`), los modelos de dominio (tablero, cartas, perfiles de jugador), el mazo de cartas y los rangos de ELO, de forma que el cliente y el servidor consumen exactamente las mismas definiciones y se evitan desincronizaciones por errores de tipado o de nombres de eventos.

| Capa | Tecnologías |
|---|---|
| Frontend | React 19, Vite, TypeScript, React Router, Socket.IO client |
| Backend | Node.js, Express, Socket.IO, MongoDB (Mongoose), TypeScript |
| Autenticación y seguridad | JWT en cookie `httpOnly`, bcrypt, helmet, express-rate-limit, Cloudflare Turnstile |
| Correo | API HTTP de Brevo (verificación de correo y recuperación de contraseña) |
| Testing | Vitest, React Testing Library, @vitest/coverage-v8, Supertest, MongoDB Memory Server |
| CI/CD | GitHub Actions, Vercel (frontend), Render (backend) |

El estado de las partidas, las colas de emparejamiento y el historial de chat residen en la memoria del proceso del servidor (una decisión de diseño consciente para esa parte del proyecto, documentada en la memoria del TFG). Los usuarios -- cuentas, estadísticas, puntuación ELO y últimas partidas -- sí persisten en una base de datos MongoDB.

**Despliegue.** El frontend en Vercel reenvía `/api/*` y `/socket.io/*` al backend de Render mediante las reglas de reescritura de `frontend/vercel.json`, de modo que el navegador solo ve un origen y la cookie de sesión no se trata como de terceros. Por la misma razón, el cliente de Socket.IO usa el transporte `polling`. El servidor expone `/health`, que se consulta periódicamente para que Render no lo suspenda.

### API REST

| Ruta | Descripción |
|---|---|
| `POST /api/auth/register`, `login`, `logout` | Alta de cuenta, inicio y cierre de sesión |
| `GET /api/auth/me` | Usuario de la sesión actual |
| `POST /api/auth/verify-email`, `resend-verification` | Verificación del correo |
| `POST /api/auth/forgot-password`, `reset-password` | Recuperación de contraseña |
| `GET /api/profile/me`, `PATCH /api/profile/password`, `DELETE /api/profile/me` | Estadísticas, cambio de contraseña y eliminación de cuenta |
| `GET /api/ranking` | Clasificación global (acepta sesión opcional) |
| `GET /health` | Comprobación de estado |

La partida en sí se juega por Socket.IO; los eventos están definidos en `shared/socket.types.ts`.

## 🚀 Puesta en marcha local

### Requisitos

- Node.js 24.x o superior
- npm
- Una base de datos MongoDB (por ejemplo, un clúster gratuito de MongoDB Atlas)

### 1. Clonar el repositorio

```bash
git clone https://github.com/Javierluqueruiz/Tfg-Onitama.git
cd Tfg-Onitama
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # y rellena las variables obligatorias (ver más abajo)
npm run dev
```

El servidor arranca por defecto en `http://localhost:3000` (punto de salud en `/health`).

### 3. Frontend

En otra terminal:

```bash
cd frontend
npm install
cp .env.example .env   # y rellena VITE_TURNSTILE_SITE_KEY
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`; el servidor de desarrollo de Vite reenvía `/api` y `/socket.io` al backend local.

### Variables de entorno

| Variable | Paquete | Descripción | Por defecto |
|---|---|---|---|
| `PORT` | backend | Puerto de escucha del servidor | `3000` |
| `MONGODB_URI` | backend | Cadena de conexión a MongoDB (Atlas u otro) | — (obligatoria) |
| `JWT_SECRET` | backend | Secreto para firmar y verificar los tokens | — (obligatoria) |
| `JWT_EXPIRES_IN` | backend | Duración de la sesión | `1d` |
| `FRONTEND_ORIGIN` | backend | Origen u orígenes permitidos por CORS, separados por comas. El primero se usa para construir los enlaces de los correos | `http://localhost:5173` |
| `GMAIL_USER` | backend | Dirección que figura como remitente de los correos (debe estar verificada en Brevo). El nombre de la variable es heredado de una versión anterior | — |
| `BREVO_API_KEY` | backend | Clave de la API de Brevo para enviar los correos | — |
| `TURNSTILE_SECRET_KEY` | backend | Clave secreta de Cloudflare Turnstile | — |
| `VITE_TURNSTILE_SITE_KEY` | frontend | Clave pública de Cloudflare Turnstile | — |
| `VITE_SOCKET_URL` | frontend | URL del servidor de Socket.IO (opcional; sin definir se usa el propio origen) | — |
| `VITE_API_URL` | frontend | URL de la API REST (opcional; sin definir se usa el propio origen) | — |

`MONGODB_URI` y `JWT_SECRET` son obligatorias desde el primer arranque. Para registrarse e iniciar sesión hacen falta además las claves de Turnstile, porque el captcha se valida siempre en el servidor; para desarrollo, Cloudflare ofrece [claves de prueba](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) que siempre superan la verificación (clave pública `1x00000000000000000000AA` y clave secreta `1x0000000000000000000000000000000AA`). Sin las variables de Brevo, el registro funciona, pero los correos de verificación y de recuperación de contraseña no se envían. Cada paquete tiene un `.env.example` con la lista completa.

### Datos de demostración (opcional)

`backend/scripts/seedDemo.ts` rellena una base de datos **de demostración** con jugadores de todos los rangos y dos cuentas con historial. Por seguridad, solo se ejecuta si el nombre de la base termina en `_demo` (apunta `MONGODB_URI` a una base así), y la vacía antes de insertar:

```bash
cd backend
DEMO_PASSWORD='una-contraseña' npx ts-node scripts/seedDemo.ts
```

## ✅ Testing

Cada paquete tiene su propia suite de pruebas con Vitest.

```bash
# Backend: pruebas unitarias y de integración (servidor real en un puerto dinámico,
# clientes socket.io-client y MongoDB en memoria)
cd backend
npm test               # sin cobertura
npm run test:coverage  # con cobertura

# Frontend: pruebas unitarias y de componentes (hooks, lógica pura y UI)
cd frontend
npm test               # sin cobertura
npm run test:coverage  # con cobertura
```

El flujo de integración continua (`.github/workflows/ci.yml`) se ejecuta en cada *push* a `main` y en cada *pull request* hacia `develop` o `main`. En el backend ejecuta la instalación limpia (`npm ci`), los tests con cobertura y el *linting* (ESLint); en el frontend, el *linting*, la compilación (`tsc -b` + Vite, que incluye la comprobación de tipos) y los tests.

## 🧪 Experimentos del oponente virtual

Los niveles de dificultad de los dos oponentes se calibraron con experimentos reproducibles que enfrentan a los bots entre sí con el motor de reglas real. Se ejecutan desde `backend/`:

```bash
npm run experiment:ai -- 1000        # calibración de la IA heurística
npm run experiment:search -- 20      # eficiencia de Minimax, poda alfa-beta y ordenación
npm run experiment:minimax -- leaf 100     # evaluador de hoja
npm run experiment:minimax -- versus 200   # Minimax frente a la heurística
npm run experiment:minimax -- ladder 200   # cada profundidad frente a la anterior
npm run experiment:minimax -- discard 500  # frecuencia del descarte forzoso
```

El método, los resultados y las limitaciones de cada experimento están en [`backend/experiments/README.md`](backend/experiments/README.md).

## 🌿 Flujo de trabajo

Se sigue un flujo con una rama por característica (`feat/…`) que se integra en `develop` mediante *pull request*, y `develop` se integra en `main`, que es la rama que se despliega. La integración continua actúa como filtro en cada *pull request*.

## 📄 Documentación

El diseño y las decisiones arquitectónicas de cada iteración (memorandos técnicos, análisis de valor aportado, estrategia de pruebas y experimentos) están documentados en detalle en la memoria del TFG.

## 👤 Autor

**Javier Luque** — Trabajo de Fin de Grado
