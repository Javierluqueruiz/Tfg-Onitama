import { useState, type SubmitEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthLayout } from './AuthLayout';
import styles from '../components/shared/ui/FormKit.module.css';
import { BrushInput } from '../components/shared/ui/BrushInput';
import { FormHeader } from '../components/shared/ui/FormHeader';
import { MailIcon, ToriiIcon } from '../components/lobby/ui/ModeIcons';
import { TurnstileWidget } from '../components/TurnstileWidget';

export const RegisterPage = () => {
    const { register } = useAuth();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [captchaKey, setCaptchaKey] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

    const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        if (!captchaToken) {
            setError("Por favor, completa la verificación de seguridad.");
            setIsSubmitting(false);
            return;
        }

        try {
            await register({ username, email, password, captchaToken });
            setRegisteredEmail(email);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            setCaptchaToken(null);
            setCaptchaKey(prevKey => prevKey + 1);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (registeredEmail) {
        return (
            <AuthLayout>
                <div className={styles.form}>
                    <FormHeader icon={<MailIcon />} title="¡Cuenta creada!" />
                    <p className={styles.message}>
                        Te hemos enviado un correo de verificación a <strong>{registeredEmail}</strong>.
                        Revisa tu bandeja de entrada (y la carpeta de spam) para confirmar tu cuenta.
                    </p>
                    <div className={styles.actions}>
                        <Link to="/" className={styles.primary}>Continuar</Link>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <form onSubmit={handleSubmit} className={styles.form}>
                <FormHeader icon={<ToriiIcon />} title="Crear cuenta" hint="Guarda tu progreso y compite con tu ELO." />

                <label className={styles.label}>
                    Usuario
                    <BrushInput type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required minLength={3} />
                </label>
                <label className={styles.label}>
                    Correo
                    <BrushInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                </label>
                <label className={styles.label}>
                    Contraseña
                    <BrushInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required minLength={8} />
                </label>

                <TurnstileWidget key={captchaKey} onVerify={setCaptchaToken} />

                {error && <p className={styles.error} role="alert">{error}</p>}

                <div className={styles.actions}>
                    <button type="submit" className={styles.primary} disabled={isSubmitting}>
                        {isSubmitting ? 'Creando cuenta...' : 'Registrarse'}
                    </button>
                    <Link to="/" className={styles.ghost}>← Volver</Link>
                </div>

                <p className={styles.switchText}>
                    ¿Ya tienes cuenta? <Link to="/login" className={styles.link}>Inicia sesión</Link>
                </p>
            </form>
        </AuthLayout>
    );
};
