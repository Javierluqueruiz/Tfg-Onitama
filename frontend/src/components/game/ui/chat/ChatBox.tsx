import React, { useEffect } from 'react';
import { useSocket } from '../../../../contexts/SocketContext';
import { SocketEvents, type ChatMessage } from '../../../../../../shared';
import styles from './ChatBox.module.css';

export const ChatBox: React.FC = () => {
    const { socket } = useSocket();
    const [messages, setMessages] = React.useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = React.useState('');

    //Sub-07.2
    const [isMuted, setIsMuted] = React.useState(false);

    //Referencia para hacer scroll automático al final del chat.
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message: ChatMessage) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        };

        // Sub-05.2: al reconectar, el servidor devuelve el historial de chat de la sala para que los
        // mensajes enviados mientras el jugador estaba desconectado no se pierdan.
        const handleReconnectSuccess = (data: { chatHistory?: ChatMessage[] }) => {
            if (data.chatHistory) {
                setMessages(data.chatHistory);
            }
        };

        socket.on(SocketEvents.CHAT_UPDATE, handleNewMessage);
        socket.on(SocketEvents.RECONNECT_SUCCESS, handleReconnectSuccess);

        return () => {
            socket.off(SocketEvents.CHAT_UPDATE, handleNewMessage);
            socket.off(SocketEvents.RECONNECT_SUCCESS, handleReconnectSuccess);
        };
    }, [socket]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
         });
    }, [messages]);
    
    const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
        console.log(inputValue);
        e.preventDefault();
        if (!inputValue.trim() || !socket) return;

        socket.emit(SocketEvents.SEND_MESSAGE, { message: inputValue.trim() });
        setInputValue('');
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return ( 
        <div className={styles.chatContainer}>
            <div className={styles.chatHeader}>
                <span>Chat de Sala</span>
                <button 
                    className={`${styles.muteButton} ${isMuted ? styles.muted : ''}`}
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? 'Desmutear rival' : 'Mutear rival'}
                >
                    {isMuted ? '🔇' : '🔊'}
                </button>
            </div>
            <div className={styles.messagesArea}>
                {messages.map((msg, index) => {
                    const isOwnMessage = socket?.id === msg.socketId;
                    if (isMuted && !isOwnMessage) {
                        return null; // No renderizar mensajes del rival si está silenciado.
                    }

                    return (
                        <div 
                            key={index} 
                            className={`${styles.message} ${isOwnMessage ? styles.ownMessage : styles.opponentMessage}`}
                        >
                            <span className={styles.messageSender}>
                                {isOwnMessage ? 'Tú' : msg.name}
                            </span>
                            <div className={styles.messageBubble}>
                                {msg.message}
                            </div>
                            <span className={styles.messageTime}>
                                {formatTime(msg.timestamp)}
                            </span>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form className={styles.inputArea} onSubmit={handleSendMessage}>
                <input 
                    type="text"
                    className={styles.chatInput}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    maxLength={200}
                />
                <button type="submit" className={styles.sendButton}>Enviar</button>
            </form>
        </div>
    )
}