import { Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import styles from "../Lobby.module.css";

export const AuthStatus = () => {
    const { user, isAuthenticated, logout } = useAuth();

    if (isAuthenticated && user) {
        return (
            <div className={styles.authStatus}>
                <span className={styles.authUser}> {user.username} </span>
                <button className={styles.authLink} onClick={logout}>Cerrar sesión</button>
            </div>
        );
    }

    return (
        <div className={styles.authStatus}>
            <span className={styles.authGuest}>Jugando como invitado</span>
            <Link to="/login" className={styles.authLink}>Iniciar sesión</Link>
            <Link to="/register" className={styles.authLink}>Registrarse</Link>
        </div>
    )
}