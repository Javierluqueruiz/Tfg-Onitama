import { useState, useEffect } from 'react';
import { MainMenu, type Tab } from './ui/MainMenu';
import { CreateRoom } from './ui/CreateRoom';
import { JoinRoom } from './ui/JoinRoom';
import { WaitingRoom } from './ui/WaitingRoom';
import styles from './Lobby.module.css';
import { useLobby } from './hooks/useLobby';
import type { GameMode } from '../../../../shared';
import { MatchmakingRoom } from './ui/MatchmakingRoom';
import { AuthStatus } from './ui/AuthStatus';
import { Brand } from './ui/Brand';
import { ScrollPanel } from '../shared/ui/ScrollPanel';
import { useLobbyScene } from '../shared/ui/sceneContext';
import '../game/theme.css';
import { NavLinks } from './ui/NavLinks';
import { VerifyEmailNotice } from './ui/VerifyEmailNotice';
import { ServerStatus } from './ui/ServerStatus';

// `prefix` se oculta en pantallas estrechas para que las tres pestañas quepan en una fila.
const MAIN_TABS: { tab: Tab; prefix?: string; label: string }[] = [
    { tab: 'MATCHMAKING', prefix: 'Partida', label: 'pública' },
    { tab: 'PRIVATE', prefix: 'Partida', label: 'privada' },
    { tab: 'AI', label: 'Contra IA' },
];

export const Lobby: React.FC =  () => {
    const {
        isConnected, currentScreen, setCurrentScreen,
        playerName, setPlayerName, joinCode, setJoinCode,
        createdRoomCode, errorMsg, setErrorMsg,
        handleCreateRoom, handleJoinRoom, startMatchmaking, startAiGame, handleCancelWaiting, selectMode, setSelectMode, accountUsername
    } = useLobby();

    // FEAT-08: qué pestaña del menú principal está activa, solo para decidir
    // qué fondo mostrar -- no afecta a la lógica de juego.
    const [mainMenuTab, setMainMenuTab] = useState<Tab>('MATCHMAKING');

    const isPrivateFlow = currentScreen === 'CREATE' || currentScreen === 'JOIN' || currentScreen === 'WAITING';
    const backgroundScene: 'main' | 'private' | 'ai' =
        isPrivateFlow || (currentScreen === 'MAIN' && mainMenuTab === 'PRIVATE') ? 'private' :
        currentScreen === 'MAIN' && mainMenuTab === 'AI' ? 'ai' :
        'main';

    // El fondo lo pinta SceneLayout (persiste entre rutas); aquí solo se le dice
    // qué escena toca. Al desmontar se restablece, para que al volver al lobby
    // (p. ej. desde login) empiece en la escena principal.
    const setScene = useLobbyScene();
    useEffect(() => {
        setScene(backgroundScene);
    }, [backgroundScene, setScene]);
    useEffect(() => () => setScene('main'), [setScene]);

    // Las pestañas viven dentro del papel del pergamino, solo en la pantalla principal.
    const tabs = currentScreen === 'MAIN' ? (
        <div className={styles.mainTabs} role="tablist" aria-label="Tipo de partida">
            {MAIN_TABS.map(({ tab, prefix, label }) => (
                <button
                    key={tab}
                    role="tab"
                    aria-selected={mainMenuTab === tab}
                    className={`${styles.mainTab} ${mainMenuTab === tab ? styles.mainTabActive : ''}`}
                    onClick={() => setMainMenuTab(tab)}
                >
                    {prefix && <span className={styles.tabPrefix}>{prefix} </span>}
                    {label}
                </button>
            ))}
        </div>
    ) : undefined;

    return (
        <div className={`${styles.wrapper} gameTheme`}>
            <header className={styles.header}>
                <Brand reload />
                <nav className={styles.topNav} aria-label="Cuenta y ayuda">
                    <ServerStatus isConnected={isConnected} />
                    {currentScreen !== 'WAITING' && <NavLinks />}
                    {currentScreen !== 'WAITING' && <AuthStatus />}
                </nav>
            </header>

            <div className={styles.content}>
                <div className={styles.panelWrap}>
                    <VerifyEmailNotice />
                    <ScrollPanel header={tabs}>
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
                                onCancel={handleCancelWaiting}
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
                    </ScrollPanel>
                </div>
            </div>
        </div>
    );
}
