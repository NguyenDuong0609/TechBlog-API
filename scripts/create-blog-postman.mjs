import { writeFile } from 'node:fs/promises';

const collection = {
	info: {
		_postman_id: 'b1092026-b109-4822-a912-blogtechnical01',
		name: 'NestJS Blog Technical Platform API',
		description: 'Complete API collection for NestJS Blog Technical Platform covering all features from Phase 1 to Phase 4 (Auth, Users, Categories, Tags, Posts, Comments, Reactions, Follows, Notifications, Series, Dashboard, Chat, Settings, Search, Sitemap, and Rate Limiting).',
		schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
	},
	variable: [
		{ key: 'baseUrl', value: 'http://localhost:3000', type: 'string' },
		{ key: 'accessToken', value: '', type: 'string' },
		{ key: 'adminToken', value: '', type: 'string' },
		{ key: 'createdPostId', value: '', type: 'string' },
		{ key: 'createdPostSlug', value: '', type: 'string' },
		{ key: 'createdCategoryId', value: '', type: 'string' },
		{ key: 'createdTagId', value: '', type: 'string' },
		{ key: 'createdCommentId', value: '', type: 'string' },
		{ key: 'createdSeriesId', value: '', type: 'string' },
		{ key: 'createdConversationId', value: '', type: 'string' },
		{ key: 'targetUserId', value: '', type: 'string' },
	],
	item: [
		// 1. AUTHENTICATION
		{
			name: '1. Authentication',
			item: [
				{
					name: 'Sign Up (New Author)',
					event: [
						{
							listen: 'test',
							script: {
								exec: [
									'const res = pm.response.json();',
									'if (res.data?.user?.id) {',
									'    pm.environment.set("targetUserId", res.data.user.id);',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
					request: {
						method: 'POST',
						header: [{ key: 'Content-Type', value: 'application/json' }],
						url: {
							raw: '{{baseUrl}}/auth/sign-up',
							host: ['{{baseUrl}}'],
							path: ['auth', 'sign-up'],
						},
						body: {
							mode: 'raw',
							raw: JSON.stringify(
								{
									email: 'author_test@example.com',
									password: 'Password123!',
									username: 'author_test',
									first_name: 'John',
									last_name: 'Author',
								},
								null,
								2,
							),
						},
						description: 'Register a new author account.',
					},
				},
				{
					name: 'Sign In (Author)',
					event: [
						{
							listen: 'test',
							script: {
								exec: [
									'const res = pm.response.json();',
									'if (res.data?.access_token) {',
									'    pm.environment.set("accessToken", res.data.access_token);',
									'    pm.collectionVariables.set("accessToken", res.data.access_token);',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
					request: {
						method: 'POST',
						header: [{ key: 'Content-Type', value: 'application/json' }],
						url: {
							raw: '{{baseUrl}}/auth/sign-in',
							host: ['{{baseUrl}}'],
							path: ['auth', 'sign-in'],
						},
						body: {
							mode: 'raw',
							raw: JSON.stringify(
								{
									email: 'author_test@example.com',
									password: 'Password123!',
								},
								null,
								2,
							),
						},
						description: 'Sign in to obtain author access token.',
					},
				},
				{
					name: 'Sign In (Admin)',
					event: [
						{
							listen: 'test',
							script: {
								exec: [
									'const res = pm.response.json();',
									'if (res.data?.access_token) {',
									'    pm.environment.set("adminToken", res.data.access_token);',
									'    pm.collectionVariables.set("adminToken", res.data.access_token);',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
					request: {
						method: 'POST',
						header: [{ key: 'Content-Type', value: 'application/json' }],
						url: {
							raw: '{{baseUrl}}/auth/sign-in',
							host: ['{{baseUrl}}'],
							path: ['auth', 'sign-in'],
						},
						body: {
							mode: 'raw',
							raw: JSON.stringify(
								{
									email: 'admin@example.com',
									password: 'ExamplePass123!',
								},
								null,
								2,
							),
						},
						description: 'Sign in as administrator to manage users, settings, and review posts.',
					},
				},
			],
		},

		// 2. USERS
		{
			name: '2. Users Management',
			item: [
				{
					name: 'Get Current Profile (Me)',
					request: {
						method: 'GET',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/users/me',
							host: ['{{baseUrl}}'],
							path: ['users', 'me'],
						},
					},
				},
				{
					name: 'Update Current Profile',
					request: {
						method: 'PATCH',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
							{ key: 'Content-Type', value: 'application/json' },
						],
						url: {
							raw: '{{baseUrl}}/users/me',
							host: ['{{baseUrl}}'],
							path: ['users', 'me'],
						},
						body: {
							mode: 'raw',
							raw: JSON.stringify(
								{
									bio: 'Fullstack developer & Cloud enthusiast writing technical blogs.',
									avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
									socialLinks: {
										github: 'https://github.com/developer',
										twitter: 'https://twitter.com/developer',
										linkedin: 'https://linkedin.com/in/developer',
									},
								},
								null,
								2,
							),
						},
					},
				},
				{
					name: 'Admin - List Users (Filter & Search)',
					request: {
						method: 'GET',
						header: [
							{ key: 'Authorization', value: 'Bearer {{adminToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/users?role=User&isActive=true&page=1&limit=10',
							host: ['{{baseUrl}}'],
							path: ['users'],
							query: [
								{ key: 'role', value: 'User' },
								{ key: 'isActive', value: 'true' },
								{ key: 'search', value: 'author', disabled: true },
								{ key: 'page', value: '1' },
								{ key: 'limit', value: '10' },
							],
						},
					},
				},
				{
					name: 'Admin - Change User Role',
					request: {
						method: 'PATCH',
						header: [
							{ key: 'Authorization', value: 'Bearer {{adminToken}}' },
							{ key: 'Content-Type', value: 'application/json' },
						],
						url: {
							raw: '{{baseUrl}}/users/{{targetUserId}}/role',
							host: ['{{baseUrl}}'],
							path: ['users', '{{targetUserId}}', 'role'],
						},
						body: {
							mode: 'raw',
							raw: JSON.stringify({ role: 'Author' }, null, 2),
						},
					},
				},
				{
					name: 'Admin - Lock / Unlock User Account',
					request: {
						method: 'PATCH',
						header: [
							{ key: 'Authorization', value: 'Bearer {{adminToken}}' },
							{ key: 'Content-Type', value: 'application/json' },
						],
						url: {
							raw: '{{baseUrl}}/users/{{targetUserId}}/status',
							host: ['{{baseUrl}}'],
							path: ['users', '{{targetUserId}}', 'status'],
						},
						body: {
							mode: 'raw',
							raw: JSON.stringify({ isActive: true }, null, 2),
						},
					},
				},
			],
		},

		// 3. CATEGORIES
		{
			name: '3. Categories',
			item: [
				{
					name: 'Get Categories List',
					request: {
						method: 'GET',
						url: {
							raw: '{{baseUrl}}/categories',
							host: ['{{baseUrl}}'],
							path: ['categories'],
						},
					},
				},
				{
					name: 'Admin - Create Category',
					event: [
						{
							listen: 'test',
							script: {
								exec: [
									'const res = pm.response.json();',
									'if (res.data?.id) {',
									'    pm.environment.set("createdCategoryId", res.data.id);',
									'    pm.collectionVariables.set("createdCategoryId", res.data.id);',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
					request: {
						method: 'POST',
						header: [
							{ key: 'Authorization', value: 'Bearer {{adminToken}}' },
							{ key: 'Content-Type', value: 'application/json' },
						],
						url: {
							raw: '{{baseUrl}}/categories',
							host: ['{{baseUrl}}'],
							path: ['categories'],
						},
						body: {
							mode: 'raw',
							raw: JSON.stringify(
								{
									name: 'Backend Engineering',
									description: 'Architecture, microservices, databases and high performance systems.',
									icon: 'server',
									order: 1,
								},
								null,
								2,
							),
						},
					},
				},
				{
					name: 'Get Category By ID',
					request: {
						method: 'GET',
						url: {
							raw: '{{baseUrl}}/categories/{{createdCategoryId}}',
							host: ['{{baseUrl}}'],
							path: ['categories', '{{createdCategoryId}}'],
						},
					},
				},
				{
					name: 'Admin - Update Category',
					request: {
						method: 'PATCH',
						header: [
							{ key: 'Authorization', value: 'Bearer {{adminToken}}' },
							{ key: 'Content-Type', value: 'application/json' },
						],
						url: {
							raw: '{{baseUrl}}/categories/{{createdCategoryId}}',
							host: ['{{baseUrl}}'],
							path: ['categories', '{{createdCategoryId}}'],
						},
						body: {
							mode: 'raw',
							raw: JSON.stringify(
								{
									name: 'Backend & Cloud Systems',
									description: 'Advanced backend architectures and distributed systems.',
								},
								null,
								2,
							),
						},
					},
				},
			],
		},

		// 4. TAGS
		{
			name: '4. Tags',
			item: [
				{
					name: 'Get Tags List',
					request: {
						method: 'GET',
						url: {
							raw: '{{baseUrl}}/tags',
							host: ['{{baseUrl}}'],
							path: ['tags'],
						},
					},
				},
				{
					name: 'Create Tag',
					event: [
						{
							listen: 'test',
							script: {
								exec: [
									'const res = pm.response.json();',
									'if (res.data?.id) {',
									'    pm.environment.set("createdTagId", res.data.id);',
									'    pm.collectionVariables.set("createdTagId", res.data.id);',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
					request: {
						method: 'POST',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
							{ key: 'Content-Type', value: 'application/json' },
						],
						url: {
							raw: '{{baseUrl}}/tags',
							host: ['{{baseUrl}}'],
							path: ['tags'],
						},
						body: {
							mode: 'raw',
							raw: JSON.stringify(
								{
									name: 'NestJS',
									description: 'A progressive Node.js framework for scalable server-side apps.',
								},
								null,
								2,
							),
						},
					},
				},
				{
					name: 'Get Popular Tags',
					request: {
						method: 'GET',
						url: {
							raw: '{{baseUrl}}/tags/popular?limit=10',
							host: ['{{baseUrl}}'],
							path: ['tags', 'popular'],
							query: [{ key: 'limit', value: '10' }],
						},
					},
				},
			],
		},

		// 5. POSTS
		{
			name: '5. Posts',
			item: [
				{
					name: 'Public Posts Feed',
					request: {
						method: 'GET',
						url: {
							raw: '{{baseUrl}}/posts?sort=newest&limit=10&offset=0',
							host: ['{{baseUrl}}'],
							path: ['posts'],
							query: [
								{ key: 'sort', value: 'newest' },
								{ key: 'limit', value: '10' },
								{ key: 'offset', value: '0' },
								{ key: 'categoryId', value: '{{createdCategoryId}}', disabled: true },
								{ key: 'tag', value: 'nestjs', disabled: true },
							],
						},
					},
				},
				{
					name: 'Full-text Search Posts (P4-01)',
					request: {
						method: 'GET',
						url: {
							raw: '{{baseUrl}}/posts/search?q=NestJS+Realtime&page=1&limit=10',
							host: ['{{baseUrl}}'],
							path: ['posts', 'search'],
							query: [
								{ key: 'q', value: 'NestJS Realtime' },
								{ key: 'page', value: '1' },
								{ key: 'limit', value: '10' },
							],
						},
					},
				},
				{
					name: 'SEO Sitemap XML (P4-05)',
					request: {
						method: 'GET',
						url: {
							raw: '{{baseUrl}}/posts/sitemap.xml',
							host: ['{{baseUrl}}'],
							path: ['posts', 'sitemap.xml'],
						},
					},
				},
				{
					name: 'Create Post (Draft)',
					event: [
						{
							listen: 'test',
							script: {
								exec: [
									'const res = pm.response.json();',
									'if (res.data?.id) {',
									'    pm.environment.set("createdPostId", res.data.id);',
									'    pm.collectionVariables.set("createdPostId", res.data.id);',
									'}',
									'if (res.data?.slug) {',
									'    pm.environment.set("createdPostSlug", res.data.slug);',
									'    pm.collectionVariables.set("createdPostSlug", res.data.slug);',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
					request: {
						method: 'POST',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
							{ key: 'Content-Type', value: 'application/json' },
						],
						url: {
							raw: '{{baseUrl}}/posts',
							host: ['{{baseUrl}}'],
							path: ['posts'],
						},
						body: {
							mode: 'raw',
							raw: JSON.stringify(
								{
									title: 'Building Scalable Realtime APIs with NestJS and Redis',
									excerpt: 'A comprehensive technical guide to scaling WebSockets with Redis Adapter and BullMQ.',
									content: '# Introduction\\n\\nIn this article, we explore how to horizontally scale Socket.IO inside NestJS applications using Redis pub/sub adapter.\\n\\n## Architecture\\n\\nBy decoupling WebSocket state from a single node, multi-instance setups can broadcast events seamlessly.',
									level: 'advanced',
									categoryId: '{{createdCategoryId}}',
									tagNames: ['NestJS', 'Redis', 'WebSockets'],
									metaTitle: 'Building Scalable Realtime APIs with NestJS',
									metaDescription: 'Learn how to scale NestJS WebSockets across multiple nodes with Redis.',
								},
								null,
								2,
							),
						},
					},
				},
				{
					name: 'Author - Submit Post for Review',
					request: {
						method: 'POST',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/posts/{{createdPostId}}/submit',
							host: ['{{baseUrl}}'],
							path: ['posts', '{{createdPostId}}', 'submit'],
						},
					},
				},
				{
					name: 'Admin - Approve Post (P3-02)',
					request: {
						method: 'POST',
						header: [
							{ key: 'Authorization', value: 'Bearer {{adminToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/posts/{{createdPostId}}/approve',
							host: ['{{baseUrl}}'],
							path: ['posts', '{{createdPostId}}', 'approve'],
						},
					},
				},
				{
					name: 'Admin - Reject Post (P3-02)',
					request: {
						method: 'POST',
						header: [
							{ key: 'Authorization', value: 'Bearer {{adminToken}}' },
							{ key: 'Content-Type', value: 'application/json' },
						],
						url: {
							raw: '{{baseUrl}}/posts/{{createdPostId}}/reject',
							host: ['{{baseUrl}}'],
							path: ['posts', '{{createdPostId}}', 'reject'],
						},
						body: {
							mode: 'raw',
							raw: JSON.stringify(
								{
									reason: 'Please format code snippets with syntax highlighting and elaborate on Redis cluster failover.',
								},
								null,
								2,
							),
						},
					},
				},
				{
					name: 'Get Post Detail by Slug (Increments View)',
					request: {
						method: 'GET',
						url: {
							raw: '{{baseUrl}}/posts/{{createdPostSlug}}',
							host: ['{{baseUrl}}'],
							path: ['posts', '{{createdPostSlug}}'],
						},
					},
				},
				{
					name: 'Author - Get My Posts',
					request: {
						method: 'GET',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/posts/my',
							host: ['{{baseUrl}}'],
							path: ['posts', 'my'],
						},
					},
				},
				{
					name: 'Admin - List All Posts (All Statuses)',
					request: {
						method: 'GET',
						header: [
							{ key: 'Authorization', value: 'Bearer {{adminToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/posts/admin?status=PUBLISHED&limit=20',
							host: ['{{baseUrl}}'],
							path: ['posts', 'admin'],
							query: [
								{ key: 'status', value: 'PUBLISHED' },
								{ key: 'limit', value: '20' },
							],
						},
					},
				},
				{
					name: 'Admin / Author - Soft Delete Post',
					request: {
						method: 'DELETE',
						header: [
							{ key: 'Authorization', value: 'Bearer {{adminToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/posts/{{createdPostId}}',
							host: ['{{baseUrl}}'],
							path: ['posts', '{{createdPostId}}'],
						},
					},
				},
				{
					name: 'Admin / Author - Restore Post',
					request: {
						method: 'POST',
						header: [
							{ key: 'Authorization', value: 'Bearer {{adminToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/posts/{{createdPostId}}/restore',
							host: ['{{baseUrl}}'],
							path: ['posts', '{{createdPostId}}', 'restore'],
						},
					},
				},
			],
		},

		// 6. COMMENTS
		{
			name: '6. Comments Tree (Closure Table)',
			item: [
				{
					name: 'Create Root Comment',
					event: [
						{
							listen: 'test',
							script: {
								exec: [
									'const res = pm.response.json();',
									'if (res.data?.id) {',
									'    pm.environment.set("createdCommentId", res.data.id);',
									'    pm.collectionVariables.set("createdCommentId", res.data.id);',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
					request: {
						method: 'POST',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
							{ key: 'Content-Type', value: 'application/json' },
						],
						url: {
							raw: '{{baseUrl}}/comments/posts/{{createdPostId}}',
							host: ['{{baseUrl}}'],
							path: ['comments', 'posts', '{{createdPostId}}'],
						},
						body: {
							mode: 'raw',
							raw: JSON.stringify(
								{
									content: 'Excellent guide! Could you explain how to configure Redis TLS certificates?',
								},
								null,
								2,
							),
						},
					},
				},
				{
					name: 'Create Reply to Comment',
					request: {
						method: 'POST',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
							{ key: 'Content-Type', value: 'application/json' },
						],
						url: {
							raw: '{{baseUrl}}/comments/{{createdCommentId}}/replies',
							host: ['{{baseUrl}}'],
							path: ['comments', '{{createdCommentId}}', 'replies'],
						},
						body: {
							mode: 'raw',
							raw: JSON.stringify(
								{
									postId: '{{createdPostId}}',
									content: 'For TLS, you can pass ca, cert, and key buffers in the redis createClient options!',
								},
								null,
								2,
							),
						},
					},
				},
				{
					name: 'Get Post Comments Tree',
					request: {
						method: 'GET',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/comments/posts/{{createdPostId}}/tree?limit=20&offset=0',
							host: ['{{baseUrl}}'],
							path: ['comments', 'posts', '{{createdPostId}}', 'tree'],
							query: [
								{ key: 'limit', value: '20' },
								{ key: 'offset', value: '0' },
							],
						},
					},
				},
				{
					name: 'Admin - Hide Comment',
					request: {
						method: 'PATCH',
						header: [
							{ key: 'Authorization', value: 'Bearer {{adminToken}}' },
							{ key: 'Content-Type', value: 'application/json' },
						],
						url: {
							raw: '{{baseUrl}}/comments/{{createdCommentId}}/hide',
							host: ['{{baseUrl}}'],
							path: ['comments', '{{createdCommentId}}', 'hide'],
						},
						body: {
							mode: 'raw',
							raw: JSON.stringify(
								{ reason: 'Spam or irrelevant commercial link' },
								null,
								2,
							),
						},
					},
				},
				{
					name: 'Admin - Unhide Comment',
					request: {
						method: 'PATCH',
						header: [
							{ key: 'Authorization', value: 'Bearer {{adminToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/comments/{{createdCommentId}}/unhide',
							host: ['{{baseUrl}}'],
							path: ['comments', '{{createdCommentId}}', 'unhide'],
						},
					},
				},
				{
					name: 'Delete Comment (Cascade Children)',
					request: {
						method: 'DELETE',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/comments/{{createdCommentId}}',
							host: ['{{baseUrl}}'],
							path: ['comments', '{{createdCommentId}}'],
						},
					},
				},
			],
		},

		// 7. REACTIONS
		{
			name: '7. Reactions',
			item: [
				{
					name: 'Toggle Reaction (LIKE / UPVOTE)',
					request: {
						method: 'POST',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
							{ key: 'Content-Type', value: 'application/json' },
						],
						url: {
							raw: '{{baseUrl}}/posts/{{createdPostId}}/reactions',
							host: ['{{baseUrl}}'],
							path: ['posts', '{{createdPostId}}', 'reactions'],
						},
						body: {
							mode: 'raw',
							raw: JSON.stringify({ type: 'like' }, null, 2),
						},
					},
				},
				{
					name: 'Get My Reaction On Post',
					request: {
						method: 'GET',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/posts/{{createdPostId}}/reactions/me',
							host: ['{{baseUrl}}'],
							path: ['posts', '{{createdPostId}}', 'reactions', 'me'],
						},
					},
				},
			],
		},

		// 8. FOLLOWS
		{
			name: '8. Follows & Subscriptions',
			item: [
				{
					name: 'Follow Author',
					request: {
						method: 'POST',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/users/{{targetUserId}}/follow',
							host: ['{{baseUrl}}'],
							path: ['users', '{{targetUserId}}', 'follow'],
						},
					},
				},
				{
					name: 'Check Author Follow Status',
					request: {
						method: 'GET',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/users/{{targetUserId}}/is-following',
							host: ['{{baseUrl}}'],
							path: ['users', '{{targetUserId}}', 'is-following'],
						},
					},
				},
				{
					name: 'Subscribe Category',
					request: {
						method: 'POST',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/categories/{{createdCategoryId}}/subscribe',
							host: ['{{baseUrl}}'],
							path: ['categories', '{{createdCategoryId}}', 'subscribe'],
						},
					},
				},
				{
					name: 'Check Category Subscription Status',
					request: {
						method: 'GET',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/categories/{{createdCategoryId}}/is-subscribed',
							host: ['{{baseUrl}}'],
							path: ['categories', '{{createdCategoryId}}', 'is-subscribed'],
						},
					},
				},
				{
					name: 'Unfollow Author',
					request: {
						method: 'DELETE',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/users/{{targetUserId}}/follow',
							host: ['{{baseUrl}}'],
							path: ['users', '{{targetUserId}}', 'follow'],
						},
					},
				},
			],
		},

		// 9. NOTIFICATIONS
		{
			name: '9. Notifications',
			item: [
				{
					name: 'Get User Notifications',
					request: {
						method: 'GET',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/notifications?limit=20&offset=0',
							host: ['{{baseUrl}}'],
							path: ['notifications'],
							query: [
								{ key: 'limit', value: '20' },
								{ key: 'offset', value: '0' },
							],
						},
					},
				},
				{
					name: 'Get Unread Notifications Count',
					request: {
						method: 'GET',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/notifications/unread-count',
							host: ['{{baseUrl}}'],
							path: ['notifications', 'unread-count'],
						},
					},
				},
				{
					name: 'Mark All Notifications As Read',
					request: {
						method: 'PATCH',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/notifications/read-all',
							host: ['{{baseUrl}}'],
							path: ['notifications', 'read-all'],
						},
					},
				},
			],
		},

		// 10. SERIES
		{
			name: '10. Series',
			item: [
				{
					name: 'List All Series',
					request: {
						method: 'GET',
						url: {
							raw: '{{baseUrl}}/series?limit=10&offset=0',
							host: ['{{baseUrl}}'],
							path: ['series'],
							query: [
								{ key: 'limit', value: '10' },
								{ key: 'offset', value: '0' },
							],
						},
					},
				},
				{
					name: 'Create Series',
					event: [
						{
							listen: 'test',
							script: {
								exec: [
									'const res = pm.response.json();',
									'if (res.data?.id) {',
									'    pm.environment.set("createdSeriesId", res.data.id);',
									'    pm.collectionVariables.set("createdSeriesId", res.data.id);',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
					request: {
						method: 'POST',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
							{ key: 'Content-Type', value: 'application/json' },
						],
						url: {
							raw: '{{baseUrl}}/series',
							host: ['{{baseUrl}}'],
							path: ['series'],
						},
						body: {
							mode: 'raw',
							raw: JSON.stringify(
								{
									title: 'Mastering NestJS Microservices from Scratch',
									description: 'A complete multi-part series covering gRPC, Kafka, BullMQ and Redis in NestJS.',
									coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
								},
								null,
								2,
							),
						},
					},
				},
				{
					name: 'Add Post to Series',
					request: {
						method: 'POST',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
							{ key: 'Content-Type', value: 'application/json' },
						],
						url: {
							raw: '{{baseUrl}}/series/{{createdSeriesId}}/posts',
							host: ['{{baseUrl}}'],
							path: ['series', '{{createdSeriesId}}', 'posts'],
						},
						body: {
							mode: 'raw',
							raw: JSON.stringify(
								{
									postId: '{{createdPostId}}',
									orderIndex: 1,
								},
								null,
								2,
							),
						},
					},
				},
				{
					name: 'Reorder Posts in Series',
					request: {
						method: 'PUT',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
							{ key: 'Content-Type', value: 'application/json' },
						],
						url: {
							raw: '{{baseUrl}}/series/{{createdSeriesId}}/reorder',
							host: ['{{baseUrl}}'],
							path: ['series', '{{createdSeriesId}}', 'reorder'],
						},
						body: {
							mode: 'raw',
							raw: JSON.stringify(
								{
									postIds: ['{{createdPostId}}'],
								},
								null,
								2,
							),
						},
					},
				},
			],
		},

		// 11. DASHBOARD
		{
			name: '11. Dashboard Analytics',
			item: [
				{
					name: 'Get Dashboard Statistics',
					request: {
						method: 'GET',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/dashboard/stats',
							host: ['{{baseUrl}}'],
							path: ['dashboard', 'stats'],
						},
					},
				},
				{
					name: 'Get Top Viewed Posts',
					request: {
						method: 'GET',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/dashboard/top-posts?limit=5',
							host: ['{{baseUrl}}'],
							path: ['dashboard', 'top-posts'],
							query: [{ key: 'limit', value: '5' }],
						},
					},
				},
			],
		},

		// 12. CHAT
		{
			name: '12. Realtime Chat (1-on-1)',
			item: [
				{
					name: 'Find or Create Conversation',
					event: [
						{
							listen: 'test',
							script: {
								exec: [
									'const res = pm.response.json();',
									'if (res.data?.id) {',
									'    pm.environment.set("createdConversationId", res.data.id);',
									'    pm.collectionVariables.set("createdConversationId", res.data.id);',
									'}',
								],
								type: 'text/javascript',
							},
						},
					],
					request: {
						method: 'POST',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
							{ key: 'Content-Type', value: 'application/json' },
						],
						url: {
							raw: '{{baseUrl}}/chat/conversations',
							host: ['{{baseUrl}}'],
							path: ['chat', 'conversations'],
						},
						body: {
							mode: 'raw',
							raw: JSON.stringify(
								{
									participantId: '{{targetUserId}}',
								},
								null,
								2,
							),
						},
					},
				},
				{
					name: 'Get My Conversations',
					request: {
						method: 'GET',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/chat/conversations',
							host: ['{{baseUrl}}'],
							path: ['chat', 'conversations'],
						},
					},
				},
				{
					name: 'Send Message (HTTP Fallback)',
					request: {
						method: 'POST',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
							{ key: 'Content-Type', value: 'application/json' },
						],
						url: {
							raw: '{{baseUrl}}/chat/conversations/{{createdConversationId}}/messages',
							host: ['{{baseUrl}}'],
							path: ['chat', 'conversations', '{{createdConversationId}}', 'messages'],
						},
						body: {
							mode: 'raw',
							raw: JSON.stringify(
								{
									content: 'Hello! I read your post about NestJS scaling and had a question.',
								},
								null,
								2,
							),
						},
					},
				},
				{
					name: 'Get Conversation Messages History',
					request: {
						method: 'GET',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/chat/conversations/{{createdConversationId}}/messages?limit=30&offset=0',
							host: ['{{baseUrl}}'],
							path: ['chat', 'conversations', '{{createdConversationId}}', 'messages'],
							query: [
								{ key: 'limit', value: '30' },
								{ key: 'offset', value: '0' },
							],
						},
					},
				},
				{
					name: 'Mark Messages As Read',
					request: {
						method: 'PATCH',
						header: [
							{ key: 'Authorization', value: 'Bearer {{accessToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/chat/conversations/{{createdConversationId}}/read',
							host: ['{{baseUrl}}'],
							path: ['chat', 'conversations', '{{createdConversationId}}', 'read'],
						},
					},
				},
			],
		},

		// 13. SETTINGS
		{
			name: '13. Runtime Settings',
			item: [
				{
					name: 'Admin - Get All Settings',
					request: {
						method: 'GET',
						header: [
							{ key: 'Authorization', value: 'Bearer {{adminToken}}' },
						],
						url: {
							raw: '{{baseUrl}}/settings',
							host: ['{{baseUrl}}'],
							path: ['settings'],
						},
					},
				},
				{
					name: 'Get Setting By Key (e.g. site_name)',
					request: {
						method: 'GET',
						url: {
							raw: '{{baseUrl}}/settings/site_name',
							host: ['{{baseUrl}}'],
							path: ['settings', 'site_name'],
						},
					},
				},
				{
					name: 'Admin - Upsert Setting',
					request: {
						method: 'PUT',
						header: [
							{ key: 'Authorization', value: 'Bearer {{adminToken}}' },
							{ key: 'Content-Type', value: 'application/json' },
						],
						url: {
							raw: '{{baseUrl}}/settings/require_approval',
							host: ['{{baseUrl}}'],
							path: ['settings', 'require_approval'],
						},
						body: {
							mode: 'raw',
							raw: JSON.stringify(
								{
									value: 'true',
									description: 'Require administrator approval before posts become public',
								},
								null,
								2,
							),
						},
					},
				},
			],
		},
	],
};

await writeFile(
	'postman_blog_technical_collection.json',
	JSON.stringify(collection, null, 2),
	'utf8',
);
console.log('Successfully generated postman_blog_technical_collection.json');

