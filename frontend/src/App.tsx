import { Lobby } from './components/Lobby';
import { useState, useEffect} from 'react';
import { useSocket } from './contexts/SocketContext';
import type { GameState } from '../../shared';
import { SocketEvents } from '../../shared';
import { GameScreen } from './components/game/GameScreen';

export const App = () => {
  const {socket} = useSocket();
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on(SocketEvents.GAME_START, (data: { gameState: GameState}) => {
      console.log('¡Partida iniciada! Estado inicial recibido:', data.gameState);
      setGameState(data.gameState);
    });

    return () => {
      socket.off(SocketEvents.GAME_START);
    };
  }, [socket]);

  if (gameState) {
    return <GameScreen gameState={gameState} />;
  }

  return <Lobby />;

};