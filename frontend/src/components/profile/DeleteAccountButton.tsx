import { useState, type SubmitEvent } from 'react';
import { ProfileApi } from '../../services/profileApi';
import formStyles from '../lobby/ui/Forms.module.css';
import styles from './DeleteAccountButton.module.css';

export const DeleteAccountButton = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

    const handleCancel = () => {
        setIsConfirming(false);
        setUsername('');
        setPassword('');
        setError(null);
    };

    const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsDeleting(true);

        try {
            await ProfileApi.deleteAccount({ username, password });
            window.location.href = '/';
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            setIsDeleting(false);
        }
    };

    return (
        <div className={styles.dangerZone}>
            <h3 className={styles.dangerTitle}>Zona de peligro</h3>
            <p className={styles.dangerText}>Eliminar tu cuenta es una acción permanente. El resultado de tus partidas se conservará en el historial de tus rivales, pero perderás el acceso a tu propio historial y estadísticas.</p>

            {!isConfirming ? (
                <button className={styles.deleteBtn} onClick={() => setIsConfirming(true)}>
                    Eliminar cuenta
                </button>
            ) : (
                <form onSubmit={handleSubmit} className={styles.confirmForm}>
                    <p className={styles.dangerText}>Para confirmar, escribe tu nombre de usuario y tu contraseña:</p>
                    <label className={formStyles.label}>
                        Usuario:
                        <input type="text" className={formStyles.input} value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
                    </label>
                    <label className={formStyles.label}>
                        Contraseña:
                        <input type="password" className={formStyles.input} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                    </label>

                    {error && <p className={formStyles.error}>{error}</p>}

                    <div className={styles.confirmButtons}>
                        <button type="button" className={formStyles.btnBack} onClick={handleCancel} disabled={isDeleting}>
                            Cancelar
                        </button>
                        <button type="submit" className={styles.deleteBtn} disabled={isDeleting}>
                            {isDeleting ? 'Eliminando...' : 'Confirmar eliminación'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}