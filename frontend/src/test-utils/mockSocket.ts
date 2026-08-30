import { vi } from 'vitest';

type Listener = (...args: unknown[]) => void;

export function createMockSocket() {
    const listeners: Record<string, Listener[]> = {};

    return {
        id: 'mock-socket-id',
        on: vi.fn((event: string, handler: Listener) => {
            (listeners[event] ??= []).push(handler);
        }),
        off: vi.fn((event: string, handler?: Listener) => {
            if (!handler) {
                delete listeners[event];
                return;
            }
            listeners[event] = (listeners[event] ?? []).filter((h) => h !== handler);
        }),
        emit: vi.fn(),
        trigger(event: string, payload?: unknown) {
            (listeners[event] ?? []).forEach((handler) => handler(payload));
        },
    };
}