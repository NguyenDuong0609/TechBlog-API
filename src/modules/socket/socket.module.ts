import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SocketService } from './services/socket.service';
import { MainGateway } from './gateways/main.gateway';
import { WsJwtGuard } from './guards/ws-jwt.guard';

@Global()
@Module({
	imports: [
		ConfigModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				secret: configService.get<string>('jwt.accessTokenSecret'),
				signOptions: {
					expiresIn: configService.get<any>('jwt.accessTokenExpiration'),
				},
			}),
		}),
	],
	providers: [SocketService, MainGateway, WsJwtGuard],
	exports: [SocketService, MainGateway, WsJwtGuard],
})
export class SocketModule {}

