import {
	Injectable,
	NotFoundException,
	ForbiddenException,
	Optional,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { In } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CommentClosure } from './entities/comment-closure.entity';
import { User } from '@modules/users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { createContextLogger } from '../../configs/logger.config';
import { AppCacheService } from '@modules/shared/base/cache/app-cache.service';
import { AppCacheKeyBuilder } from '@modules/shared/base/cache/app-cache-key.builder';
import { instanceToPlain } from 'class-transformer';
import { SocketService } from '../socket/services/socket.service';
import { NotificationsService } from '../notifications/services/notifications.service';
import { NotificationType } from '@common/enums';

const COMMENTS_CACHE_NAMESPACE = 'comments';
const COMMENTS_CACHE_TTL_MS = 30_000;

export interface CreateCommentDto {
	content: string;
	postId: string;
	parentId?: string;
}

@Injectable()
export class CommentsService {
	private readonly logger: PinoLogger;

	constructor(
		@InjectRepository(Comment)
		private readonly commentRepository: Repository<Comment>,
		@InjectRepository(CommentClosure)
		private readonly closureRepository: Repository<CommentClosure>,
		@InjectRepository(Post)
		private readonly postRepository: Repository<Post>,
		@Optional() logger?: PinoLogger,
		@Optional() private readonly cache?: AppCacheService,
		@Optional() private readonly socketService?: SocketService,
		@Optional() private readonly notificationsService?: NotificationsService,
	) {
		this.logger = createContextLogger(CommentsService.name, logger);
	}

	async createComment(
		createDto: CreateCommentDto,
		authorId: string,
	): Promise<Comment> {
		let parentAuthorId: string | undefined;
		let postAuthorId: string | undefined;
		let postTitle = '';
		let postSlug = '';

		const created = await this.commentRepository.manager.transaction(
			async (manager) => {
				const commentRepo = manager.getRepository(Comment);
				const closureRepo = manager.getRepository(CommentClosure);
				const postRepo = manager.getRepository(Post);

				const post = await postRepo.findOneBy({ id: createDto.postId });
				if (post) {
					postAuthorId = post.authorId;
					postTitle = post.title;
					postSlug = post.slug;
					await postRepo.increment({ id: post.id }, 'commentCount', 1);
				}

				const comment = commentRepo.create({
					content: createDto.content,
					postId: createDto.postId,
					author: { id: authorId } as User,
					depth: 0,
					isHidden: false,
				});

				await commentRepo.save(comment);

				await closureRepo.save({
					ancestorId: comment.id,
					descendantId: comment.id,
					depth: 0,
				});

				if (createDto.parentId) {
					const parent = await commentRepo.findOne({
						where: { id: createDto.parentId },
						relations: ['author'],
					});

					if (!parent) {
						throw new NotFoundException('Parent comment not found');
					}
					if (parent.postId !== createDto.postId) {
						throw new ForbiddenException(
							'Reply must belong to the parent comment post',
						);
					}

					parentAuthorId = parent.author?.id;
					comment.depth = parent.depth + 1;
					await commentRepo.save(comment);

					const ancestorClosures = await closureRepo.find({
						where: { descendantId: createDto.parentId },
					});

					const newClosures = ancestorClosures.map((ac) =>
						closureRepo.create({
							ancestorId: ac.ancestorId,
							descendantId: comment.id,
							depth: ac.depth + 1,
						}),
					);

					await closureRepo.save(newClosures);
				}

				this.logger.info(
					{ commentId: comment.id, authorId, postId: createDto.postId },
					'Comment created',
				);
				return comment;
			},
		);

		await this.cache?.invalidate(COMMENTS_CACHE_NAMESPACE);

		// Realtime broadcast to post room
		const commentPayload = {
			id: created.id,
			content: created.content,
			postId: created.postId,
			depth: created.depth,
			createdAt: created.createdAt,
			authorId,
			parentId: createDto.parentId,
		};
		this.socketService?.emitToPost(created.postId, 'new_comment', commentPayload);

		// Send In-App & Realtime Notification
		if (createDto.parentId && parentAuthorId && parentAuthorId !== authorId) {
			this.notificationsService
				?.create({
					type: NotificationType.REPLY,
					title: 'Có phản hồi mới cho bình luận',
					message: 'Ai đó đã phản hồi bình luận của bạn',
					userId: parentAuthorId,
					actorId: authorId,
					data: {
						postId: createDto.postId,
						commentId: created.id,
						parentId: createDto.parentId,
					},
				})
				.catch(() => {});
		} else if (postAuthorId && postAuthorId !== authorId) {
			this.notificationsService
				?.create({
					type: NotificationType.NEW_COMMENT,
					title: 'Bình luận mới trên bài viết',
					message: `Có bình luận mới trên bài "${postTitle}"`,
					userId: postAuthorId,
					actorId: authorId,
					data: {
						postId: createDto.postId,
						postSlug,
						commentId: created.id,
					},
				})
				.catch(() => {});
		}

		return created;
	}

	async getCommentTree(
		postId: string,
		offset = 0,
		limit = 20,
	): Promise<Comment[]> {
		if (!this.cache) {
			return this.fetchCommentTree(postId, offset, limit);
		}

		return this.cache.getOrSet(
			COMMENTS_CACHE_NAMESPACE,
			AppCacheKeyBuilder.build({
				route: '/comments/posts/:postId',
				params: { postId },
				query: { offset, limit },
			}),
			COMMENTS_CACHE_TTL_MS,
			() => this.fetchCommentTree(postId, offset, limit),
			(val) => instanceToPlain(val),
		);
	}

