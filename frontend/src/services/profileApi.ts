import type { ProfileStats } from '../../../shared';
import { getJson } from './httpClient';

export const ProfileApi = {
    getStats(): Promise<ProfileStats> {
        return getJson('/api/profile/me');
    },
};