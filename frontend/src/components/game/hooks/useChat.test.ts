import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Socket } from 'socket.io-client';
import { SocketEvents, type ChatMessage } from '../../../../../shared';
import { createMockSocket } from '../../../test-utils/mockSocket';
import { useChat } from './useChat';

const message = (text: string, socketId = 'other'): ChatMessage => ({ socketId, name: 'Rival', message: text, timestamp: 1 });

describe('useChat', () => {
    it('empieza sin mensajes', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useChat(socket as unknown as Socket));

        expect(result.current.messages).toEqual([]);
    });

    it('arranca con el historial restaurado y sigue añadiendo mensajes nuevos', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useChat(socket as unknown as Socket, [message('uno'), message('dos')]));

        expect(result.current.messages.map(m => m.message)).toEqual(['uno', 'dos']);

        act(() => {
            socket.trigger(SocketEvents.CHAT_UPDATE, message('tres'));
        });

        expect(result.current.messages.map(m => m.message)).toEqual(['uno', 'dos', 'tres']);
    });

    it('añade los mensajes que llegan por CHAT_UPDATE, en orden', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useChat(socket as unknown as Socket));

        act(() => {
            socket.trigger(SocketEvents.CHAT_UPDATE, message('hola'));
            socket.trigger(SocketEvents.CHAT_UPDATE, message('suerte'));
        });

        expect(result.current.messages.map(m => m.message)).toEqual(['hola', 'suerte']);
    });

    it('restaura el historial del servidor al reconectar', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useChat(socket as unknown as Socket));

        act(() => {
            socket.trigger(SocketEvents.CHAT_UPDATE, message('antes de caerse'));
            socket.trigger(SocketEvents.RECONNECT_SUCCESS, { chatHistory: [message('uno'), message('dos')] });
        });

        expect(result.current.messages.map(m => m.message)).toEqual(['uno', 'dos']);
    });

    it('conserva los mensajes si la reconexión no trae historial', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useChat(socket as unknown as Socket));

        act(() => {
            socket.trigger(SocketEvents.CHAT_UPDATE, message('hola'));
            socket.trigger(SocketEvents.RECONNECT_SUCCESS, {});
        });

        expect(result.current.messages).toHaveLength(1);
    });

    it('sendMessage emite el texto sin espacios sobrantes', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useChat(socket as unknown as Socket));

        let sent = false;
        act(() => {
            sent = result.current.sendMessage('  buena partida  ');
        });

        expect(sent).toBe(true);
        expect(socket.emit).toHaveBeenCalledWith(SocketEvents.SEND_MESSAGE, { message: 'buena partida' });
    });

    it('sendMessage no envía mensajes vacíos', () => {
        const socket = createMockSocket();
        const { result } = renderHook(() => useChat(socket as unknown as Socket));

        let sent = true;
        act(() => {
            sent = result.current.sendMessage('   ');
        });

        expect(sent).toBe(false);
        expect(socket.emit).not.toHaveBeenCalled();
    });

    it('sendMessage no hace nada sin conexión', () => {
        const { result } = renderHook(() => useChat(null));

        let sent = true;
        act(() => {
            sent = result.current.sendMessage('hola');
        });

        expect(sent).toBe(false);
    });
});
