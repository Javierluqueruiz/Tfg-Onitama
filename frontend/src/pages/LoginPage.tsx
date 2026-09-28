import { useAuth } from "../contexts/AuthContext";
import { useState, type SubmitEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "../components/lobby/ui/Forms.module.css";
import btnStyles from "../components/shared/ui/Button.module.css";
import fieldStyles from "../components/shared/ui/Input.module.css";
import { AuthLayout } from "./AuthLayout";
import { TurnstileWidget } from "../components/TurnstileWidget";

export const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [captchaKey, setCaptchaKey] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (!captchaToken) {
            setError("Por favor, completa la verificación de seguridad.");
            return;
        }

        setIsSubmitting(true);

        try{
            await login({ username, password, captchaToken });
            navigate("/");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
            setCaptchaToken(null);
            setCaptchaKey(prevKey => prevKey + 1);
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
                    <div className={fieldStyles.fieldWrap}>
                        <input
                            type="text"
                            className={`${fieldStyles.field} ${fieldStyles.fieldBrush}`}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <svg className={fieldStyles.brush} viewBox="0 0 320 10" preserveAspectRatio="none" aria-hidden="true">
                            <path d="M2 6 C8 2,22 1,36 3 C58 6,80 7,102 4 C130 1,158 2,186 5 C214 8,242 7,266 4 C284 1,304 1,316 4 C304 8,282 9,258 8 C230 6,202 9,174 7 C146 5,116 8,88 8 C58 7,28 9,10 8 C4 7,2 7,2 6 Z"/>
                        </svg>
                    </div>
                </label>
                <label className={styles.label}>
                    Contraseña:
                    <div className={fieldStyles.fieldWrap}>
                        <input 
                        type="password"
                        className={`${fieldStyles.field} ${fieldStyles.fieldBrush}`}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        />
                        <svg className={fieldStyles.brush} viewBox="0 0 320 10" preserveAspectRatio="none" aria-hidden="true">
                            <path d="M2 6 C8 2,22 1,36 3 C58 6,80 7,102 4 C130 1,158 2,186 5 C214 8,242 7,266 4 C284 1,304 1,316 4 C304 8,282 9,258 8 C230 6,202 9,174 7 C146 5,116 8,88 8 C58 7,28 9,10 8 C4 7,2 7,2 6 Z"/>
                        </svg>
                    </div>
                </label>

                <TurnstileWidget key={captchaKey} onVerify={setCaptchaToken} />

                <p className={styles.switchLink}><Link to="/forgot-password">¿Olvidaste tu contraseña?</Link></p>

                {error && <p className={styles.error}>{error}</p>}

                <div className={styles.buttonGroup}>
                    <Link to="/" className={styles.btnBack}>Volver</Link>
                    <button type="submit" className={`${styles.btnSubmit} ${styles.btnCreate} ${btnStyles.btnCarved}`} disabled={isSubmitting}>
                        <span className={btnStyles.rivets}><span/><span/><span/><span/></span>
                        {isSubmitting ? "Entrando..." : "Iniciar sesión"}
                    </button>
                </div>
            </form>

            <p>¿No tienes cuenta? <Link to="/register" className={styles.btnRegister}>Regístrate</Link></p>
        </AuthLayout>
        
    )
}