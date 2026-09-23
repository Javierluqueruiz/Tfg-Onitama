import { AiDifficulty, GameMode, MAX_CHAT_MESSAGE_LENGTH, isAiDifficulty, isGameMode } from "../../../shared";

//Los payloads de los eventos vienen del cliente y no se pueden dar por buenos. Los handlers los reciben
//como `unknown`, así que el compilador solo les deja usarlos después de pasar por una de estas guardas.

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

const isNotEmptyString = (value: unknown): value is string => {
    return typeof value === "string" && value.trim().length > 0;
}

export const isCreateRoomPayload = (data: unknown): data is { hostName: string, mode: GameMode } => {
    return isRecord(data) && isNotEmptyString(data.hostName) && isGameMode(data.mode);
}

export const isJoinRoomPayload = (data: unknown): data is { roomCode: string, guestName: string } => {
    return isRecord(data) && isNotEmptyString(data.roomCode) && isNotEmptyString(data.guestName);
}

export const isJoinQueuePayload = (data: unknown): data is { mode: GameMode } => {
    return isRecord(data) && isGameMode(data.mode);
}

export const isCreateAiRoomPayload = (data: unknown): data is { difficulty: AiDifficulty } => {
    return isRecord(data) && isAiDifficulty(data.difficulty);
}
export const isChatPayload = (data: unknown): data is { message: string } => {
    return isRecord(data) && isNotEmptyString(data.message) && data.message.length <= MAX_CHAT_MESSAGE_LENGTH;
}