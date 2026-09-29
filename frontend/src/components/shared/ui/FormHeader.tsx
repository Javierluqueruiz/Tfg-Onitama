import React from 'react';
import styles from './FormKit.module.css';

interface FormHeaderProps {
    icon: React.ReactNode;
    title: string;
    hint?: string;
}

// Cabecera común de los formularios del panel: medallón con icono, título y una línea de ayuda.
export const FormHeader: React.FC<FormHeaderProps> = ({ icon, title, hint }) => (
    <div className={styles.header}>
        <span className={styles.badge} aria-hidden="true">{icon}</span>
        <h3 className={styles.title}>{title}</h3>
        {hint && <p className={styles.hint}>{hint}</p>}
    </div>
);
