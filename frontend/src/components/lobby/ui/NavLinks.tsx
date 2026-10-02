import { NavLink } from 'react-router-dom';
import styles from '../Lobby.module.css';

const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.rulesLink} ${isActive ? styles.navActive : ''}`;;

export const NavLinks = () => (
    <>
        <NavLink to="/rules" className={linkClass}><span className={styles.navEmoji}>📜 </span>Reglas</NavLink>
        <NavLink to="/ranking" className={linkClass}><span className={styles.navEmoji}>🏆 </span>Clasificación</NavLink>
    </>
);