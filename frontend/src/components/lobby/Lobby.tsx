import { useState } from 'react';
import { MainMenu, type Tab } from './ui/MainMenu';
import { CreateRoom } from './ui/CreateRoom';
import { JoinRoom } from './ui/JoinRoom';
import { WaitingRoom } from './ui/WaitingRoom';
import styles from './Lobby.module.css';
import { useLobby } from './hooks/useLobby';
import type { GameMode } from '../../../../shared';
import { MatchmakingRoom } from './ui/MatchmakingRoom';
import { AuthStatus } from './ui/AuthStatus';
import '../game/theme.css';

export const Lobby: React.FC =  () => {
    const {
        isConnected, currentScreen, setCurrentScreen,
        playerName, setPlayerName, joinCode, setJoinCode,
        createdRoomCode, errorMsg, setErrorMsg,
        handleCreateRoom, handleJoinRoom, startMatchmaking, selectMode, setSelectMode
    } = useLobby();

    // FEAT-08: qué pestaña del menú principal está activa, solo para decidir
    // qué fondo mostrar -- no afecta a la lógica de juego.
    const [mainMenuTab, setMainMenuTab] = useState<Tab>('MATCHMAKING');

    const isPrivateFlow = currentScreen === 'CREATE' || currentScreen === 'JOIN' || currentScreen === 'WAITING';
    const backgroundScene = isPrivateFlow || (currentScreen === 'MAIN' && mainMenuTab === 'PRIVATE')
        ? 'private'
        : 'main';

    return (
        <div className={`${styles.wrapper} gameTheme`}>
            <div className={`${styles.scene} ${styles.sceneMain} ${backgroundScene === 'main' ? styles.sceneActive : ''}`} />
            <div className={`${styles.scene} ${styles.scenePrivate} ${backgroundScene === 'private' ? styles.sceneActive : ''}`} />

            <div className={styles.header}
            >
                <h1 className={styles.mainTitle}>⛩️ ONITAMA</h1>
                <p className={styles.subTitle}>El Camino del Maestro</p>
            </div>

            <div className={styles.content}>
                <div className={styles.statusContainer}>
                    <AuthStatus />
                    <div className={styles.statusHeader}>
                        <span className={`${styles.dot} ${isConnected ? styles.dotConnected : styles.dotDisconnected}`}/>
                        <span className={styles.statusText}>
                            {isConnected ? 'Servidor Online' : 'Conectando...'}
                        </span>
                    </div>

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
                            onStartMatchmaking={(mode: GameMode) => {
                                setErrorMsg(null);
                                startMatchmaking(mode);
                            }}
                            isConnected={isConnected}
                            activeTab={mainMenuTab}
                            onTabChange={setMainMenuTab}
                        />
                    )}

                    {/* ---PANTALLA: MATCHMAKING --- */}
                    {currentScreen === 'MATCHMAKING' && selectMode && (
                        <MatchmakingRoom
                            mode = {selectMode}
                            onCancel={() => {
                                setErrorMsg(null);
                                setSelectMode(null);
                                setCurrentScreen('MAIN');
                            }}
                            onMatchFound={(roomId: string, roomCode: string) => {
                                console.log(`Partida encontrada! Room ID: ${roomId}, Room Code: ${roomCode}`);
                                setErrorMsg(null);
                            }}
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