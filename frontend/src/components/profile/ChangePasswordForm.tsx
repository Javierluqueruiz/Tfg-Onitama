import { useState, type SubmitEvent } from 'react';
import { ProfileApi } from '../../services/profileApi';
import formStyles from '../lobby/ui/Forms.module.css';

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
        <form onSubmit={handleSubmit} className={formStyles.container}>
            <label className={formStyles.label}>
                Contraseña actual:
                <input type="password" className={formStyles.input} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </label>
            <label className={formStyles.label}>
                Nueva contraseña:
                <input type="password" className={formStyles.input} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
            </label>
            <label className={formStyles.label}>
                Confirmar contraseña:
                <input type="password" className={formStyles.input} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
            </label>

            {error && <p className={formStyles.error}>{error}</p>}
            {success && <p className={formStyles.success}>Contraseña actualizada con éxito</p>}

            <button type="submit" className={`${formStyles.btnSubmit} ${formStyles.btnCreate}`} disabled={loading}>
                {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
        </form>
    );
};