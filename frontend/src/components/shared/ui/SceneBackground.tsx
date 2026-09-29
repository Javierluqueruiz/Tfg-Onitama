import { useEffect, useRef, useState } from 'react';
import type { Scene } from './sceneContext';
import styles from './SceneBackground.module.css';

// Coordenadas de cada escena dentro del lienzo grande (en % de background-position,
// no en píxeles, para que escale igual en cualquier tamaño de pantalla). No tienen
// por qué estar en fila -- es un boceto de un lienzo en dos dimensiones.
const SCENE_FOCUS: Record<Scene, string> = {
    main: '25% 5%',
    private: '100% 85%',
    ai: '20% 60%',
    auth: '25% 5%',
};

// Fondo fijo que persiste entre pantallas: al cambiar de escena, el encuadre se
// desplaza con un desenfoque que se aclara al asentarse (efecto de cámara).
export const SceneBackground: React.FC<{ scene: Scene }> = ({ scene }) => {
    const [isPanning, setIsPanning] = useState(false);
    // Se compara con la escena anterior (y no con un "primer render") para que el
    // doble montaje de StrictMode en desarrollo no dispare un desplazamiento falso.
    const previousScene = useRef(scene);

    useEffect(() => {
        if (previousScene.current === scene) return;
        previousScene.current = scene;
        setIsPanning(true);
        const timer = setTimeout(() => setIsPanning(false), 550);
        return () => clearTimeout(timer);
    }, [scene]);

    return (
        <div className={styles.sceneWorld}>
            <div
                className={`${styles.sceneCanvas} ${isPanning ? styles.sceneCanvasPanning : ''}`}
                style={{ backgroundPosition: SCENE_FOCUS[scene] }}
            />
        </div>
    );
};
