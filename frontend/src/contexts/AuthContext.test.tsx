import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { AuthApi } from "../services/authApi";

vi.mock('../services/authApi');

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>

describe("AuthContext", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Por defecto, sin sesión activa -- cada test que sí la necesite lo sobreescribe.
        vi.mocked(AuthApi.me).mockRejectedValue(new Error('No autenticado'));
    });

    it('empieza como invitado si no hay sesión activa', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('login actualiza el estado con el usuario devuelto', async () => {
        vi.mocked(AuthApi.login).mockResolvedValueOnce({ user: { id: '123', username: 'testuser', emailVerified: false } });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.login({ username: 'testuser', password: 'password', captchaToken: 'fake-captcha-token' });
        });

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual({ id: '123', username: 'testuser', emailVerified: false });
    });

    it('logout llama a AuthApi.logout y limpia el estado', async () => {
        vi.mocked(AuthApi.login).mockResolvedValueOnce({ user: { id: '123', username: 'testuser', emailVerified: false } });
        vi.mocked(AuthApi.logout).mockResolvedValue({ message: 'ok' });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        await act(async () => {
            await result.current.login({ username: 'testuser', password: 'password', captchaToken: 'fake-captcha-token' });
        });

        await act(async () => {
            await result.current.logout();
        });

        expect(AuthApi.logout).toHaveBeenCalledOnce();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
    });

    it('restaura el usuario si /me responde con éxito al arrancar', async () => {
        vi.mocked(AuthApi.me).mockResolvedValueOnce({ id: '123', username: 'testuser', emailVerified: false });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual({ id: '123', username: 'testuser', emailVerified: false });
    });

    it('se queda como invitado si /me falla al arrancar', async () => {
        vi.mocked(AuthApi.me).mockRejectedValueOnce(new Error('Token inválido'));

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('register crea la cuenta y actualiza el estado con el usuario devuelto, sin un login aparte', async () => {
        vi.mocked(AuthApi.register).mockResolvedValue({ id: '1', username: 'newuser', emailVerified: false });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.register({ username: 'newuser', email: 'newuser@example.com', password: 'password', captchaToken: 'fake-captcha-token' });
        });

        expect(AuthApi.register).toHaveBeenCalledWith({ username: 'newuser', email: 'newuser@example.com', password: 'password', captchaToken: 'fake-captcha-token' });
        // /register ya deja la sesión iniciada por su cuenta -- un login aparte
        // reutilizaría un token de Turnstile ya gastado, así que no debe llamarse.
        expect(AuthApi.login).not.toHaveBeenCalled();
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual({ id: '1', username: 'newuser', emailVerified: false });
    });

    it('si AuthApi.register falla, no inicia sesión y lanza el error', async () => {
        vi.mocked(AuthApi.register).mockRejectedValueOnce(new Error('El nombre de usuario o el correo ya está en uso.'));

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await expect(
            act(async () => {
                await result.current.register({ username: 'existinguser', email: 'existinguser@example.com', password: 'password', captchaToken: 'fake-captcha-token' });
            })
        ).rejects.toThrow('El nombre de usuario o el correo ya está en uso.');

        expect(AuthApi.login).not.toHaveBeenCalled();
        expect(result.current.isAuthenticated).toBe(false);
    });
});
