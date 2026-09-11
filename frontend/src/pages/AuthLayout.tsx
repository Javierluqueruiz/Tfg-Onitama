import type { ReactNode } from 'react';
import lobbyStyles from '../components/lobby/Lobby.module.css';
import '../components/game/theme.css';

interface AuthLayoutProps {
    children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
    return (
        <div className={`${lobbyStyles.wrapper} gameTheme`}>
            <div className={`${lobbyStyles.scene} ${lobbyStyles.sceneMain} ${lobbyStyles.sceneActive}`} />
            <div className={lobbyStyles.header}>
                <a className={lobbyStyles.mainTitle} href="/">⛩️ ONITAMA</a>
                <p className={lobbyStyles.subTitle}>El Camino del Maestro</p>
            </div>
            <div className={lobbyStyles.content}>
                <div className={lobbyStyles.statusContainer}>
                    {children}
                </div>
            </div>
        </div>
    );
};