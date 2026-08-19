import React from 'react';
import styles from './MainMenu.module.css';

interface MainMenuProps {
    onSelectCreate: () => void;
    onSelectJoin: () => void;
    isConnected: boolean;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onSelectCreate, onSelectJoin, isConnected }) => {
    const statusClass = isConnected ? styles.connected : styles.disconnected;
    return (
        <div className={styles.container}>
            <button 
                className={`${styles.btn} ${styles.btnCreate} ${statusClass}`}
                onClick={onSelectCreate}
                disabled={!isConnected}
            >
                Crear Sala
            </button>

            <button
                className={`${styles.btn} ${styles.btnJoin} ${statusClass}`}
                onClick={onSelectJoin}
                disabled={!isConnected}
            >
                Unirse a Sala
            </button>
        </div>
    );
};