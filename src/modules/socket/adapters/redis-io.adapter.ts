import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export class RedisIoAdapter extends IoAdapter {
	private adapterConstructor?: ReturnType<typeof createAdapter>;
	protected override readonly logger = new Logger(RedisIoAdapter.name);

	constructor(
		app: INestApplicationContext,
		private readonly configService: ConfigService,
	) {
		super(app);
	}

	async connectToRedis(): Promise<void> {
		const host = this.configService.get<string>('redis.host', 'localhost');
		const port = this.configService.get<number>('redis.port', 6379);
		const password = this.configService.get<string>('redis.password');
		const url = password
			? `redis://:${encodeURIComponent(password)}@${host}:${port}`
			: `redis://${host}:${port}`;

		try {
			const pubClient = createClient({ url });
			const subClient = pubClient.duplicate();

			pubClient.on('error', (err) =>
				this.logger.error('Redis Socket Pub Client Error', err),
			);
			subClient.on('error', (err) =>
				this.logger.error('Redis Socket Sub Client Error', err),
			);

			await Promise.all([pubClient.connect(), subClient.connect()]);
			this.adapterConstructor = createAdapter(pubClient, subClient);
			this.logger.log('Redis Socket.IO adapter connected successfully');
		} catch (error: any) {
			this.logger.warn(
				`Redis Socket.IO adapter not connected (${error?.message || error}). Falling back to default in-memory adapter.`,
			);
		}
	}

	override createIOServer(port: number, options?: ServerOptions): any {
		const server = super.createIOServer(port, options);
		if (this.adapterConstructor) {
			server.adapter(this.adapterConstructor);
		}
		return server;
	}
}
