import { useState, type SubmitEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthApi } from '../services/authApi';
import { AuthLayout } from './AuthLayout';
import styles from '../components/lobby/ui/Forms.module.css';

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
                <h3 className={styles.title}>Instrucciones enviadas. Revisa tu correo.</h3>
                <div className={styles.container}>
                    <p> Si existe una cuenta asociada a ese correo, recibirás un email con instrucciones para restablecer tu contraseña.</p>
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
                    Correo electrónico:
                    <input type="email" className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.buttonGroup}>
                    <Link to="/login" className={styles.btnBack}>Volver a inicio de sesión</Link>
                    <button type="submit" className={` ${styles.btnSubmit} ${styles.btnCreate}`} disabled={isSubmitting}>
                        {isSubmitting ? 'Enviando...' : 'Enviar instrucciones'}
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
};