import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NextFunction, Request, Response } from 'express';

export function configSwagger(
	app: INestApplication,
	configService: ConfigService,
) {
	if (!configService.get<boolean>('swagger.enabled')) {
		return;
	}

	const username = configService.getOrThrow<string>('swagger.username');
	const password = configService.getOrThrow<string>('swagger.password');
	const config = new DocumentBuilder()
		.setTitle('NestJS Blog Technical API')
		.setDescription(
			'Production-ready Technical Blog Platform API with Full-text Search, Hierarchical Comments Tree, Realtime WebSocket & Chat, Series, Reactions, Follows, and Admin Dashboard.',
		)
		.setVersion('1.0')
		.addBearerAuth(
			{
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
				description: 'Enter your JWT access token',
			},
			'token',
		)
		.addTag('posts', 'Blog posts management, publishing lifecycle, and full-text search')
		.addTag('categories', 'Blog categories management and subscription')
		.addTag('tags', 'Blog tags management and auto-slug generation')
		.addTag('Comments', 'Hierarchical comment tree with closure table and moderation')
		.addTag('notifications', 'In-app and realtime user notifications')
		.addTag('chat', '1-on-1 realtime messaging and conversation history')
		.addTag('series', 'Curated multi-part article series and ordering')
		.addTag('reactions', 'Post likes, upvotes, and reaction toggles')
		.addTag('follows', 'Author follows and category subscriptions')
		.addTag('dashboard', 'Admin analytics and author publication statistics')
		.addTag('settings', 'System runtime configurations and settings')
		.addTag('users', 'User management, RBAC role updates, and account status')
		.build();
	const document = SwaggerModule.createDocument(app, config);

	const http_adapter = app.getHttpAdapter();
	const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
		const [scheme, encoded] = (req.headers.authorization || '').split(' ');
		const decoded =
			scheme === 'Basic'
				? Buffer.from(encoded || '', 'base64').toString()
				: '';
		const separator = decoded.indexOf(':');
		if (
			separator < 1 ||
			decoded.slice(0, separator) !== username ||
			decoded.slice(separator + 1) !== password
		) {
			res.setHeader('WWW-Authenticate', 'Basic realm="API documentation"');
			res.status(401).end();
			return;
		}
		next();
	};

	http_adapter.use('/api-docs', authMiddleware);
	http_adapter.use('/api', authMiddleware);

	const swaggerSetupOptions = {
		swaggerOptions: { persistAuthorization: true },
		customSiteTitle: 'Blog Technical API Docs',
		customfavIcon: '/swagger.ico',
	};

	SwaggerModule.setup('api-docs', app, document, swaggerSetupOptions);
	SwaggerModule.setup('api', app, document, swaggerSetupOptions);
}
