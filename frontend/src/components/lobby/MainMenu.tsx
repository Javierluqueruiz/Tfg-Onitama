import React from 'react';
import styles from './MainMenu.module.css';

interface MainMenuProps {
    onSelectCreate: () => void;
    onSelectJoin: () => void;
    isCOnnected: boolean;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onSelectCreate, onSelectJoin, isCOnnected }) => {
    const statusClass = isCOnnected ? styles.connected : styles.disconnected;
    return (
        <div className={styles.container}>
            <button 
                className={`${styles.btn} ${styles.btnCreate} ${statusClass}`}
                onClick={onSelectCreate}
                disabled={!isCOnnected}
            >
                Crear Sala
            </button>

            <button
                className={`${styles.btn} ${styles.btnJoin} ${statusClass}`}
                onClick={onSelectJoin}
                disabled={!isCOnnected}
            >
                Unirse a Sala
            </button>
        </div>
    );
};