import { Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import styles from '../components/lobby/ui/Forms.module.css';

export const NotFoundPage = () => {
    return (
        <AuthLayout>
            <h3 className={styles.title}>404 — Este camino no existe</h3>
            <div className={styles.container}>
                <p>La página que buscas no existe, o la dirección tiene algún error.</p>
                <Link to="/" className={`${styles.btnSubmit} ${styles.btnCreate}`}>Volver al inicio</Link>
            </div>
        </AuthLayout>
    );
};