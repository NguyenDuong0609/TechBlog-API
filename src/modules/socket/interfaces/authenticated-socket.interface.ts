import { Socket } from 'socket.io';

export interface AuthenticatedUser {
	id: string;
	email?: string;
	role?: string | { id?: string; name?: string };
	fullName?: string;
	avatarUrl?: string;
}

export interface AuthenticatedSocket extends Socket {
	user?: AuthenticatedUser;
}

