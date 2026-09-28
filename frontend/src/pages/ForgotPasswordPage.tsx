import { useState, type SubmitEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthApi } from '../services/authApi';
import { AuthLayout } from './AuthLayout';
import styles from '../components/lobby/ui/Forms.module.css';
import btnStyles from '../components/shared/ui/Button.module.css';
import fieldStyles from "../components/shared/ui/Input.module.css"; 

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
                    <Link to="/login" className={` ${styles.btnSubmit} ${styles.btnCreate} ${btnStyles.btnCarved}`}>
                        <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
                        Volver al inicio de sesión
                    </Link>
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
                    <div className={fieldStyles.fieldWrap}>
                        <input type="email" className={`${fieldStyles.field} ${fieldStyles.fieldBrush}`} value={email} onChange={(e) => setEmail(e.target.value)} required />
                        <svg className={fieldStyles.brush} viewBox="0 0 320 10" preserveAspectRatio="none" aria-hidden="true">
                            <path d="M2 6 C8 2,22 1,36 3 C58 6,80 7,102 4 C130 1,158 2,186 5 C214 8,242 7,266 4 C284 1,304 1,316 4 C304 8,282 9,258 8 C230 6,202 9,174 7 C146 5,116 8,88 8 C58 7,28 9,10 8 C4 7,2 7,2 6 Z"/>
                        </svg>
                    </div>
                </label>

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.buttonGroup}>
                    <Link to="/login" className={`${styles.btnBack} ${btnStyles.btnCarved}`}>
                        <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
                        Volver a inicio de sesión
                    </Link>
                    <button type="submit" className={` ${styles.btnSubmit} ${styles.btnCreate} ${btnStyles.btnCarved}`} disabled={isSubmitting}>
                        <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
                        {isSubmitting ? 'Enviando...' : 'Enviar instrucciones'}
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
};