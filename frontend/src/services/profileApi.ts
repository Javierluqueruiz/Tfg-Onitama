import type { ProfileStats } from '../../../shared';
import { getJson, patchJson, deleteJson } from './httpClient';
import type { ChangePasswordRequest, DeleteAccountRequest } from '../../../shared';

export const ProfileApi = {
    getStats(): Promise<ProfileStats> {
        return getJson('/api/profile/me');
    },

    changePassword(data: ChangePasswordRequest): Promise<{message: string}> {
        return patchJson('/api/profile/password', data);
    },

    deleteAccount(data: DeleteAccountRequest): Promise<{message: string}> {
        return deleteJson('/api/profile/me', data);
    },
};