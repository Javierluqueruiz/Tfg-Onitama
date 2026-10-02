import { useState, type SubmitEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthApi } from '../services/authApi';
import { AuthLayout } from './AuthLayout';
import styles from '../components/shared/ui/FormKit.module.css';
import { BrushInput } from '../components/shared/ui/BrushInput';
import { FormHeader } from '../components/shared/ui/FormHeader';
import { KeyIcon } from '../components/lobby/ui/ModeIcons';

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
                <div className={styles.form}>
                    <FormHeader icon={<KeyIcon />} title="Contraseña actualizada con éxito" />
                    <p className={styles.message}>Ya puedes iniciar sesión con tu nueva contraseña.</p>
                    <div className={styles.actions}>
                        <Link to="/login" className={styles.primary}>Volver al inicio de sesión</Link>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <form onSubmit={handleSubmit} className={styles.form}>
                <FormHeader icon={<KeyIcon />} title="Restablecer contraseña" hint="Elige una contraseña nueva de al menos 8 caracteres." />

                <label className={styles.label}>
                    Nueva contraseña
                    <BrushInput type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required minLength={8} />
                </label>
                <label className={styles.label}>
                    Confirmar nueva contraseña
                    <BrushInput type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required minLength={8} />
                </label>

                {error && <p className={styles.error} role="alert">{error}</p>}

                <div className={styles.actions}>
                    <button type="submit" className={styles.primary} disabled={isSubmitting}>
                        {isSubmitting ? 'Restableciendo...' : 'Restablecer contraseña'}
                    </button>
                    <Link to="/login" className={styles.ghost}>← Volver a inicio de sesión</Link>
                </div>
            </form>
        </AuthLayout>
    );
};
