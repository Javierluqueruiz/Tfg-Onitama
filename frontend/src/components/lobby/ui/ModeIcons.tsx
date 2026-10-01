import React from 'react';

// Iconos de trazo para las filas del menú: mismo grosor y estilo en todos (los
// emojis cambian de aspecto según el sistema y desentonaban con el resto).
// Van en el color del texto de la tablilla (currentColor).
const Icon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <svg
        viewBox="0 0 40 40"
        width="100%"
        height="100%"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {children}
    </svg>
);

// Cuenco de té con vapor: partida tranquila, sin reloj.
export const TeaBowlIcon = () => (
    <Icon>
        <path d="M7 19 H33 C33 27.5 27.5 32 20 32 C12.5 32 7 27.5 7 19 Z" />
        <path d="M14 35 H26" />
        <path d="M15 8 C13 11 17 12 15 15" />
        <path d="M21 6 C19 9 23 10 21 13" />
        <path d="M27 8 C25 11 29 12 27 15" />
    </Icon>
);

// Reloj de arena: 10 minutos por jugador.
export const HourglassIcon = () => (
    <Icon>
        <path d="M11 5 H29" />
        <path d="M11 35 H29" />
        <path d="M13 5 V10 L20 20 L13 30 V35" />
        <path d="M27 5 V10 L20 20 L27 30 V35" />
        <path d="M16 33 H24 L20 27 Z" fill="currentColor" />
    </Icon>
);

// Rayo: 5 minutos por jugador.
export const BoltIcon = () => (
    <Icon>
        <path d="M23 4 L10 22 H19 L16 36 L30 16 H21 Z" fill="currentColor" fillOpacity="0.25" />
    </Icon>
);

// Torii: crear una sala.
export const ToriiIcon = () => (
    <Icon>
        <path d="M4 10 Q20 15 36 10" />
        <path d="M9 18 H31" />
        <path d="M11 12.5 V35" />
        <path d="M29 12.5 V35" />
        <path d="M20 14 V18" />
    </Icon>
);

// Llave: unirse con un código.
export const KeyIcon = () => (
    <Icon>
        <circle cx="12" cy="20" r="6" />
        <circle cx="12" cy="20" r="1.4" fill="currentColor" stroke="none" />
        <path d="M18 20 H36" />
        <path d="M31 20 V26" />
        <path d="M36 20 V25" />
    </Icon>
);

// Sobre: verificación de correo y avisos por email.
export const MailIcon = () => (
    <Icon>
        <rect x="5" y="9" width="30" height="22" rx="3" />
        <path d="M6 12 L20 23 L34 12" />
    </Icon>
);
