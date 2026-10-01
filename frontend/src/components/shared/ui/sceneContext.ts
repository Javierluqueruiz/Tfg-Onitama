import { createContext, useContext } from 'react';

// Encuadres del lienzo de fondo. 'auth' se usa en login, registro, perfil, etc.
export type Scene = 'main' | 'private' | 'ai' | 'auth';

// El lobby decide su propia escena (según la pestaña o pantalla activa) y se la
// comunica al layout, que es quien pinta el fondo. Sin proveedor no hace nada
// (así los componentes se pueden probar sueltos).
export const SceneContext = createContext<(scene: Exclude<Scene, 'auth'>) => void>(() => {});

export const useLobbyScene = () => useContext(SceneContext);
