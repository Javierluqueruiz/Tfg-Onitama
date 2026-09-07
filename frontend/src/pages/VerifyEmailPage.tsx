import  { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AuthApi } from '../services/authApi';
import { AuthLayout } from './AuthLayout';
import styles from '../components/lobby/ui/Forms.module.css';

type VerifyEmailStatus = 'loading' | 'success' | 'error';

export const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<VerifyEmailStatus>(token ? 'loading' : 'error');
    const [errorMessage, setErrorMessage] = useState<string>(token ? '' : 'Token de verificación no proporcionado.');

    useEffect(() => {
        if (!token) {
            return;
        }

        AuthApi.verifyEmail(token)
            .then(() => setStatus('success'))
            .catch((err) => {
                setStatus('error');
                setErrorMessage(err instanceof Error ? err.message : 'Error desconocido al verificar el correo electrónico.');
            });
    }, [token]);

    return(
        <AuthLayout>
            <h3 className={styles.title}>Verificación de correo electrónico</h3>

            <div className={styles.container}>
                {status === 'loading' && <p>Verificando...</p>}

                {status === 'success' && (
                    <>
                        <p>¡Correo electrónico verificado con éxito!</p>
                        <Link to="/" className={`${styles.btnSubmit} ${styles.btnCreate}`}>Volver a la página principal</Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <p className={styles.error}>{errorMessage}</p>
                        <Link to="/" className={styles.btnBack}>Volver a la página principal</Link>
                    </>
                )}
            </div>
        </AuthLayout>
    );
};