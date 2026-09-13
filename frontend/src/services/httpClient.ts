const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request<TResponse>(path: string, init: RequestInit): Promise<TResponse> {
    let response: Response;

    try {
        response = await fetch(`${API_URL}${path}`, init);
    } catch {
       throw new Error('Error de red. No se pudo conectar con el servidor.');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Error en la solicitud');
    }
    
    return data as TResponse;
}

function withBody(method: string, body?: unknown): RequestInit {
    return {
        method, 
        credentials: 'include',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    };
}

export function getJson<TResponse>(path: string): Promise<TResponse> {
    return request(path, { credentials: 'include'});
}

export function postJson<TResponse>(path: string, body?: unknown): Promise<TResponse> {
    return request(path, withBody('POST', body));
}

export function patchJson<TResponse>(path: string, body?: unknown): Promise<TResponse> {
    return request(path, withBody('PATCH', body));
}

export function deleteJson<TResponse>(path: string, body?: unknown): Promise<TResponse> {
    return request(path, withBody('DELETE', body));
}