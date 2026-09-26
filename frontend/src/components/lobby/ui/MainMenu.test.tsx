import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MainMenu } from './MainMenu';

//FEAT-15 (Sub-15.4): escalera de niveles contra la IA

const AI_LADDER = [
    { name: 'Heurística · Fácil', engine: 'heuristic', difficulty: 'easy' },
    { name: 'Heurística · Medio', engine: 'heuristic', difficulty: 'medium' },
    { name: 'Heurística · Difícil', engine: 'heuristic', difficulty: 'hard' },
    { name: 'Minimax · Fácil', engine: 'minimax', difficulty: 'easy' },
    { name: 'Minimax · Medio', engine: 'minimax', difficulty: 'medium' },
    { name: 'Minimax · Difícil', engine: 'minimax', difficulty: 'hard' },
] as const;

describe('MainMenu: pestaña de partida contra IA', () => {
    const renderAiTab = (isConnected = true) => {
        const onStartAiGame = vi.fn();
        render(
            <MainMenu
                onSelectCreate={vi.fn()}
                onSelectJoin={vi.fn()}
                onStartMatchmaking={vi.fn()}
                onStartAiGame={onStartAiGame}
                isConnected={isConnected}
                activeTab="AI"
                onTabChange={vi.fn()}
            />
        );
        return { onStartAiGame };
    };

    const levelButtons = () => screen.getAllByRole('button', { name: /·/ });

    it('muestra los seis niveles en una sola escalera', () => {
        renderAiTab();

        expect(levelButtons().map(button => button.textContent)).toEqual(AI_LADDER.map(level => level.name));
    });

    it.each(AI_LADDER)('al hacer click en "$name" inicia la partida con el motor $engine y dificultad $difficulty', ({ name, engine, difficulty }) => {
        const { onStartAiGame } = renderAiTab();

        fireEvent.click(screen.getByRole('button', { name }));

        expect(onStartAiGame).toHaveBeenCalledWith(engine, difficulty);
        expect(onStartAiGame).toHaveBeenCalledTimes(1);
    });

    it('deshabilita todos los botones si no hay conexión', () => {
        renderAiTab(false);

        expect(levelButtons()).toHaveLength(6);
        levelButtons().forEach(button => expect(button).toBeDisabled());
    });
});