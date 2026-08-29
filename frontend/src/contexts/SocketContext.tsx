import { createContext, useState, useContext, useEffect } from "react";
import { Socket, io } from "socket.io-client";
import type { ReconnectPayload } from "../../../shared";
import { SocketEvents } from "../../../shared";

interface SocketContextState {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextState>({
    socket: null,
    isConnected: false,
})

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const SocketProvider: React.FC<{ children: React.ReactNode}> = ({ children }) => {
    const [socket, setSocket] = useState<Socket>(() => io(SOCKET_URL, { autoConnect: false }));
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        socket.connect();

        socket.on('connect', () => {
            console.log('Connected to server');
            setIsConnected(true);

            const savedSession = localStorage.getItem('onitama_session');

            if (savedSession) {
                const { roomId, originalSocketId } = JSON.parse(savedSession);
                const payload: ReconnectPayload = { roomId, originalSocketId };
                socket.emit(SocketEvents.RECONNECT_ATTEMPT, payload);
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from server');
            setIsConnected(false);
        });

        //Sub-05.2: Reconexión
        socket.on(SocketEvents.RECONNECT_FAILED, () => {
            localStorage.removeItem('onitama_session');
        })

        socket.on(SocketEvents.ERROR, (data: { message: string }) => {
            console.error('Error from server:', data.message);
        });

        const handleNetworkRecover = () => {
            if (socket.disconnected) {
                socket.connect();
            }
        };

        const handleOffline = () => {
            console.warn('Conexión a Internet perdida. Intentando reconectar...');
            setIsConnected(false);
            socket.disconnect();
        };

        

        window.addEventListener('online', handleNetworkRecover);
        window.addEventListener('offline', handleOffline);

        return () => {
            socket.disconnect();
            socket.off('connect');
            socket.off('disconnect');
            socket.off(SocketEvents.RECONNECT_FAILED);
            socket.off(SocketEvents.ERROR);
            window.removeEventListener('online', handleNetworkRecover);
            window.removeEventListener('offline', handleOffline);
            
        };

    }, [socket]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => {
    return useContext(SocketContext);
};