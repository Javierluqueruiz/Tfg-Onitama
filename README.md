# Onitama

[![CI - Motor Onitama](https://github.com/Javierluqueruiz/Tfg-Onitama/actions/workflows/ci.yml/badge.svg)](https://github.com/Javierluqueruiz/Tfg-Onitama/actions/workflows/ci.yml)

Implementación web y multijugador en tiempo real del juego de mesa abstracto **Onitama**, desarrollada como Trabajo de Fin de Grado. El proyecto cubre tanto el motor de juego (reglas, cartas y condiciones de victoria) como la infraestructura de red necesaria para que dos jugadores remotos puedan enfrentarse desde el navegador.

## 🎮 Demo

| Servicio | URL |
|---|---|
| Frontend (Vercel) | https://tfg-onitama-psi.vercel.app/ |
| Backend (Render) | https://tfg-onitama.onrender.com/ |

> ⚠️ El backend está desplegado en el plan gratuito de Render, que suspende el servicio tras 15 minutos de inactividad. La primera conexión tras un periodo de inactividad puede tardar unos segundos en establecerse mientras la instancia se reactiva.

## ✨ Características

- **Motor de juego** completo de Onitama: tablero 5×5, mazo de 16 cartas, movimientos, capturas y las dos condiciones de victoria (Camino del Maestro y Captura del Maestro).
- **Salas privadas** con código de acceso de 5 letras para jugar con amigos.
- **Cola de emparejamiento automático**, con preferencia de modo de juego (Rápido, Normal, Casual).
- **Sincronización en tiempo real** del tablero vía WebSockets (Socket.io), con la perspectiva del tablero invertida según el color de cada jugador.
- **Reloj de partida** por jugador y **reconexión** ante desconexiones involuntarias, con un periodo de gracia antes de dar la partida por perdida.
- **Rendición, empates y revancha**, negociados entre ambos jugadores.
- **Chat de sala** en tiempo real con opción de silenciar al oponente.
- **Indicador de latencia** en vivo mediante un ciclo de ping/pong.
- **Registro e inicio de sesión** seguros, con contraseñas cifradas (bcrypt) y sesiones basadas en JWT.
- **Verificación de correo electrónico** tras el registro, y **recuperación de contraseña** mediante un enlace enviado por email.
- **Modo invitado**: se puede seguir jugando sin necesidad de crear una cuenta.

## 🏗️ Arquitectura

El repositorio es un monorepo con tres paquetes independientes:

```
tfg-onitama/
├── frontend/   # Cliente React + Vite + TypeScript
├── backend/    # Servidor Node.js + Express + Socket.io + TypeScript
└── shared/     # Contratos de tipos y eventos de red compartidos por ambos
```

El paquete `shared/` centraliza los eventos de Socket.io (`SocketEvents`) y los modelos de dominio (tablero, cartas, perfiles de jugador), de forma que el cliente y el servidor consumen exactamente las mismas definiciones y evitan desincronizaciones por errores de tipado o de nombres de eventos.

| Capa | Tecnologías |
|---|---|
| Frontend | React 19, Vite, TypeScript, Socket.io-client |
| Backend | Node.js, Express, Socket.io, MongoDB (Mongoose), TypeScript |
| Autenticación | JWT, bcrypt, Nodemailer (verificación de correo y recuperación de contraseña) |
| Testing | Vitest, React Testing Library, @vitest/coverage-v8, Supertest, MongoDB Memory Server |
| CI/CD | GitHub Actions, Vercel (frontend), Render (backend) |

El estado de las partidas, las colas de emparejamiento y el historial de chat residen en memoria del proceso del servidor (una decisión de diseño consciente para esa parte del proyecto, documentada en la memoria del TFG). Los perfiles de usuario -- registro, autenticación y verificación de correo -- sí persisten en una base de datos MongoDB.

## 🚀 Puesta en marcha local

### Requisitos

- Node.js 24.x o superior
- npm

### 1. Clonar el repositorio

```bash
git clone https://github.com/Javierluqueruiz/Tfg-Onitama.git
cd Tfg-Onitama
```

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

El servidor arranca por defecto en `http://localhost:3000` (endpoint de salud en `/health`).

### 3. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173` y se conecta automáticamente al backend local.

### Variables de entorno

| Variable | Paquete | Descripción | Por defecto |
|---|---|---|---|
| `PORT` | backend | Puerto de escucha del servidor | `3000` |
| `MONGODB_URI` | backend | Cadena de conexión a MongoDB (Atlas u otro) | — (obligatoria) |
| `JWT_SECRET` | backend | Secreto para firmar y verificar los tokens de sesión | — (obligatoria) |
| `JWT_EXPIRES_IN` | backend | Duración de la sesión | `1d` |
| `FRONTEND_ORIGIN` | backend | Origen permitido por CORS para la API REST (no afecta a Socket.io) | `http://localhost:5173` |
| `GMAIL_USER` | backend | Cuenta de Gmail usada como remitente de los correos (verificación, recuperación de contraseña) | — (obligatoria) |
| `GMAIL_APP_PASSWORD` | backend | Contraseña de aplicación de esa cuenta de Gmail | — (obligatoria) |
| `VITE_SOCKET_URL` | frontend | URL del servidor de Socket.io al que se conecta el cliente | `http://localhost:3000` |
| `VITE_API_URL` | frontend | URL de la API REST del backend | `http://localhost:3000` |

`PORT`, `VITE_SOCKET_URL` y `VITE_API_URL` ya tienen valores por defecto pensados para trabajar en local sin configurar nada. `MONGODB_URI`, `JWT_SECRET`, `GMAIL_USER` y `GMAIL_APP_PASSWORD` sí son obligatorias desde el primer arranque del backend -- sin ellas, la conexión a la base de datos y el envío de correos fallan. Cada paquete tiene un `.env.example` con la lista completa.

## ✅ Testing

Cada paquete tiene su propia suite de pruebas con Vitest.

```bash
# Backend: pruebas de integración de red (levanta un servidor real en un puerto dinámico)
cd backend
npm test              # con cobertura (vitest run --coverage)

# Frontend: pruebas unitarias y de componentes (hooks, lógica pura y UI)
cd frontend
npm test               # sin cobertura
npm run test:coverage  # con cobertura
```

El flujo de integración continua (`.github/workflows/ci.yml`) ejecuta en cada *push* y *pull request* sobre `main`/`develop`: instalación limpia (`npm ci`), *linting* (ESLint), comprobación de tipos (parte del build de `tsc`) y la suite de tests de ambos paquetes.

## 📄 Documentación

El diseño y las decisiones arquitectónicas de cada iteración (memorandos técnicos, análisis de valor aportado y estrategia de pruebas) están documentados en detalle en la memoria del TFG.

## 👤 Autor

**Javier Luque** — Trabajo de Fin de Grado
