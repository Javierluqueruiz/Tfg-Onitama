import { useState, type SubmitEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthLayout } from './AuthLayout';
import styles from '../components/lobby/ui/Forms.module.css';

export const RegisterPage = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await register({ username, email, password });
            navigate('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout>
            <h3 className={styles.title}>Crear cuenta</h3>
            <form onSubmit={handleSubmit} className={styles.container}>
                <label className={styles.label}>
                    Usuario:
                    <input type="text" className={styles.input} value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
                </label>
                <label className={styles.label}>
                    Correo:
                    <input type="email" className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
                <label className={styles.label}>
                    Contraseña:
                    <input type="password" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </label>

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.buttonGroup}>
                    <Link to="/" className={styles.btnBack}>Volver</Link>
                    <button type="submit" className={`${styles.btnSubmit} ${styles.btnCreate}`} disabled={isSubmitting}>
                        {isSubmitting ? 'Creando cuenta...' : 'Registrarse'}
                    </button>
                </div>
            </form>

            <p className={styles.switchLink}>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
        </AuthLayout>
    );
};