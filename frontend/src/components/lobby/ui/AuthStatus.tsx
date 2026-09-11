import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { AuthApi } from "../../../services/authApi";
import styles from "../Lobby.module.css";

export const AuthStatus = () => {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    if (isLoading) {
        return null;
    }

    if (isAuthenticated && user) {
        const handleResend = async () => {
            setResendStatus('sending');
            try {
                await AuthApi.resendVerificationEmail();
                setResendStatus('sent');
            } catch {
                setResendStatus('idle');
            }
        };

        return (
            <div className={styles.authStatus}>
                <span className={styles.authUser}> {user.username} </span>
                {!user.emailVerified && (
                    resendStatus === 'sent' ? (
                        <span className={styles.authGuest}>Correo de verificación reenviado</span>
                    ) : (
                        <button className={styles.authLink} onClick={handleResend} disabled={resendStatus === 'sending'}>
                            {resendStatus === 'sending' ? 'Reenviando...' : 'Reenviar correo de verificación'}
                        </button>
                    )
                )}
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
    );
};