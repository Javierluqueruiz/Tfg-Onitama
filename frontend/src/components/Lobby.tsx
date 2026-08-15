import { MainMenu } from './lobby/MainMenu';
import { CreateRoom } from './lobby/CreateRoom';
import { JoinRoom } from './lobby/JoinRoom';
import { WaitingRoom } from './lobby/WaitingRoom';
import styles from './lobby/Lobby.module.css';
import { useLobby } from './useLobby';

export const Lobby: React.FC = () => {
    const {
        isConnected, currentScreen, setCurrentScreen,
        playerName, setPlayerName, joinCode, setJoinCode, 
        createdRoomCode, setCreatedRoomCode, errorMsg, setErrorMsg,
        handleCreateRoom, handleJoinRoom
    } = useLobby();

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