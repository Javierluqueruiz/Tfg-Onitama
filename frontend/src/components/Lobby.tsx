import { SocketEvents } from '../../../shared';
import { useSocket } from '../contexts/SocketContext';
import { useEffect, useState } from 'react';

type MenuScreen = 'MAIN' | 'CREATE' | 'JOIN' | 'WAITING';

export const Lobby: React.FC = () => {
    const { socket, isConnected } = useSocket();

    const [currentScreen, setCurrentScreen] = useState<MenuScreen>('MAIN');

    //Estados de datos
    const [playerName, setPlayerName] = useState<string>('');
    const [joinCode, setJoinCode] = useState<string>('');
    const [createdRoomCode, setCreatedRoomCode] = useState<string>('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [gameStarted, setGameStarted] = useState(false);

    //const [isRoomCreated, setIsRoomCreated] = useState<boolean>(false);



    useEffect(() => {
        if (!socket) return;

        socket.on(SocketEvents.ROOM_CREATED, (data: { roomCode: string }) => {
            setCreatedRoomCode(data.roomCode)
            setCurrentScreen('WAITING');
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

        socket?.emit(SocketEvents.CREATE_ROOM, { hostName: playerName });
    };

    const handleJoinRoom = () => {
        if (!playerName.trim()) return setErrorMsg('El nombre del jugador no puede estar vacío.');
        if (!joinCode.trim()) return setErrorMsg('El código no puede estar vacío.');

        socket?.emit(SocketEvents.JOIN_ROOM, { guestName: playerName, roomCode: joinCode });
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
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', backgroundImage: 'url(https://i0.wp.com/churapereviews.com/wp-content/uploads/2024/01/Onitama-Background.png?fit=2775%2C1875&ssl=1)'}}>
            <div style={{
                flex: 1,
                //backgroundColor: '#2c2e50',
                color: 'white',
                display:'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundSize: 'cover'
            }}>
                <h1 style={{fontSize: '4rem', margin:'5', letterSpacing: '4px'}}>⛩️ ONITAMA</h1>
                <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>El Camino del Maestro</p>
            </div>

            <div style={{
                flex: 1,
                //backgroundColor: '#f5f6fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px'
            }}>
                <div style={{ width: '100%', maxWidth: '400px', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                    <div style={{ textAlign: 'right', fontSize: '42px', color: isConnected ? '#4cd137' : '#e84118', marginBottom: '20px'}}>
                        {isConnected ? '● Servidor Online' : '● Conectando...'}
                    </div>

                    {/* ---PANTALLA PRINCIPAL --- */}
                    {currentScreen === 'MAIN' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px'}}>
                            <h2 style={{textAlign: 'center', marginTop: 0}}>Bienvenido</h2>
                            <button 
                                onClick={() => { setErrorMsg(null); setCurrentScreen('CREATE')}}
                                style={{ padding: '15px', fontSize: '16px', background: '#2980b9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}
                            >
                                Crear Nueva Partida
                            </button>
                            <button
                                onClick={()=>{setErrorMsg(null); setCurrentScreen('JOIN')}}
                                style={{ padding: '15px', fontSize: '16px', background: '#2980b9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}
                            >
                                Unirse a la Partida
                            </button>
                        </div>  
                    )}

                    {/* ---PANTALLA: CREAR SALA --- */}
                    {currentScreen === "CREATE" && (
                        <div style={{ display: 'flex', flexDirection: 'column'}}>
                            <h2 style={{ marginTop: 0}}>Modo Anfitrión</h2>
                            <label style={{fontWeight: 'bold'}}>Tu nombre:</label>
                            <input
                                type='text'
                                value={playerName}
                                onChange={(e)=> setPlayerName(e.target.value)}
                                placeholder='EJ. Maestro Nuby'
                                style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px'}}
                            />
                            <button onClick={handleCreateRoom} style={{ fontSize: '20px', padding: '15px', background: '#2980b9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' }}>
                                Crear Sala
                            </button>
                            <button onClick={() => setCurrentScreen('MAIN')} style={{ fontSize: '20px', padding: '10px', background: 'transparent', color: '#7f8c8d', border: 'none', cursor: 'pointer' }}>
                                Volver
                            </button>

                        </div>
                    )}

                    {currentScreen === "WAITING" && (
                        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '15px'}}>
                            <h2 style={{ marginTop: 0, color: '#27ae60'}}>¡Sala Creada!</h2>
                            <p>Pásale este código a tu rival:</p>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', letterSpacing: '4px', background: '#f1f2f6', padding: '20px', borderRadius: '8px', border: '2px dashed #bdc3c7' }}>
                                {createdRoomCode}
                            </div>
                            <div style={{ marginTop: '20px', color: '#7f8c8d' }}>
                                <span className="loading-dots">Esperando al jugador 2...</span>
                            </div>
                        </div>
                    )}

                    {currentScreen === "JOIN" && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <h2 style={{ marginTop: 0 }}>Unirse a Partida</h2>
                            
                            <label style={{ fontWeight: 'bold' }}>Tu Nombre:</label>
                            <input 
                                type="text" 
                                value={playerName} 
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="Tu nombre..."
                                style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px' }}
                            />

                            <label style={{ fontWeight: 'bold' }}>Código de la Sala:</label>
                            <input 
                                type="text" 
                                value={joinCode} 
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                placeholder="Ej. K8P2X"
                                maxLength={5}
                                style={{ padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '2px' }}
                            />

                            <button onClick={handleJoinRoom} style={{ padding: '15px', background: '#e67e22', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' }}>
                                Entrar a la Sala
                            </button>
                            <button onClick={() => setCurrentScreen('MAIN')} style={{ padding: '10px', background: 'transparent', color: '#7f8c8d', border: 'none', cursor: 'pointer' }}>
                                ← Volver
                            </button>
                        </div>
                    )}

                    {/*Mensaje de error*/}
                    {errorMsg && (
                        <div style={{ background: '#ff7675', color: 'white', padding: '12px', borderRadius: '6px', marginTop: '20px', textAlign: 'center', fontSize: '14px'}}>
                            {errorMsg}
                        </div>
                    )}


                </div>
            </div>
        </div>

    ); 
}