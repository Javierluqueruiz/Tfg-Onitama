import  { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AuthApi } from '../services/authApi';
import { useAuth } from '../contexts/AuthContext';
import { AuthLayout } from './AuthLayout';
import styles from '../components/lobby/ui/Forms.module.css';

type VerifyEmailStatus = 'loading' | 'success' | 'error';

export const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<VerifyEmailStatus>(token ? 'loading' : 'error');
    const [errorMessage, setErrorMessage] = useState<string>(token ? '' : 'Token de verificación no proporcionado.');
    const { updateUser } = useAuth();

    useEffect(() => {
        if (!token) {
            return;
        }

        AuthApi.verifyEmail(token)
            .then((verifiedUser) => {
                // El backend ya devuelve al usuario con emailVerified: true --
                // sin esto, AuthContext se queda con la instantánea de /me que
                // pidió al arrancar la aplicación, y AuthStatus seguiría
                // mostrando el aviso de correo sin verificar hasta recargar.
                updateUser(verifiedUser);
                setStatus('success');
            })
            .catch((err) => {
                setStatus('error');
                setErrorMessage(err instanceof Error ? err.message : 'Error desconocido al verificar el correo electrónico.');
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
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