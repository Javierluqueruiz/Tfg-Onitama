# tfg
Repositorio para el TFG
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
| Backend | Node.js, Express, Socket.io, TypeScript |
| Testing | Vitest, React Testing Library, @vitest/coverage-v8 |
| CI/CD | GitHub Actions, Vercel (frontend), Render (backend) |

El estado de las partidas, las colas de emparejamiento y el historial de chat residen actualmente en memoria del proceso del servidor (sin base de datos), una decisión de diseño consciente para esta fase del proyecto que se documenta en la memoria del TFG.

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
| `VITE_SOCKET_URL` | frontend | URL del servidor de Socket.io al que se conecta el cliente | `http://localhost:3000` |

Para desarrollo local no es necesario configurar nada: ambos valores por defecto ya están pensados para trabajar en local. Solo son necesarias al desplegar cada servicio de forma independiente.

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
