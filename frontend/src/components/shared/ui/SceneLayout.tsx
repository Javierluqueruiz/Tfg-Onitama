import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SceneBackground } from './SceneBackground';
import { SceneContext, type Scene } from './sceneContext';
import '../../game/theme.css';

// Layout común a todas las rutas: el fondo vive aquí, no en cada página, para que
// no se destruya al navegar y el cambio de escena (lobby -> login, etc.) se anime.
// En "/" manda la escena que indique el lobby; en el resto de rutas, la de 'auth'.
export const SceneLayout = () => {
    const { pathname } = useLocation();
    const [lobbyScene, setLobbyScene] = useState<Exclude<Scene, 'auth'>>('main');
    const scene: Scene = pathname === '/' ? lobbyScene : 'main';

    return (
        <div className="gameTheme" style={{ position: 'relative', isolation: 'isolate', minHeight: '100vh' }}>
            <SceneBackground scene={scene} />
            <SceneContext.Provider value={setLobbyScene}>
                <Outlet />
            </SceneContext.Provider>
        </div>
    );
};
