import { createContext, useState, useContext, useEffect } from "react";
import { Socket, io } from "socket.io-client";
import { SocketEvents } from "../../../shared";

interface SocketContextState {
    socket: Socket | null;
    isConnected: boolean;
    lastError?: string | null;
    setLastError: (message: string | null) => void;
}

const SocketContext = createContext<SocketContextState>({
    socket: null,
    isConnected: false,
    lastError: null,
    setLastError: () => {},
})

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const SocketProvider: React.FC<{ children: React.ReactNode}> = ({ children }) => {
    const [socket] = useState<Socket>(() => io(SOCKET_URL, { autoConnect: false }));
    const [isConnected, setIsConnected] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

    useEffect(() => {
        socket.connect();

        socket.on('connect', () => {
            console.log('Connected to server');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from server');
            setIsConnected(false);
        });

        socket.on(SocketEvents.ERROR, (data: { message: string }) => {
            console.error('Error from server:', data.message);
            setLastError(data.message);
            setTimeout(() => setLastError(null), 5000); // Clear error after 5 seconds
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
            socket.off(SocketEvents.ERROR);
            window.removeEventListener('online', handleNetworkRecover);
            window.removeEventListener('offline', handleOffline);
            
            
        };

    }, [socket]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, lastError, setLastError }}>
            {children}
        </SocketContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => {
    return useContext(SocketContext);
};