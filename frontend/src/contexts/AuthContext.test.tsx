import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { AuthApi } from "../services/authApi";

vi.mock('../services/authApi');

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>

describe("AuthContext", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('empieza como invitado si no hay token guardado', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('login guarda el token en localStorage y actualiza el estado', async () => {
        vi.mocked(AuthApi.login).mockResolvedValueOnce({ token: 'fake-token', user: { id: '123', username: 'testuser', emailVerified: false } });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.login({ username: 'testuser', password: 'password' });
        });

        expect(localStorage.getItem('onitama_token')).toBe('fake-token');
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual({ id: '123', username: 'testuser', emailVerified: false });
    });

    it('logout elimina el token de localStorage y actualiza el estado', async () => {
        vi.mocked(AuthApi.login).mockResolvedValueOnce({ token: 'fake-token', user: { id: '123', username: 'testuser', emailVerified: false } });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        await act(async () => {
            await result.current.login({ username: 'testuser', password: 'password' });
        });

        act(() => {
            result.current.logout();
        });

        expect(localStorage.getItem('onitama_token')).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
    });

    it('restaura el estado del usuario si hay un token guardado', async () => {
        localStorage.setItem('onitama_token', 'fake-token');
        vi.mocked(AuthApi.me).mockResolvedValueOnce({ id: '123', username: 'testuser', emailVerified: false });

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual({ id: '123', username: 'testuser', emailVerified: false });
    });

    it('borra el token guardado si ya no es válido', async () => {
        localStorage.setItem('onitama_token', 'fake-token');
        vi.mocked(AuthApi.me).mockRejectedValueOnce(new Error('Token inválido'));

        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(localStorage.getItem('onitama_token')).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('register crea la cuenta y luego inicia sesión automáticamente', async () => {
        vi.mocked(AuthApi.register).mockResolvedValue({ id: '1', username: 'newuser', emailVerified: false });
        vi.mocked(AuthApi.login).mockResolvedValueOnce({ token: 'new-token', user: { id: '1', username: 'newuser', emailVerified: false } });

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.register({ username: 'newuser', email: 'newuser@example.com', password: 'password' });
        });

        expect(AuthApi.register).toHaveBeenCalledWith({ username: 'newuser', email: 'newuser@example.com', password: 'password' });
        expect(AuthApi.login).toHaveBeenCalledWith({ username: 'newuser', password: 'password' });
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual({ id: '1', username: 'newuser', emailVerified: false });
        expect(localStorage.getItem('onitama_token')).toBe('new-token');
    });

    it('si AuthApi.register falla, no inicia sesión y lanza el error', async () => {
        vi.mocked(AuthApi.register).mockRejectedValueOnce(new Error('El nombre de usuario o el correo ya está en uso.'));

        const { result } = renderHook(() => useAuth(), { wrapper });
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await expect(
            act(async () => {
                await result.current.register({ username: 'existinguser', email: 'existinguser@example.com', password: 'password' });
            })
        ).rejects.toThrow('El nombre de usuario o el correo ya está en uso.');

        expect(AuthApi.login).not.toHaveBeenCalled();
        expect(result.current.isAuthenticated).toBe(false);
    });
});