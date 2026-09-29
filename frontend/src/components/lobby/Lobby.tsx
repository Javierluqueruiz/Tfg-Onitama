import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
        handleCreateRoom, handleJoinRoom, startMatchmaking, startAiGame, selectMode, setSelectMode, accountUsername
    } = useLobby();

    // FEAT-08: qué pestaña del menú principal está activa, solo para decidir
    // qué fondo mostrar -- no afecta a la lógica de juego.
    const [mainMenuTab, setMainMenuTab] = useState<Tab>('MATCHMAKING');

    const isPrivateFlow = currentScreen === 'CREATE' || currentScreen === 'JOIN' || currentScreen === 'WAITING';
    const backgroundScene: 'main' | 'private' | 'ai' =
        isPrivateFlow || (currentScreen === 'MAIN' && mainMenuTab === 'PRIVATE') ? 'private' :
        currentScreen === 'MAIN' && mainMenuTab === 'AI' ? 'ai' :
        'main';
    
    // Coordenadas de cada escena dentro del lienzo grande (en vw/vh, no en
    // píxeles, para que escale igual en cualquier tamaño de pantalla). No tienen
    // por qué estar en fila -- es un boceto de un lienzo en dos dimensiones.
    const SCENE_FOCUS: Record<'main' | 'private' | 'ai', string> = {
        main: '25% 5%',
        private: '100% 85%',
        ai: '20% 60%',
    };
    const focus = SCENE_FOCUS[backgroundScene];

    const [isPanning, setIsPanning] = useState(false);
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        setIsPanning(true);
        const timer = setTimeout(() => setIsPanning(false), 550);
        return () => clearTimeout(timer);
    }, [backgroundScene]);

    return (
        <div className={`${styles.wrapper} gameTheme`}>
            <div className={styles.sceneWorld}>
                <div
                    className={`${styles.sceneCanvas} ${isPanning ? styles.sceneCanvasPanning : ''}`}
                    style={{ backgroundPosition: focus }}
                />
            </div>

            <div className={styles.header}
            >
                <a className={styles.mainTitle} href="/">⛩️ ONITAMA</a>
                <p className={styles.subTitle}>El Camino del Maestro</p>
                <Link to="/rules" className={styles.rulesLink}>📜 Reglas</Link>
            </div>

            <div className={styles.content}>
                <div className={styles.panelWrap}>
                    {currentScreen === 'MAIN' && (
                        <div className={styles.mainTabs}>
                            <button
                                className={`${styles.mainTab} ${mainMenuTab === 'MATCHMAKING' ? styles.mainTabActive : ''}`}
                                onClick={() => setMainMenuTab('MATCHMAKING')}
                            >
                                Partida Pública
                            </button>
                            <button
                                className={`${styles.mainTab} ${mainMenuTab === 'PRIVATE' ? styles.mainTabActive : ''}`}
                                onClick={() => setMainMenuTab('PRIVATE')}
                            >
                                Partida Privada
                            </button>
                            <button
                                className={`${styles.mainTab} ${mainMenuTab === 'AI' ? styles.mainTabActive : ''}`}
                                onClick={() => setMainMenuTab('AI')}
                            >
                                Contra IA
                            </button>
                        </div>
                    )}
                    <div className={`${styles.statusContainer} ${currentScreen === 'MAIN' ? styles.statusContainerTabbed : ''}`}>
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
                                onStartAiGame={startAiGame}
                                isConnected={isConnected}
                                activeTab={mainMenuTab}
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
                            accountName={accountUsername}
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
                            accountName={accountUsername}
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
        </div>
    ); 
}