import { Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import styles from "../Lobby.module.css";

export const AuthStatus = () => {
    const { user, isAuthenticated, isLoading, logout } = useAuth();

    if (isLoading) {
        return null;
    }

    if (isAuthenticated && user) {
        return (
            <div className={styles.authStatus}>
                <Link to="/profile" className={styles.authUser}> {user.username} </Link>
                <button className={styles.authLink} onClick={logout}>Cerrar sesión</button>
            </div>
        );
    }

    return (
        <div className={styles.authStatus}>
            <Link to="/login" className={styles.authLink}>Iniciar sesión</Link>
            <Link to="/register" className={styles.authCta}>Registrarse</Link>
        </div>
    );
};