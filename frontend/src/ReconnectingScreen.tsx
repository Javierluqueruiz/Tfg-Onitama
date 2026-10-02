import './components/game/theme.css';
import brandStyles from './components/lobby/ui/Brand.module.css';
import styles from './ReconnectingScreen.module.css';

// El fondo lo pinta SceneLayout; aquí solo una tarjeta con el sello de la marca.
export const ReconnectingScreen = () => {
    return (
        <div className={`${styles.wrapper} gameTheme`} role="status">
            <div className={styles.card}>
                <span className={`${brandStyles.seal} ${styles.seal}`} aria-hidden="true">鬼</span>
                <p className={styles.text}>Reconectando a tu partida...</p>
                <p className={styles.hint}>Un momento, te devolvemos a la mesa.</p>
            </div>
        </div>
    );
};
