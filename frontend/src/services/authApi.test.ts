import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthApi } from "./authApi";

describe("AuthApi", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('login manda una solicitud POST con los datos y devuelve el token', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: 'fake-token', user: { id: '123', username: 'testuser' } }),
        });

        const result = await AuthApi.login({ username: 'testuser', password: 'password' });

        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/login'), expect.objectContaining({ method: 'POST' }));
        expect(result).toEqual({ token: 'fake-token', user: { id: '123', username: 'testuser' } });
    });

    it('lanza el mensaje de error del servidor si la respuesta no es ok', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: 'Nombre de usuario o contraseña incorrectos' }),
        });
        
        await expect(AuthApi.login({ username: 'wronguser', password: 'wrongpassword' }))
            .rejects.toThrow('Nombre de usuario o contraseña incorrectos');
    });

    it('lanza un error de red si fetch falla', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Failed to fetch'));

        await expect(AuthApi.login({ username: 'testuser', password: 'password' }))
            .rejects.toThrow('Error de red. No se pudo conectar con el servidor.');
    });

    it('me manda el token en la cabecera Authorization', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: '123', username: 'testuser' }),
        });

        await AuthApi.me('fake-token');

        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/me'), expect.objectContaining({ headers: { 'Authorization': 'Bearer fake-token' } }));
    });
});