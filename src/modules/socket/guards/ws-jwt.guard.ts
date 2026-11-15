import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { AuthenticatedSocket } from '../interfaces/authenticated-socket.interface';

@Injectable()
export class WsJwtGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const client: AuthenticatedSocket = context.switchToWs().getClient();
		const rawToken =
			client.handshake?.auth?.token ||
			client.handshake?.headers?.authorization ||
			client.handshake?.query?.token;

		const token = typeof rawToken === 'string'
			? rawToken.replace(/^Bearer\s+/i, '')
			: undefined;

		if (!token) {
			throw new WsException('Unauthorized: Missing access token');
		}

		try {
			const secret = this.configService.get<string>('jwt.accessTokenSecret');
			const payload = await this.jwtService.verifyAsync(token, { secret });
			client.user = {
				id: payload.sub || payload.id,
				email: payload.email,
				role: payload.role,
			};
			return true;
		} catch (error) {
			throw new WsException('Unauthorized: Invalid or expired access token');
		}
	}
}

