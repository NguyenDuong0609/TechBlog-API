import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SocketService {
	private server?: Server;
	private readonly onlineUsers = new Map<string, Set<string>>();

	setServer(server: Server): void {
		this.server = server;
	}

	getServer(): Server | undefined {
		return this.server;
	}

	emitToUser(userId: string, event: string, payload: any): void {
		if (!this.server) return;
		this.server.to(`user:${userId}`).emit(event, payload);
	}

	emitToAdmins(event: string, payload: any): void {
		if (!this.server) return;
		this.server.to('admins').emit(event, payload);
	}

	emitToPost(postId: string, event: string, payload: any): void {
		if (!this.server) return;
		this.server.to(`post:${postId}`).emit(event, payload);
	}

	emitToConversation(conversationId: string, event: string, payload: any): void {
		if (!this.server) return;
		this.server.to(`conversation:${conversationId}`).emit(event, payload);
	}

	setOnline(userId: string, socketId: string): void {
		let sockets = this.onlineUsers.get(userId);
		if (!sockets) {
			sockets = new Set<string>();
			this.onlineUsers.set(userId, sockets);
		}
		sockets.add(socketId);
	}

	setOffline(userId: string, socketId: string): void {
		const sockets = this.onlineUsers.get(userId);
		if (sockets) {
			sockets.delete(socketId);
			if (sockets.size === 0) {
				this.onlineUsers.delete(userId);
			}
		}
	}

	isOnline(userId: string): boolean {
		const sockets = this.onlineUsers.get(userId);
		return Boolean(sockets && sockets.size > 0);
	}

	getOnlineUserCount(): number {
		return this.onlineUsers.size;
	}
}

