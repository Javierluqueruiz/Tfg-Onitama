import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getJson } from './httpClient';
import { jsonResponse, textResponse } from '../test-utils/mockResponse';

describe('httpClient', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('devuelve el cuerpo JSON de una respuesta correcta', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse({ ok: 1 }));

        await expect(getJson('/api/x')).resolves.toEqual({ ok: 1 });
    });

    it('usa el mensaje del servidor cuando responde un error en JSON', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(jsonResponse({ message: 'Credenciales inválidas' }, 401));

        await expect(getJson('/api/x')).rejects.toThrow('Credenciales inválidas');
    });

    it('da un error genérico si el servidor falla con una página que no es JSON (p. ej. un 502 del proxy)', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(textResponse('<html>Bad Gateway</html>', 502));

        await expect(getJson('/api/x')).rejects.toThrow('Error en la solicitud. Inténtalo de nuevo más tarde.');
    });

    it('rechaza una respuesta correcta sin cuerpo JSON', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(textResponse('', 200));

        await expect(getJson('/api/x')).rejects.toThrow('Respuesta inesperada del servidor.');
    });

    it('da un error de red si fetch falla', async () => {
        (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Failed to fetch'));

        await expect(getJson('/api/x')).rejects.toThrow('Error de red. No se pudo conectar con el servidor.');
    });
});
