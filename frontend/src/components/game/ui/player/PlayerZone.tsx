import React from 'react';
import styles from './PlayerZone.module.css';
import type { Card } from '../../../../../../shared';
import { PlayerInfo } from './PlayerInfo';
import { CardView } from '../cards/CardView';
import { NetworkStatus } from './NetworkStatus';

interface PlayerZoneProps {
    isOpponent?: boolean; // Define si es el rival para invertir el orden
    playerName: string;
    color: 'red' | 'blue';
    isActive: boolean;
    timeLeft: number;
    cards: Card[];
    
    // Props opcionales para el jugador local
    selectedCard?: Card | null;
    onSelectCard?: (card: Card) => void;
    isGameOver?: boolean;
    
    // Props de red (Sub-05.2)
    isConnected?: boolean;
    disconnectTimer: number | null;
    reconnectMessage?: boolean;
    isReconnecting?: boolean;
}

export const PlayerZone: React.FC<PlayerZoneProps> = ({
    isOpponent = false,
    playerName,
    color,
    isActive,
    timeLeft,
    cards,
    selectedCard,
    onSelectCard,
    isGameOver,
    isConnected = true,
    disconnectTimer,
    reconnectMessage,
    isReconnecting 
}) => {

    // Extraemos el renderizado de las cartas
    const renderCards = () => (
        <div className={styles.cardsRow}>
            {cards.map((card, index) => {
                const isCardSelected = !isOpponent && selectedCard?.name === card.name && !isGameOver;
                return (
                    <CardView 
                        key={`${isOpponent ? 'opponent' : 'local'}-card-${index}`} 
                        card={card} 
                        faction={color} 
                        isFlipped={isOpponent} 
                        isSelected={isCardSelected} 
                        onClick={() => !isOpponent && onSelectCard && onSelectCard(card)} 
                    />
                );
            })}
        </div>
    );

    // Extraemos el renderizado del perfil
    const renderInfo = () => (
        <PlayerInfo
            playerName={playerName}
            color={color}
            isActive={isActive}
            timeLeft={timeLeft}
        />
    );

    // Extraemos los banners de desconexión
    const renderNetworkStatus = () => (
        <NetworkStatus
            isOpponent={isOpponent}
            isConnected={isConnected}
            disconnectTimer={disconnectTimer}
            reconnectMessage={reconnectMessage}
            isReconnecting={isReconnecting}
        />
    );

    return (
        <div className={styles.playerZone}>
            {isOpponent ? (
                // Orden Rival: Info -> Cartas -> Banners
                <>
                    {renderInfo()}
                    {renderCards()}
                    {renderNetworkStatus()}
                </>
            ) : (
                // Orden Local: Banners (si los hay) -> Cartas -> Info
                <>
                    {renderNetworkStatus()}
                    {renderCards()}
                    {renderInfo()}
                </>
            )}
        </div>
    );
};