import { describe, it, expect, vi, beforeEach } from "vitest";
import { useEffect } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RegisterPage } from "./RegisterPage";
import { useAuth } from "../contexts/AuthContext";

vi.mock("../contexts/AuthContext");

// No hay window.turnstile real en el entorno de test -- se simula que el
// captcha ya se resolvió, para poder probar el envío del formulario en sí.
vi.mock("../components/TurnstileWidget", () => ({
    TurnstileWidget: ({ onVerify }: { onVerify: (token: string) => void }) => {
        useEffect(() => {
            onVerify("fake-captcha-token");
        }, [onVerify]);
        return null;
    },
}));

function mockUseAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
    vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        ...overrides,
    });
}

describe("RegisterPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("llama a register con los datos correctos", async () => {
        const register = vi.fn().mockResolvedValue(undefined);
        mockUseAuth({ register });

        render(<MemoryRouter><RegisterPage /></MemoryRouter>);
        fireEvent.change(screen.getByLabelText(/usuario/i), { target: { value: "testuser" } });
        fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: "testuser@example.com" } });
        fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: "password" } });
        fireEvent.click(screen.getByRole("button", { name: /Registrarse/i }));

        await waitFor(() => expect(register).toHaveBeenCalledWith({ username: "testuser", email: "testuser@example.com", password: "password", captchaToken: "fake-captcha-token" }));
    });

    it('muestra la confirmación con el correo de destino tras un registro exitoso', async () => {
        mockUseAuth({ register: vi.fn().mockResolvedValue(undefined) });

        render(<MemoryRouter><RegisterPage /></MemoryRouter>);
        fireEvent.change(screen.getByLabelText(/usuario/i), { target: { value: "testuser" } });
        fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: "testuser@example.com" } });
        fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: "password" } });
        fireEvent.click(screen.getByRole("button", { name: /Registrarse/i }));

        expect(await screen.findByText(/testuser@example\.com/)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /continuar/i })).toHaveAttribute('href', '/');
    });

    it('muestra un mensaje de error si el registro falla', async () => {
        mockUseAuth({ register: vi.fn().mockRejectedValue(new Error("El nombre de usuario o el correo ya está en uso.")) });

        render(<MemoryRouter><RegisterPage /></MemoryRouter>);
        fireEvent.change(screen.getByLabelText(/usuario/i), { target: { value: "testuser" } });
        fireEvent.change(screen.getByLabelText(/correo/i), { target: { value: "testuser@example.com" } });
        fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: "password" } });
        fireEvent.click(screen.getByRole("button", { name: /Registrarse/i }));

        expect(await screen.findByText(/El nombre de usuario o el correo ya está en uso./i)).toBeInTheDocument();
    });
});