import { createBrowserRouter } from "react-router-dom";
import { App } from "./App";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ProfilePage } from "./pages/ProfilePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RulesPage } from "./pages/RulesPage";
import { SceneLayout } from "./components/shared/ui/SceneLayout";
import { RankingPage } from "./pages/RankingPage";

// SceneLayout envuelve todas las rutas para que el fondo persista al navegar.
export const router = createBrowserRouter([
    {
        element: <SceneLayout />,
        children: [
            { path: "/", element: <App /> },
            { path: "/login", element: <LoginPage /> },
            { path: "/register", element: <RegisterPage /> },
            { path: "/verify-email", element: <VerifyEmailPage /> },
            { path: "/forgot-password", element: <ForgotPasswordPage /> },
            { path: "/reset-password", element: <ResetPasswordPage /> },
            { path: "/profile", element: <ProfilePage /> },
            { path: "/rules", element: <RulesPage /> },
            { path: "/ranking", element: <RankingPage /> },
            { path: "*", element: <NotFoundPage /> }
        ]
    }
])
