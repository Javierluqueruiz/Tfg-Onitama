import { Lobby } from './components/Lobby';
import { useState, useEffect} from 'react';
import { useSocket } from './contexts/SocketContext';
import type { GameState, PlayerColor, PlayerProfile } from '../../shared';
import { SocketEvents } from '../../shared';
import { GameScreen } from './components/game/GameScreen';

export const App = () => {
  const {socket} = useSocket();
  const [gameState, setGameState] = useState<GameState | null>(null);

  const [localColor, setLocalColor] = useState<PlayerColor | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on(SocketEvents.GAME_START, (data: { gameState: GameState, players: { red: PlayerProfile, blue: PlayerProfile } }) => {
      console.log('¡Partida iniciada! Estado inicial recibido:', data.gameState);
      setGameState(data.gameState);
      if (socket.id === data.players.red.socketId) {
        setLocalColor('red');
      } else if (socket.id === data.players.blue.socketId) {
        setLocalColor('blue');
      }
    });

    return () => {
      socket.off(SocketEvents.GAME_START);
    };
  }, [socket]);

  if (gameState) {
    return <GameScreen gameState={gameState} localColor={localColor} />;
  }

  return <Lobby />;

};