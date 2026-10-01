import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProfileApi } from './profileApi';
import { jsonResponse } from '../test-utils/mockResponse';

describe('ProfileApi', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('getStats incluye las credenciales en la solicitud', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse({ username: 'testuser', elo: 1000 }));

        const result = await ProfileApi.getStats();

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/profile/me'),
            expect.objectContaining({ credentials: 'include' })
        );
        expect(result).toEqual({ username: 'testuser', elo: 1000 });
    });

    it('changePassword envía los datos correctos y maneja la respuesta', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse({ message: 'Contraseña actualizada con éxito' }));

        await ProfileApi.changePassword({ currentPassword: 'oldpass', newPassword: 'newpass' });

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/profile/password'),
            expect.objectContaining({
                method: 'PATCH',
                credentials: 'include',
                body: JSON.stringify({ currentPassword: 'oldpass', newPassword: 'newpass' }),
            })
        );
    });

    it('lanza un mensaje de error si changePassword falla', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse({ message: 'Error al cambiar la contraseña' }, 400));

        await expect(ProfileApi.changePassword({ currentPassword: 'oldpass', newPassword: 'newpass' }))
            .rejects.toThrow('Error al cambiar la contraseña');
    });

    it('deleteAccount manda un DELETE con el usuario y contraseña', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse({ message: 'Cuenta eliminada con éxito' }));

        await ProfileApi.deleteAccount({ username: 'testuser', password: 'password123' });

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/profile/me'),
            expect.objectContaining({
                method: 'DELETE',
                credentials: 'include',
                body: JSON.stringify({ username: 'testuser', password: 'password123' }),
            })
        );
    });

    it('lanza un mensaje de error si deleteAccount falla', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse({ message: 'Error al eliminar la cuenta' }, 400));
    
        await expect(ProfileApi.deleteAccount({ username: 'testuser', password: 'password123' }))
            .rejects.toThrow('Error al eliminar la cuenta');
    });
});