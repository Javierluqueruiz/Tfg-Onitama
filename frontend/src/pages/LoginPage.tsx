import { useAuth } from "../contexts/AuthContext";
import { useState, type SubmitEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "../components/shared/ui/FormKit.module.css";
import { BrushInput } from "../components/shared/ui/BrushInput";
import { FormHeader } from "../components/shared/ui/FormHeader";
import { KeyIcon } from "../components/lobby/ui/ModeIcons";
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
            <form onSubmit={handleSubmit} className={styles.form}>
                <FormHeader icon={<KeyIcon />} title="Iniciar sesión" hint="Entra con tu cuenta para guardar tu ELO y tu historial de partidas." />

                <label className={styles.label}>
                    Usuario
                    <BrushInput
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        required
                    />
                </label>
                <label className={styles.label}>
                    Contraseña
                    <BrushInput
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />
                </label>

                <p className={styles.linkRow}>
                    <Link to="/forgot-password" className={styles.link}>¿Olvidaste tu contraseña?</Link>
                </p>

                <TurnstileWidget key={captchaKey} onVerify={setCaptchaToken} />

                {error && <p className={styles.error} role="alert">{error}</p>}

                <div className={styles.actions}>
                    <button type="submit" className={styles.primary} disabled={isSubmitting}>
                        {isSubmitting ? "Entrando..." : "Iniciar sesión"}
                    </button>
                    <Link to="/" className={styles.ghost}>← Volver</Link>
                </div>

                <p className={styles.switchText}>
                    ¿No tienes cuenta? <Link to="/register" className={styles.link}>Regístrate</Link>
                </p>
            </form>
        </AuthLayout>
    )
}
