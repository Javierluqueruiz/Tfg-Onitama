import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RegisterPage } from "./RegisterPage";
import { useAuth } from "../contexts/AuthContext";

vi.mock("../contexts/AuthContext");

function mockUseAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
    vi.mocked(useAuth).mockReturnValue({
        user: null,
        token: null,
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

        await waitFor(() => expect(register).toHaveBeenCalledWith({ username: "testuser", email: "testuser@example.com", password: "password" }));
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