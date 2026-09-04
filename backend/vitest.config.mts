import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        exclude: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            reportsDirectory: './coverage',
            exclude: [
                'src/simulatedGame.ts', // script de demo manual, no lógica a cubrir
                'src/server.ts',        // solo arranque/cableado, sin lógica propia
                '**/*.d.ts',
                'dist/**',
                'tests/**',
            ],
        },
    },
});