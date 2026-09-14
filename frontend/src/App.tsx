import { Lobby } from './components/lobby/Lobby';
import { GameScreen } from './components/game/GameScreen';
import { ReconnectingScreen } from './ReconnectingScreen';
import { useApp } from './useApp';

export const App = () => {
  const {
    gameState, localColor, playersProfile, isReconnecting
  } = useApp();

  if (gameState) {
    return <GameScreen gameState={gameState} localColor={localColor} playersProfile={playersProfile} isReconnecting={isReconnecting} />;
  }

  if (isReconnecting) {
    return <ReconnectingScreen />;
  }
  
  return <Lobby />;
};