	private async fetchCommentTree(
		postId: string,
		offset = 0,
		limit = 20,
	): Promise<Comment[]> {
		const roots = await this.commentRepository.find({
			where: { postId, depth: 0, isHidden: false },
			relations: ['author'],
			order: { createdAt: 'ASC' },
			skip: offset,
			take: limit,
		});
		if (!roots.length) return [];

		const closures = await this.closureRepository.find({
			where: { ancestorId: In(roots.map(({ id }) => id)) },
			order: { depth: 'ASC' },
		});
		const commentIds = [
			...new Set(closures.map(({ descendantId }) => descendantId)),
		];
		const comments = commentIds.length
			? await this.commentRepository.find({
					where: { id: In(commentIds), isHidden: false },
					relations: ['author'],
					order: { createdAt: 'ASC' },
				})
			: roots;

		const commentMap = new Map<string, Comment>();

		comments.forEach((comment) => {
			comment.replies = [];
			commentMap.set(comment.id, comment);
		});

		for (const closure of closures) {
			if (closure.depth !== 1) continue;
			const parent = commentMap.get(closure.ancestorId);
			const reply = commentMap.get(closure.descendantId);
			if (parent && reply) parent.replies.push(reply);
		}

		return roots
			.map((root) => commentMap.get(root.id))
			.filter((root): root is Comment => Boolean(root));
	}

	async getCommentAncestors(commentId: string): Promise<Comment[]> {
		const closures = await this.closureRepository.find({
			where: { descendantId: commentId },
			relations: ['ancestor', 'ancestor.author'],
			order: { depth: 'ASC' },
		});

		return closures
			.filter((c) => c.ancestorId !== commentId)
			.map((c) => c.ancestor);
	}

	async getCommentDescendants(commentId: string): Promise<Comment[]> {
		const closures = await this.closureRepository.find({
			where: { ancestorId: commentId },
			relations: ['descendant', 'descendant.author'],
			order: { depth: 'ASC' },
		});

		return closures
			.filter((c) => c.descendantId !== commentId)
			.map((c) => c.descendant);
	}

	async deleteComment(
		commentId: string,
		userId: string,
		isAdmin = false,
	): Promise<void> {
		const comment = await this.commentRepository.findOne({
			where: { id: commentId },
			relations: ['author'],
		});

		if (!comment) {
			throw new NotFoundException('Comment not found');
		}

		if (comment.author.id !== userId && !isAdmin) {
			throw new ForbiddenException('You can only delete your own comments');
		}

		const descendants = await this.getCommentDescendants(commentId);
		const totalCount = 1 + descendants.length;

		await this.commentRepository.manager.transaction(async (manager) => {
			const commentRepo = manager.getRepository(Comment);
			const postRepo = manager.getRepository(Post);
			const idsToDelete = [commentId, ...descendants.map((d) => d.id)];
			await commentRepo.softDelete(idsToDelete);

			await postRepo
				.createQueryBuilder()
				.update(Post)
				.set({
					commentCount: () =>
						`GREATEST(0, "commentCount" - ${Math.max(1, totalCount)})`,
				})
				.where('id = :postId', { postId: comment.postId })
				.execute();

			this.logger.info({ commentId }, 'Comment and descendants deleted');
		});

		await this.cache?.invalidate(COMMENTS_CACHE_NAMESPACE);

		this.socketService?.emitToPost(comment.postId, 'comment_deleted', {
			commentId,
			postId: comment.postId,
		});
	}

	async updateComment(
		commentId: string,
		content: string,
		userId: string,
	): Promise<Comment> {
		const comment = await this.commentRepository.findOne({
			where: { id: commentId },
			relations: ['author'],
		});

		if (!comment) {
			throw new NotFoundException('Comment not found');
		}

		if (comment.author.id !== userId) {
			throw new ForbiddenException('You can only update your own comments');
		}

		comment.content = content;
		const saved = await this.commentRepository.save(comment);
		await this.cache?.invalidate(COMMENTS_CACHE_NAMESPACE);
		return saved;
	}

	async hide(commentId: string, adminId: string, reason: string): Promise<Comment> {
		const comment = await this.commentRepository.findOneBy({ id: commentId });
		if (!comment) {
			throw new NotFoundException(`Comment #${commentId} not found`);
		}

		comment.isHidden = true;
		comment.hiddenReason = reason;
		const saved = await this.commentRepository.save(comment);
		await this.cache?.invalidate(COMMENTS_CACHE_NAMESPACE);

		this.socketService?.emitToPost(comment.postId, 'comment_hidden', {
			commentId,
			postId: comment.postId,
			reason,
		});

		return saved;
	}

	async unhide(commentId: string, adminId: string): Promise<Comment> {
		const comment = await this.commentRepository.findOneBy({ id: commentId });
		if (!comment) {
			throw new NotFoundException(`Comment #${commentId} not found`);
		}

		comment.isHidden = false;
		comment.hiddenReason = null;
		const saved = await this.commentRepository.save(comment);
		await this.cache?.invalidate(COMMENTS_CACHE_NAMESPACE);

		this.socketService?.emitToPost(comment.postId, 'comment_unhidden', {
			commentId,
			postId: comment.postId,
		});

		return saved;
	}
}
