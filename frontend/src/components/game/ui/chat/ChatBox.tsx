import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../../../../contexts/SocketContext';
import { MAX_CHAT_MESSAGE_LENGTH, type ChatMessage, type PlayerColor } from '../../../../../../shared';
import { useChat } from '../../hooks/useChat';
import styles from './ChatBox.module.css';

interface ChatBoxProps {
    // Color del jugador local: tiñe sus mensajes y, por contraste, los del rival.
    localColor: PlayerColor | null;
    // Historial restaurado al reconectar tras recargar la página.
    initialMessages?: ChatMessage[];
}

const toneClass = (color: PlayerColor | null): string =>
    color === 'red' ? styles.toneRed : color === 'blue' ? styles.toneBlue : styles.toneNeutral;

const oppositeColor = (color: PlayerColor | null): PlayerColor | null =>
    color === 'red' ? 'blue' : color === 'blue' ? 'red' : null;

const SpeakerIcon: React.FC<{ muted: boolean }> = ({ muted }) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 9.5 H8 L13 5.5 V18.5 L8 14.5 H4 Z" fill="currentColor" fillOpacity="0.15" />
        {muted ? (
            <path d="M17 9.5 L22 14.5 M22 9.5 L17 14.5" />
        ) : (
            <>
                <path d="M16.5 9 C17.8 10.5 17.8 13.5 16.5 15" />
                <path d="M19 6.5 C21.7 9.5 21.7 14.5 19 17.5" />
            </>
        )}
    </svg>
);

const SendIcon: React.FC = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 3 L10 14" />
        <path d="M21 3 L14.5 21 L10 14 L3 9.5 Z" fill="currentColor" fillOpacity="0.15" />
    </svg>
);

export const ChatBox: React.FC<ChatBoxProps> = ({ localColor, initialMessages }) => {
    const { socket } = useSocket();
    const { messages, sendMessage } = useChat(socket, initialMessages);
    const [inputValue, setInputValue] = useState('');

    //Sub-07.2
    const [isMuted, setIsMuted] = useState(false);

    // Al llegar un mensaje, el área de mensajes baja hasta el final. Se mueve su propio
    // scroll (y no scrollIntoView) para no desplazar ninguna página ancestro.
    const messagesRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const area = messagesRef.current;
        if (area) area.scrollTop = area.scrollHeight;
    }, [messages, isMuted]);

    const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (sendMessage(inputValue)) {
            setInputValue('');
        }
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Los mensajes del rival se ocultan si está silenciado.
    const visibleMessages = messages.filter(msg => !isMuted || socket?.id === msg.socketId);
    const remaining = MAX_CHAT_MESSAGE_LENGTH - inputValue.length;

    return (
        <section className={styles.chat} aria-label="Chat de la partida">
            <header className={styles.header}>
                <h3 className={styles.title}>Chat</h3>
                <button
                    type="button"
                    className={`${styles.muteButton} ${isMuted ? styles.muted : ''}`}
                    onClick={() => setIsMuted(!isMuted)}
                    aria-pressed={isMuted}
                    aria-label={isMuted ? 'Dejar de silenciar al rival' : 'Silenciar al rival'}
                    title={isMuted ? 'Dejar de silenciar al rival' : 'Silenciar al rival'}
                >
                    <SpeakerIcon muted={isMuted} />
                </button>
            </header>

            <div className={styles.messages} ref={messagesRef} role="log" aria-live="polite">
                {visibleMessages.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyTitle}>
                            {isMuted && messages.length > 0 ? 'Rival silenciado' : 'Aún no hay mensajes'}
                        </span>
                        <span>
                            {isMuted && messages.length > 0
                                ? 'Sus mensajes están ocultos.'
                                : 'Saluda a tu rival para romper el hielo.'}
                        </span>
                    </div>
                ) : (
                    visibleMessages.map((msg, index) => {
                        const isOwnMessage = socket?.id === msg.socketId;
                        const tone = toneClass(isOwnMessage ? localColor : oppositeColor(localColor));

                        return (
                            <div
                                key={`${msg.timestamp}-${index}`}
                                className={`${styles.message} ${tone} ${isOwnMessage ? styles.own : styles.theirs}`}
                            >
                                <div className={styles.meta}>
                                    <span className={styles.sender}>{isOwnMessage ? 'Tú' : msg.name}</span>
                                    <span className={styles.time}>{formatTime(msg.timestamp)}</span>
                                </div>
                                <div className={styles.bubble}>{msg.message}</div>
                            </div>
                        );
                    })
                )}
            </div>

            <form className={styles.composer} onSubmit={handleSendMessage}>
                <input
                    type="text"
                    className={styles.input}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    maxLength={MAX_CHAT_MESSAGE_LENGTH}
                    aria-label="Mensaje"
                    autoComplete="off"
                />
                {remaining <= 40 && (
                    <span className={`${styles.counter} ${remaining <= 10 ? styles.counterLow : ''}`} aria-hidden="true">
                        {remaining}
                    </span>
                )}
                <button
                    type="submit"
                    className={styles.sendButton}
                    aria-label="Enviar mensaje"
                    disabled={!inputValue.trim()}
                >
                    <SendIcon />
                </button>
            </form>
        </section>
    );
};
