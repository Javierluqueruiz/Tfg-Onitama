import type { MatchResult } from './domain.types';

export interface LastMatchEntry {
    opponentName: string;
    result: MatchResult;
    eloChange: number;
    date: string;
}

export interface ProfileStats {
    id: string;
    username: string;
    emailVerified: boolean;
    elo: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    lastMatches: LastMatchEntry[];
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}