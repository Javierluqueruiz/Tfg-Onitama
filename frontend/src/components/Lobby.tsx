import { SocketEvents } from '../../../shared';
import { useSocket } from '../contexts/SocketContext';
import { useEffect, useState } from 'react';
import { MainMenu } from './lobby/MainMenu';
import { CreateRoom } from './lobby/CreateRoom';
import { JoinRoom } from './lobby/JoinRoom';
import { WaitingRoom } from './lobby/WaitingRoom';
import styles from './lobby/Lobby.module.css';

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
        setErrorMsg(null);
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
        <div className = {styles.wrapper}>
            <div className={styles.header}
            >
                <h1 className={styles.mainTitle}>⛩️ ONITAMA</h1>
                <p className={styles.subTitle}>El Camino del Maestro</p>
            </div>

            <div className={styles.content}>
                <div className={styles.statusContainer}>
                    <span className={`${styles.dot} ${isConnected ? styles.dotConnected : styles.dotDisconnected}`}/>
                    <span className={styles.statusText}>
                        {isConnected ? ' Servidor Online' : ' Conectando...'}
                    </span>

                    {/* ---PANTALLA PRINCIPAL --- */}
                    {currentScreen === 'MAIN' && (
                        <MainMenu 
                            onSelectCreate={() => {
                                setErrorMsg(null);
                                setCurrentScreen('CREATE');
                            }}
                            onSelectJoin={() => {
                                setErrorMsg(null);
                                setCurrentScreen('JOIN');
                            }}
                            isCOnnected={isConnected}
                        />
                    )}

                    {/* ---PANTALLA: CREAR SALA --- */}
                    {currentScreen === "CREATE" && (
                        <CreateRoom
                            playerName={playerName}
                            setPlayerName={setPlayerName}
                            onCreateRoom={handleCreateRoom}
                            onBack={() => {
                                setErrorMsg(null);
                                setCurrentScreen('MAIN');
                            }}
                        />
                    )}

                    {currentScreen === "WAITING" && (
                        <WaitingRoom 
                            roomCode={createdRoomCode}
                            onCancel={() => {
                                setErrorMsg(null);
                                setCurrentScreen('MAIN');
                            }}
                        />
                    )}

                    {currentScreen === "JOIN" && (
                        <JoinRoom
                            playerName={playerName}
                            setPlayerName={setPlayerName}
                            joinCode={joinCode}
                            setJoinCode={setJoinCode}
                            onJoinRoom={handleJoinRoom}
                            onBack={() => {
                                setErrorMsg(null);
                                setCurrentScreen('MAIN');
                            }}
                        />
                    )}

                    {/*Mensaje de error*/}
                    {errorMsg && (
                        <div className={styles.errorBox}>
                            {errorMsg}
                        </div>
                    )}
                </div>
            </div>
        </div>
    ); 
}