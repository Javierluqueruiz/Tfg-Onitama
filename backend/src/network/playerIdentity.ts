import { Socket } from 'socket.io';
import { User } from '../auth/User.model';

export interface ResolvedPlayerIdentity {
    userId?: string;
    elo?: number;
    username?: string;
}

export async function resolvePlayerIdentity(socket: Socket): Promise<ResolvedPlayerIdentity> {
    if (!socket.data.userId) return {};

    const user = await User.findById(socket.data.userId).select('username elo');
    if (!user) return {};

    return { userId: user._id.toString(), elo: user.elo, username: user.username };
}