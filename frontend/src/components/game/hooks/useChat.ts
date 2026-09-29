import { useState } from 'react';
import type { Socket } from 'socket.io-client';
import { SocketEvents, type ChatMessage } from '../../../../../shared';
import { useSocketEvent } from '../../../hooks/useSocketEvent';

// Estado del chat de la sala: mensajes recibidos y envío. `initialMessages` es el historial
// restaurado al reconectar tras recargar (ver restoredSession.ts).
export function useChat(socket: Socket | null, initialMessages: ChatMessage[] = []) {
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

    useSocketEvent<ChatMessage>(socket, SocketEvents.CHAT_UPDATE, (message) => {
        setMessages((prev) => [...prev, message]);
    });

    // Sub-05.2: al reconectar, el servidor devuelve el historial de chat de la sala para que los
    // mensajes enviados mientras el jugador estaba desconectado no se pierdan.
    useSocketEvent<{ chatHistory?: ChatMessage[] }>(socket, SocketEvents.RECONNECT_SUCCESS, (data) => {
        if (data.chatHistory) {
            setMessages(data.chatHistory);
        }
    });

    // Devuelve true si el mensaje se ha enviado (no está vacío y hay conexión).
    const sendMessage = (text: string): boolean => {
        const message = text.trim();
        if (!message || !socket) return false;

        socket.emit(SocketEvents.SEND_MESSAGE, { message });
        return true;
    };

    return { messages, sendMessage };
}
