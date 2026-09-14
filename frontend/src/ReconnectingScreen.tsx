import './components/game/theme.css';
import styles from './ReconnectingScreen.module.css';

export const ReconnectingScreen = () => {
    return (
        <div className={`${styles.wrapper} gameTheme`}>
            <span className={styles.torii}>⛩️</span>
            <p className={styles.text}>Reconectando a tu partida...</p>
        </div>
    );
};