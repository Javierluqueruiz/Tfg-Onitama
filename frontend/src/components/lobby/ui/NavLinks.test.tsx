import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NavLinks } from './NavLinks';

const renderAt = (path: string) => render(
    <MemoryRouter initialEntries={[path]}>
        <NavLinks />
    </MemoryRouter>
);

describe('NavLinks', () => {
    it('enlaza a las reglas y a la clasificación', () => {
        renderAt('/');

        expect(screen.getByRole('link', { name: /reglas/i })).toHaveAttribute('href', '/rules');
        expect(screen.getByRole('link', { name: /clasificación/i })).toHaveAttribute('href', '/ranking');
    });

    it('marca como página actual solo el enlace de la ruta en la que estás', () => {
        renderAt('/ranking');

        expect(screen.getByRole('link', { name: /clasificación/i })).toHaveAttribute('aria-current', 'page');
        expect(screen.getByRole('link', { name: /reglas/i })).not.toHaveAttribute('aria-current');
    });

    it('en otras rutas no marca ninguno', () => {
        renderAt('/');

        expect(screen.getByRole('link', { name: /reglas/i })).not.toHaveAttribute('aria-current');
        expect(screen.getByRole('link', { name: /clasificación/i })).not.toHaveAttribute('aria-current');
    });
});