import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CardView } from './CardView';
import styles from './CardView.module.css';
import type { Card } from '../../../../../../shared';

const mockCard: Card = {
    name:'Test Card',
    description:'',
    color:'red',
    moves: [{ x: 0, y: -2 }, { x: 1, y: 0 }]
};

describe('CardView', () => {

    it('Muestra el nombre de la carta', () => {
        render(<CardView card={mockCard} />);
        expect(screen.getByText('Test Card')).toBeInTheDocument();
    });

    it('Muestra las casillas del tablero en miniatura con el centro marcado', () => {
        const { container } = render(<CardView card={mockCard} />);

        const cells = container.querySelectorAll(`.${styles.gridCell}`);
        expect(cells).toHaveLength(25);

        expect(cells[12]).toHaveClass(styles.centerPiece);
    });

    it('Marca como validMove las casillas correspondientes a los movimientos de la carta', () => {
        const { container } = render(<CardView card={mockCard} />);
        const cells = container.querySelectorAll(`.${styles.gridCell}`);

        expect(cells[2]).toHaveClass(styles.validMove); // (2,2) + (0,-2)
        expect(cells[13]).toHaveClass(styles.validMove); // (2,2) + (1,0)
    });

    it('No marca como validMove las casillas que no son movimientos válidos', () => {
        const { container } = render(<CardView card={mockCard} />);
        const cells = container.querySelectorAll(`.${styles.gridCell}`);
        expect(cells[0]).not.toHaveClass(styles.validMove);
        expect(cells[24]).not.toHaveClass(styles.validMove);
    });

    it.each([
        ['red', 'redFaction'],
        ['blue', 'blueFaction'],
        ['neutral', 'neutralFaction']
    ] as const)('aplica la clase de facción correcta para %s', (faction, expectedClass) => {
        const { container } = render(<CardView card={mockCard} faction={faction} />);
        expect(container.firstChild).toHaveClass(styles[expectedClass]);
    });

    it('Aplica la clase flipped cuando isFlipped es true', () => {
        const { container } = render(<CardView card={mockCard} isFlipped={true} />);
        expect(container.firstChild).toHaveClass(styles.flipped);
    });

    it('Aplica la clase selected cuando isSelected es true', () => {
        const { container } = render(<CardView card={mockCard} isSelected={true} />);
        expect(container.firstChild).toHaveClass(styles.selected);
    });

    it('Llama a onClick cuando se hace click en la carta', () => {
        const handleClick = vi.fn();
        render(<CardView card={mockCard} onClick={handleClick} />);
        fireEvent.click(screen.getByText('Test Card'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

});