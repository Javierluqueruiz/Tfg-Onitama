import  { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AuthApi } from '../services/authApi';
import { useAuth } from '../contexts/AuthContext';
import { AuthLayout } from './AuthLayout';
import styles from '../components/shared/ui/FormKit.module.css';
import { FormHeader } from '../components/shared/ui/FormHeader';
import { MailIcon } from '../components/lobby/ui/ModeIcons';

type VerifyEmailStatus = 'loading' | 'success' | 'error';

export const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<VerifyEmailStatus>(token ? 'loading' : 'error');
    const [errorMessage, setErrorMessage] = useState<string>(token ? '' : 'Token de verificación no proporcionado.');
    const { updateUser, isLoading } = useAuth();

    useEffect(() => {
        if (!token || isLoading) {
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
    }, [token, isLoading]);

    return(
        <AuthLayout>
            <div className={styles.form}>
                <FormHeader icon={<MailIcon />} title="Verificación de correo electrónico" />

                {status === 'loading' && (
                    <p className={styles.waiting} role="status">
                        <span className={styles.pulse} aria-hidden="true"><span /><span /><span /></span>
                        Verificando...
                    </p>
                )}

                {status === 'success' && (
                    <>
                        <p className={styles.message}>¡Correo electrónico verificado con éxito!</p>
                        <div className={styles.actions}>
                            <Link to="/" className={styles.primary}>Volver a la página principal</Link>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <p className={styles.error} role="alert">{errorMessage}</p>
                        <div className={styles.actions}>
                            <Link to="/" className={styles.ghost}>← Volver a la página principal</Link>
                        </div>
                    </>
                )}
            </div>
        </AuthLayout>
    );
};
