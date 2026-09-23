import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameControls } from './GameControls';

const baseProps = {
    status: 'in_progress',
    isGameOver: false,
    isVsAi: false,
    drawOfferSent: false,
    drawOfferReceived: false,
    onOfferDraw: vi.fn(),
    onSurrender: vi.fn(),
    onExit: vi.fn(),
};

describe('GameControls', () => {
    it('Debe mostrar el botón de ofrecer empate cuando el juego está en progreso y no es contra IA', () => {
        render(<GameControls {...baseProps} />);
        expect(screen.getByText('Ofrecer Empate')).toBeInTheDocument();
    });

    it('No debe mostrar el botón de ofrecer empate cuando el juego está terminado', () => {
        render(<GameControls {...baseProps} status="finished" />);
        expect(screen.queryByText('Ofrecer Empate')).not.toBeInTheDocument();
    });

    it('No debe mostrar el botón de ofrecer empate cuando es contra IA', () => {
        render(<GameControls {...baseProps} isVsAi={true} />);
        expect(screen.queryByText('Ofrecer Empate')).not.toBeInTheDocument();
    });

    it('Debe mostrar el botón de rendirse cuando es contra IA', () => {
        render(<GameControls {...baseProps} isVsAi={true} />);
        expect(screen.getByText('Rendirse')).toBeInTheDocument();
    });
});