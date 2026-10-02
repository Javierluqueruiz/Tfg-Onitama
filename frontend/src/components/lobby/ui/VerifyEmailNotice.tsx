import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { AuthApi } from '../../../services/authApi';
import styles from './VerifyEmailNotice.module.css';

type ResendStatus = 'idle' | 'sending' | 'sent';

// Aviso bajo la cabecera para las cuentas con el correo sin verificar. Antes era una píldora más de
// la cabecera y en móvil la hacía crecer a tres o cuatro filas.
export const VerifyEmailNotice = () => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const [resendStatus, setResendStatus] = useState<ResendStatus>('idle');

    if (isLoading || !isAuthenticated || !user || user.emailVerified) {
        return null;
    }

    const handleResend = async () => {
        setResendStatus('sending');
        try {
            await AuthApi.resendVerificationEmail();
            setResendStatus('sent');
        } catch {
            setResendStatus('idle');
        }
    };

    return (
        <div className={styles.notice} role="status">
            {resendStatus === 'sent' ? (
                <span>Correo de verificación reenviado</span>
            ) : (
                <>
                    <span>Tu correo no está verificado.</span>
                    <button type="button" className={styles.action} onClick={handleResend} disabled={resendStatus === 'sending'}>
                        {resendStatus === 'sending' ? 'Reenviando...' : 'Reenviar correo de verificación'}
                    </button>
                </>
            )}
        </div>
    );
};