import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Brand } from '../components/lobby/ui/Brand';
import { ScrollPanel } from '../components/shared/ui/ScrollPanel';
import lobbyStyles from '../components/lobby/Lobby.module.css';
import '../components/game/theme.css';

interface AuthLayoutProps {
    children: ReactNode;
}

// El fondo lo pinta SceneLayout; la marca es un Link (no un <a href>) para volver
// al lobby sin recargar la página y que el fondo se desplace en lugar de saltar.
export const AuthLayout = ({ children }: AuthLayoutProps) => {
    return (
        <div className={`${lobbyStyles.wrapper} gameTheme`}>
            <header className={lobbyStyles.header}>
                <Brand />
                <nav className={lobbyStyles.topNav} aria-label="Ayuda">
                    <Link to="/rules" className={lobbyStyles.rulesLink}>📜 Reglas</Link>
                </nav>
            </header>
            <div className={lobbyStyles.content}>
                <div className={lobbyStyles.panelWrap}>
                    <ScrollPanel>{children}</ScrollPanel>
                </div>
            </div>
        </div>
    );
};
