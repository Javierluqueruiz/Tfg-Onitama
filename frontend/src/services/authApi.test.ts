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

    //Sub-08.4
    it('verifyEmail manda el token en la solicitud POST y devuelve el usuario', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: '123', username: 'testuser', emailVerified: true }),
        });

        const result = await AuthApi.verifyEmail('fake-token');

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/auth/verify-email'),
            expect.objectContaining({ method: 'POST', body: JSON.stringify({ token: 'fake-token' }) })
        );
        expect(result).toEqual({ id: '123', username: 'testuser', emailVerified: true });
    });

    it('lanza el mensaje de error del servidor si la respuesta de verifyEmail no es ok', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: 'El enlace de verificación es inválido o ha expirado' }),
        });

        await expect(AuthApi.verifyEmail('invalid-token'))
            .rejects.toThrow('El enlace de verificación es inválido o ha expirado');
    });

    it('resendVerification manda el token de sesión en la cabecera Authorization', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Correo reenviado' }),
        });

        await AuthApi.resendVerificationEmail('session-token');

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/auth/resend-verification'),
            expect.objectContaining({ method: 'POST', headers: { 'Authorization': 'Bearer session-token' } })
        );
    });
    
});