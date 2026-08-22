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

export const SocketProvider: React.FC<{ children: React.ReactNode}> = ({ children }) => {
    const [socket, setSocket] = useState<Socket>(() => io('http://localhost:3000', { autoConnect: false }));
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


        return () => {
            socket.disconnect();
            socket.off('connect');
            socket.off('disconnect');
            socket.off(SocketEvents.RECONNECT_FAILED);
            socket.off(SocketEvents.ERROR);
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