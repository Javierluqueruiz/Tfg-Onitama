import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ServerStatus } from './ServerStatus';

// Umbral a partir del cual la espera se considera larga (SLOW_CONNECTION_MS en el componente).
const SLOW_MS = 8000;

describe('ServerStatus', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('con conexión es un punto con el texto solo para lectores de pantalla', () => {
        render(<ServerStatus isConnected />);

        const label = screen.getByText('Servidor online');
        expect(label.className).toMatch(/srOnly/);
        expect(screen.getByRole('status')).toHaveAttribute('title', 'Servidor online');
    });

    it('sin conexión muestra «Conectando...» de forma visible', () => {
        render(<ServerStatus isConnected={false} />);

        const label = screen.getByText('Conectando...');
        expect(label.className).not.toMatch(/srOnly/);
    });

    it('si la espera se alarga, avisa de que el servidor tarda en responder', () => {
        render(<ServerStatus isConnected={false} />);

        act(() => { vi.advanceTimersByTime(SLOW_MS); });

        expect(screen.getByText('El servidor tarda en responder...')).toBeInTheDocument();
        expect(screen.queryByText('Conectando...')).not.toBeInTheDocument();
    });

    it('un corte breve no cuenta como espera larga: el reloj se reinicia al reconectar', () => {
        const { rerender } = render(<ServerStatus isConnected={false} />);
        act(() => { vi.advanceTimersByTime(5000); });

        rerender(<ServerStatus isConnected />);
        rerender(<ServerStatus isConnected={false} />);
        act(() => { vi.advanceTimersByTime(5000); });

        // 5 s + 5 s seguidos sumarían 10 s, pero fueron dos cortes separados de 5 s.
        expect(screen.getByText('Conectando...')).toBeInTheDocument();
    });

    it('tras una espera larga y una reconexión, el siguiente corte vuelve a empezar por «Conectando...»', () => {
        const { rerender } = render(<ServerStatus isConnected={false} />);
        act(() => { vi.advanceTimersByTime(SLOW_MS); });
        expect(screen.getByText('El servidor tarda en responder...')).toBeInTheDocument();

        rerender(<ServerStatus isConnected />);
        rerender(<ServerStatus isConnected={false} />);

        expect(screen.getByText('Conectando...')).toBeInTheDocument();
    });
});