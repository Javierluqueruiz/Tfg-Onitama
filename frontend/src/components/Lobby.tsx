import { SocketEvents } from '../../../shared/types';
import { useSocket } from '../contexts/SocketContext';
import { useEffect, useState } from 'react';

export const Lobby: React.FC = () => {
    const { socket, isConnected } = useSocket();

    const [playerName, setPlayerName] = useState<string>('');

    const [isRoomCreated, setIsRoomCreated] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [gameStarted, setGameStarted] = useState(false);

    const [createPassword, setCreatePassword] = useState<string>('');
    const [joinPassword, setJoinPassword] = useState<string>('');

    useEffect(() => {
        if (!socket) return;

        socket.on(SocketEvents.ROOM_CREATED, () => {
            setIsRoomCreated(true);
            setErrorMsg(null);
        });

        socket.on(SocketEvents.ERROR, (data: { message: string }) => {
            setErrorMsg(data.message);
        });

        socket.on(SocketEvents.GAME_START, (data: { gameState: any }) => {
            console.log('Game started with state:', data.gameState);
            setGameStarted(true);
            setErrorMsg(null);
        });

        return () => {
            socket.off(SocketEvents.ROOM_CREATED);
            socket.off(SocketEvents.ERROR);
            socket.off(SocketEvents.GAME_START);
        }
    }, [socket]);

    const handleCreateRoom = () => {
        if (!playerName.trim()) {
            setErrorMsg('El nombre del jugador no puede estar vacío.');
            return;
        }

        if (!createPassword.trim()) return setErrorMsg('La contraseña no puede estar vacía.');
        socket?.emit(SocketEvents.CREATE_ROOM, { playerName, password: createPassword });
    };

    const handleJoinRoom = () => {
        if (!playerName.trim()) return setErrorMsg('El nombre del jugador no puede estar vacío.');
        if (!joinPassword.trim()) return setErrorMsg('La contraseña no puede estar vacía.');

        socket?.emit(SocketEvents.JOIN_ROOM, { playerName, password: joinPassword });
    }

    if (gameStarted){
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <h2> LA PARTIDA HA COMENZADO</h2>
                <p> Buena suerte</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
            <h1 style={{ textAlign: 'center' }}>⛩️ Onitama Lobby</h1>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
                
                <div style={{ textAlign: 'center', color: isConnected ? 'green' : 'red', fontWeight: 'bold' }}>
                    {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
                </div>

                <div>
                    <label><strong>Tu Nombre:</strong></label>
                    <input 
                        type="text" 
                        value={playerName} 
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Ej. Maestro Splinter"
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </div>

                <hr style={{ width: '100%' }} />

                {/* --- MODO ANFITRIÓN --- */}
                <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>Crear Partida</h3>
                    {!isRoomCreated ? (
                        <>
                            <input 
                                type="text" 
                                value={createPassword} 
                                onChange={(e) => setCreatePassword(e.target.value)}
                                placeholder="Inventa una contraseña..."
                                style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                            />
                            <button 
                                onClick={handleCreateRoom}
                                style={{ width: '100%', padding: '10px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Crear Sala
                            </button>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#2e7d32', fontWeight: 'bold' }}>
                            ¡Sala creada! Dile a tu rival que use la contraseña: <br/>
                            <span style={{ fontSize: '20px', background: 'white', padding: '5px 10px', display: 'inline-block', marginTop: '10px', border: '1px solid #2e7d32' }}>
                                {createPassword}
                            </span>
                            <p style={{ fontSize: '12px', color: '#666' }}>Esperando al jugador 2...</p>
                        </div>
                    )}
                </div>

                {/* --- MODO INVITADO --- */}
                <div style={{ background: '#fbe9e7', padding: '15px', borderRadius: '8px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#d84315' }}>Unirse a Partida</h3>
                    <input 
                        type="text" 
                        value={joinPassword} 
                        onChange={(e) => setJoinPassword(e.target.value)}
                        placeholder="Contraseña de tu amigo..."
                        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                        disabled={isRoomCreated} // Si ya has creado, no puedes unirte a otra
                    />
                    <button 
                        onClick={handleJoinRoom}
                        disabled={isRoomCreated}
                        style={{ width: '100%', padding: '10px', background: isRoomCreated ? '#ccc' : '#ff5722', color: 'white', border: 'none', borderRadius: '4px', cursor: isRoomCreated ? 'not-allowed' : 'pointer' }}
                    >
                        Entrar a la Sala
                    </button>
                </div>

                {errorMsg && (
                    <div style={{ color: 'white', background: '#f44336', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                        {errorMsg}
                    </div>
                )}
            </div>
        </div>
    );
}