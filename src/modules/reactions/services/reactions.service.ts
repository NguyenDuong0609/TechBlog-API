import {
	Injectable,
	NotFoundException,
	Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostReaction } from '../entities/post-reaction.entity';
import { Post } from '../../posts/entities/post.entity';
import { SocketService } from '../../socket/services/socket.service';

@Injectable()
export class ReactionsService {
	constructor(
		@InjectRepository(PostReaction)
		private readonly reactionRepo: Repository<PostReaction>,
		@InjectRepository(Post)
		private readonly postRepo: Repository<Post>,
		@Optional() private readonly socketService?: SocketService,
	) {}

	async toggleReaction(
		postId: string,
		userId: string,
		type = 'like',
	): Promise<{ reacted: boolean; reactionCount: number; type: string }> {
		const post = await this.postRepo.findOneBy({ id: postId });
		if (!post) {
			throw new NotFoundException(`Post #${postId} not found`);
		}

		const existing = await this.reactionRepo.findOneBy({
			postId,
			userId,
			type,
		});

		let reacted = false;
		let updatedCount = post.reactionCount;

		if (existing) {
			await this.reactionRepo.remove(existing);
			await this.postRepo
				.createQueryBuilder()
				.update(Post)
				.set({
					reactionCount: () => 'GREATEST(0, "reactionCount" - 1)',
				})
				.where('id = :postId', { postId })
				.execute();
			updatedCount = Math.max(0, post.reactionCount - 1);
			reacted = false;
		} else {
			await this.reactionRepo.save(
				this.reactionRepo.create({ postId, userId, type }),
			);
			await this.postRepo.increment({ id: postId }, 'reactionCount', 1);
			updatedCount = post.reactionCount + 1;
			reacted = true;
		}

		// Emit realtime reaction update to all readers in post room
		this.socketService?.emitToPost(postId, 'reaction_updated', {
			postId,
			reactionCount: updatedCount,
			reacted,
			type,
		});

		return { reacted, reactionCount: updatedCount, type };
	}

	async getMyReaction(
		postId: string,
		userId: string,
	): Promise<{ reacted: boolean; reactions: string[] }> {
		const found = await this.reactionRepo.find({
			where: { postId, userId },
			select: ['type'],
		});

		return {
			reacted: found.length > 0,
			reactions: found.map((r) => r.type),
		};
	}

	async getReactionCount(postId: string): Promise<number> {
		const post = await this.postRepo.findOne({
			where: { id: postId },
			select: ['reactionCount'],
		});
		return post?.reactionCount ?? 0;
	}
}

