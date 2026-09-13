import type { ProfileStats } from '../../../shared';
import { getJson, patchJson } from './httpClient';
import type { ChangePasswordRequest } from '../../../shared';

export const ProfileApi = {
    getStats(): Promise<ProfileStats> {
        return getJson('/api/profile/me');
    },

    changePassword(data: ChangePasswordRequest): Promise<{message: string}> {
        return patchJson('/api/profile/password', data);
    },
};