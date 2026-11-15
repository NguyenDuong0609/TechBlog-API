import {
	WebSocketGateway,
	WebSocketServer,
	OnGatewayInit,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	MessageBody,
	ConnectedSocket,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SocketService } from '../services/socket.service';
import { AuthenticatedSocket } from '../interfaces/authenticated-socket.interface';
import { PinoLogger } from 'nestjs-pino';
import { Optional } from '@nestjs/common';

@WebSocketGateway({
	cors: {
		origin: '*',
	},
})
export class MainGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	@WebSocketServer()
	server: Server;

	constructor(
		private readonly socketService: SocketService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
		@Optional() private readonly logger?: PinoLogger,
	) {}

	afterInit(server: Server): void {
		this.socketService.setServer(server);
		this.logger?.info('WebSocket gateway initialized');
	}

	async handleConnection(client: AuthenticatedSocket): Promise<void> {
		try {
			const rawToken =
				client.handshake?.auth?.token ||
				client.handshake?.headers?.authorization ||
				client.handshake?.query?.token;

			const token = typeof rawToken === 'string'
				? rawToken.replace(/^Bearer\s+/i, '')
				: undefined;

			if (token) {
				const secret = this.configService.get<string>('jwt.accessTokenSecret');
				const payload = await this.jwtService.verifyAsync(token, {
					secret,
				});
				client.user = {
					id: payload.sub || payload.id,
					email: payload.email,
					role: payload.role,
				};

				const userId = client.user.id;
				await client.join(`user:${userId}`);
				this.socketService.setOnline(userId, client.id);

				const roleName =
					typeof client.user.role === 'object'
						? client.user.role?.name
						: client.user.role;
				if (roleName === 'Admin') {
					await client.join('admins');
				}
			}

			client.emit('connected', { status: 'ok', socketId: client.id });
		} catch (error) {
			// Allow unauthenticated clients to connect for public post updates
			client.emit('connected', { status: 'anonymous', socketId: client.id });
		}
	}

	handleDisconnect(client: AuthenticatedSocket): void {
		if (client.user?.id) {
			this.socketService.setOffline(client.user.id, client.id);
		}
	}

	@SubscribeMessage('join_post_room')
	async handleJoinPostRoom(
		@ConnectedSocket() client: AuthenticatedSocket,
		@MessageBody() data: { postId: string },
	): Promise<{ event: string; status: string; postId: string }> {
		if (data?.postId) {
			await client.join(`post:${data.postId}`);
		}
		return { event: 'joined_post_room', status: 'ok', postId: data?.postId };
	}

	@SubscribeMessage('leave_post_room')
	async handleLeavePostRoom(
		@ConnectedSocket() client: AuthenticatedSocket,
		@MessageBody() data: { postId: string },
	): Promise<{ event: string; status: string; postId: string }> {
		if (data?.postId) {
			await client.leave(`post:${data.postId}`);
		}
		return { event: 'left_post_room', status: 'ok', postId: data?.postId };
	}

	@SubscribeMessage('join_conversation')
	async handleJoinConversation(
		@ConnectedSocket() client: AuthenticatedSocket,
		@MessageBody() data: { conversationId: string },
	): Promise<{ event: string; status: string }> {
		if (data?.conversationId) {
			await client.join(`conversation:${data.conversationId}`);
		}
		return { event: 'joined_conversation', status: 'ok' };
	}

	@SubscribeMessage('leave_conversation')
	async handleLeaveConversation(
		@ConnectedSocket() client: AuthenticatedSocket,
		@MessageBody() data: { conversationId: string },
	): Promise<{ event: string; status: string }> {
		if (data?.conversationId) {
			await client.leave(`conversation:${data.conversationId}`);
		}
		return { event: 'left_conversation', status: 'ok' };
	}

	@SubscribeMessage('typing')
	handleTyping(
		@ConnectedSocket() client: AuthenticatedSocket,
		@MessageBody()
		data: {
			conversationId?: string;
			postId?: string;
			isTyping: boolean;
		},
	): void {
		if (data?.conversationId) {
			client.to(`conversation:${data.conversationId}`).emit('user_typing', {
				userId: client.user?.id,
				conversationId: data.conversationId,
				isTyping: data.isTyping,
			});
		} else if (data?.postId) {
			client.to(`post:${data.postId}`).emit('user_typing', {
				userId: client.user?.id,
				postId: data.postId,
				isTyping: data.isTyping,
			});
		}
	}
}

