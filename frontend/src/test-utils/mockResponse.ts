// Respuestas de fetch para los tests de servicios. httpClient lee el cuerpo con
// response.text() y mira el content-type, así que un objeto suelto con solo
// `json()` ya no vale: se usa una Response real (Node y jsdom la incluyen).

export function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
    });
}

export function textResponse(body: string, status = 200, contentType = 'text/html'): Response {
    return new Response(body, {
        status,
        headers: { 'content-type': contentType },
    });
}
