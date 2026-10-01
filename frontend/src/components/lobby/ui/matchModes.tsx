import type React from 'react';
import type { GameMode } from '../../../../../shared';
import { TeaBowlIcon, HourglassIcon, BoltIcon } from './ModeIcons';

export interface MatchModeInfo {
    mode: GameMode;
    icon: React.ReactNode;
    label: string;
    description: string;
    // Nombre de la clase de color de la tablilla en MainMenu.module.css.
    accent: string;
}

// Modos de partida pública: los comparten el menú principal y la pantalla de búsqueda.
export const MATCH_MODES: MatchModeInfo[] = [
    { mode: 'casual', icon: <TeaBowlIcon />, label: 'Casual', description: 'Sin reloj. Para jugar sin prisa y aprender.', accent: 'accentCasual' },
    { mode: 'normal', icon: <HourglassIcon />, label: 'Normal', description: '10 minutos por jugador.', accent: 'accentNormal' },
    { mode: 'fast', icon: <BoltIcon />, label: 'Rápido', description: '5 minutos por jugador. Cada decisión cuenta.', accent: 'accentFast' },
];

export const getMatchMode = (mode: GameMode): MatchModeInfo =>
    MATCH_MODES.find(info => info.mode === mode) ?? MATCH_MODES[0];
