import { useAuth } from "../contexts/AuthContext";
import { useState, type SubmitEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "../components/lobby/ui/Forms.module.css";
import { AuthLayout } from "./AuthLayout";

export const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try{
            await login({ username, password });
            navigate("/");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout>
            <h3 className={styles.title}>Iniciar sesión</h3>
            <form onSubmit ={handleSubmit} className={styles.container}>
                <label className={styles.label}>
                    Usuario:
                    <input 
                        type="text"
                        className={styles.input}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </label>
                <label className={styles.label}>
                    Contraseña:
                    <input
                        type="password"
                        className={styles.input}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </label>

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.buttonGroup}>
                    <Link to="/" className={styles.btnBack}>Volver</Link>
                    <button type="submit" className={`${styles.btnSubmit} ${styles.btnCreate}`} disabled={isSubmitting}>
                        {isSubmitting ? "Entrando..." : "Iniciar sesión"}
                    </button>
                </div>
            </form>

            <p>¿No tienes cuenta? <Link to="/register" className={styles.btnRegister}>Regístrate</Link></p>
        </AuthLayout>
        
    )
}