import React, { useEffect } from 'react';
import { useSocket } from '../../../../contexts/SocketContext';
import { SocketEvents, type ChatMessage } from '../../../../../../shared';
import styles from './ChatBox.module.css';

export const ChatBox: React.FC = () => {
    const { socket } = useSocket();
    const [messages, setMessages] = React.useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = React.useState('');

    //Referencia para hacer scroll automático al final del chat.
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message: ChatMessage) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        };

        socket.on(SocketEvents.CHAT_UPDATE, handleNewMessage);

        return () => {
            socket.off(SocketEvents.CHAT_UPDATE, handleNewMessage);
        };
    }, [socket]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
            <div className={styles.messagesArea}>
                {messages.map((msg, index) => {
                    const isOwnMessage = socket?.id === msg.socketId;
                    return (
                        <div 
                            key={index} 
                            className={`${styles.message} ${isOwnMessage ? styles.ownMessage : styles.opponentMessage}`}
                        >
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