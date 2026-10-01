import { useState, type SubmitEvent } from 'react';
import { ProfileApi } from '../../services/profileApi';
import styles from '../shared/ui/FormKit.module.css';
import { BrushInput } from '../shared/ui/BrushInput';

export const ChangePasswordForm = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        try {
            await ProfileApi.changePassword({ currentPassword, newPassword });
            setSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.label}>
                Contraseña actual
                <BrushInput type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required />
            </label>
            <label className={styles.label}>
                Nueva contraseña
                <BrushInput type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required minLength={8} />
            </label>
            <label className={styles.label}>
                Confirmar contraseña
                <BrushInput type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required minLength={8} />
            </label>

            {error && <p className={styles.error} role="alert">{error}</p>}
            {success && <p className={styles.success} role="status">Contraseña actualizada con éxito</p>}

            <div className={styles.actions}>
                <button type="submit" className={styles.primary} disabled={loading}>
                    {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
            </div>
        </form>
    );
};
