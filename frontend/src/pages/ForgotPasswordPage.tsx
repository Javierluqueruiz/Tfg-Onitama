import { useState, type SubmitEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthApi } from '../services/authApi';
import { AuthLayout } from './AuthLayout';
import styles from '../components/shared/ui/FormKit.module.css';
import { BrushInput } from '../components/shared/ui/BrushInput';
import { FormHeader } from '../components/shared/ui/FormHeader';
import { KeyIcon, MailIcon } from '../components/lobby/ui/ModeIcons';

export const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            await AuthApi.forgotPassword({ email });
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
                    <FormHeader icon={<MailIcon />} title="Instrucciones enviadas. Revisa tu correo." />
                    <p className={styles.message}>
                        Si existe una cuenta asociada a ese correo, recibirás un email con instrucciones para restablecer tu contraseña.
                    </p>
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
                <FormHeader icon={<KeyIcon />} title="Restablecer contraseña" hint="Te enviaremos un enlace a tu correo para elegir una nueva." />

                <label className={styles.label}>
                    Correo electrónico
                    <BrushInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                </label>

                {error && <p className={styles.error} role="alert">{error}</p>}

                <div className={styles.actions}>
                    <button type="submit" className={styles.primary} disabled={isSubmitting}>
                        {isSubmitting ? 'Enviando...' : 'Enviar instrucciones'}
                    </button>
                    <Link to="/login" className={styles.ghost}>← Volver a inicio de sesión</Link>
                </div>
            </form>
        </AuthLayout>
    );
};
