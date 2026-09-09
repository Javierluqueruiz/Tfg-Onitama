import { useState, type SubmitEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthApi } from '../services/authApi';
import { AuthLayout } from './AuthLayout';
import styles from '../components/lobby/ui/Forms.module.css';

export const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (!token) {
            setError('Token de restablecimiento de contraseña no proporcionado');
            return;
        }

        setIsSubmitting(true);
        try {
            await AuthApi.resetPassword({ token, newPassword });
            setSubmitted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <AuthLayout>
                <h3 className={styles.title}>Contraseña actualizada con éxito</h3>
                <div className={styles.container}>
                    <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>
                    <Link to="/login" className={` ${styles.btnSubmit} ${styles.btnCreate}`}>Volver al inicio de sesión</Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <h3 className={styles.title}>Restablecer contraseña</h3>
            <form onSubmit={handleSubmit} className={styles.container}>
                <label className={styles.label}>
                    Nueva contraseña:
                    <input type="password" className={styles.input} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
                </label>
                <label className={styles.label}>
                    Confirmar nueva contraseña:
                    <input type="password" className={styles.input} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
                </label>

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.buttonGroup}>
                    <Link to="/login" className={styles.btnBack}>Volver a inicio de sesión</Link>
                    <button type="submit" className={` ${styles.btnSubmit} ${styles.btnCreate}`} disabled={isSubmitting}>
                        {isSubmitting ? 'Restableciendo...' : 'Restablecer contraseña'}
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
};
