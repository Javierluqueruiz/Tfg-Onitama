import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io('http://localhost:3000')

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Conectado al servidor con ID:', (socket.id));
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Desconectado del servidor');
      setIsConnected(false);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Motor Onitama</h1>
      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Estado de la red:</h2>
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isConnected ? 'green' : 'red' }}>
          {isConnected ? '🟢 CONECTADO' : '🔴 DESCONECTADO'}
        </p>

        
      </div>
    </div>
  );
}

export default App;