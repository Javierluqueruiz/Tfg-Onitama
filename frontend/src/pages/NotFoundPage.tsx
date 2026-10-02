import { Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import styles from '../components/shared/ui/FormKit.module.css';
import { FormHeader } from '../components/shared/ui/FormHeader';
import { ToriiIcon } from '../components/lobby/ui/ModeIcons';

export const NotFoundPage = () => {
    return (
        <AuthLayout>
            <div className={styles.form}>
                <FormHeader icon={<ToriiIcon />} title="404 — Este camino no existe" />
                <p className={styles.message}>La página que buscas no existe, o la dirección tiene algún error.</p>
                <div className={styles.actions}>
                    <Link to="/" className={styles.primary}>Volver al inicio</Link>
                </div>
            </div>
        </AuthLayout>
    );
};
