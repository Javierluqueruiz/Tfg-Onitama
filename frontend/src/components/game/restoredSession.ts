import type { ChatMessage } from '../../../../shared';

// Lo que el servidor devuelve al reconectar (Sub-05.2), además del estado de la partida.
// RECONNECT_SUCCESS llega ANTES de que la pantalla de partida exista (es ese mismo evento
// el que la monta), así que sus hooks no llegan a escucharlo tras recargar la página.
// App lo guarda y se lo pasa como valor inicial.
export interface RestoredSession {
    chatHistory: ChatMessage[];
    drawOffered: boolean;
    rematchOffered: boolean;
}
