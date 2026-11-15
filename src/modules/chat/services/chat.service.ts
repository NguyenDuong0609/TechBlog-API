import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
	Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatConversation } from '../entities/chat-conversation.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { User } from '../../users/entities/user.entity';
import { SocketService } from '../../socket/services/socket.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { NotificationType } from '@common/enums';
import { QueryMessagesDto } from '../dto/query-messages.dto';

@Injectable()
export class ChatService {
	constructor(
		@InjectRepository(ChatConversation)
		private readonly convRepo: Repository<ChatConversation>,
		@InjectRepository(ChatMessage)
		private readonly messageRepo: Repository<ChatMessage>,
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,
		@Optional() private readonly socketService?: SocketService,
		@Optional() private readonly notificationsService?: NotificationsService,
	) {}

	async findOrCreateConversation(
		userAId: string,
		userBId: string,
	): Promise<ChatConversation> {
		if (userAId === userBId) {
			throw new BadRequestException('Cannot start conversation with yourself');
		}

		const userB = await this.userRepo.findOneBy({ id: userBId });
		if (!userB) {
			throw new NotFoundException(`User #${userBId} not found`);
		}

		// Look for existing 1-on-1 conversation
		const existing = await this.convRepo
			.createQueryBuilder('conv')
			.innerJoin('conv.participants', 'p1', 'p1.id = :userAId', { userAId })
			.innerJoin('conv.participants', 'p2', 'p2.id = :userBId', { userBId })
			.leftJoinAndSelect('conv.participants', 'participants')
			.getOne();

		if (existing) {
			return existing;
		}

		const userA = await this.userRepo.findOneBy({ id: userAId });
		if (!userA) {
			throw new NotFoundException(`User #${userAId} not found`);
		}

		const conversation = this.convRepo.create({
			participants: [userA, userB],
			lastMessageAt: new Date(),
		});

		return this.convRepo.save(conversation);
	}

	async getMyConversations(userId: string) {
		const conversations = await this.convRepo
			.createQueryBuilder('conv')
			.innerJoin('conv.participants', 'filterUser', 'filterUser.id = :userId', { userId })
			.leftJoinAndSelect('conv.participants', 'participants')
			.orderBy('conv.lastMessageAt', 'DESC', 'NULLS LAST')
			.addOrderBy('conv.created_at', 'DESC')
			.getMany();

		const result = [];
		for (const conv of conversations) {
			const otherParticipant = conv.participants.find((p) => p.id !== userId);

			const lastMessage = await this.messageRepo.findOne({
				where: { conversationId: conv.id },
				order: { created_at: 'DESC' },
			});

			const unreadCount = await this.messageRepo
				.createQueryBuilder('msg')
				.where('msg.conversationId = :convId', { convId: conv.id })
				.andWhere('msg.senderId != :userId', { userId })
				.andWhere('msg.isRead = false')
				.getCount();

			result.push({
				id: conv.id,
				lastMessageAt: conv.lastMessageAt,
				createdAt: conv.created_at,
				otherParticipant: otherParticipant
					? {
							id: otherParticipant.id,
							fullName: otherParticipant.fullName,
							avatarUrl: otherParticipant.avatarUrl,
						}
					: null,
				lastMessage: lastMessage
					? {
							id: lastMessage.id,
							content: lastMessage.content,
							senderId: lastMessage.senderId,
							createdAt: lastMessage.created_at,
							isRead: lastMessage.isRead,
						}
					: null,
				unreadCount,
			});
		}

		return result;
	}

	async getMessages(
		conversationId: string,
		userId: string,
		query: QueryMessagesDto,
	) {
		await this.assertParticipant(conversationId, userId);

		const [items, count] = await this.messageRepo.findAndCount({
			where: { conversationId },
			order: { created_at: 'DESC' },
			skip: query.offset || 0,
			take: query.limit || 50,
			relations: ['sender'],
		});

		return {
			items: items.reverse().map((msg) => ({
				id: msg.id,
				conversationId: msg.conversationId,
				content: msg.content,
				isRead: msg.isRead,
				createdAt: msg.created_at,
				sender: {
					id: msg.sender?.id,
					fullName: msg.sender?.fullName,
					avatarUrl: msg.sender?.avatarUrl,
				},
			})),
			total: count,
		};
	}

	async sendMessage(
		conversationId: string,
		senderId: string,
		content: string,
	): Promise<ChatMessage> {
		const conversation = await this.assertParticipant(conversationId, senderId);

		const message = this.messageRepo.create({
			conversationId,
			senderId,
			content,
			isRead: false,
		});

		const saved = await this.messageRepo.save(message);

		conversation.lastMessageAt = new Date();
		await this.convRepo.save(conversation);

		const sender = await this.userRepo.findOneBy({ id: senderId });

		const payload = {
			id: saved.id,
			conversationId: saved.conversationId,
			content: saved.content,
			isRead: saved.isRead,
			createdAt: saved.created_at,
			sender: {
				id: sender?.id,
				fullName: sender?.fullName,
				avatarUrl: sender?.avatarUrl,
			},
		};

		// Realtime emit to conversation room
		this.socketService?.emitToConversation(conversationId, 'new_message', payload);

		// Notify other participant
		const recipient = conversation.participants.find((p) => p.id !== senderId);
		if (recipient) {
			this.notificationsService
				?.create({
					type: NotificationType.NEW_MESSAGE,
					title: `Tin nhắn mới từ ${sender?.fullName || 'Người dùng'}`,
					message: content.length > 60 ? `${content.substring(0, 60)}...` : content,
					userId: recipient.id,
					actorId: senderId,
					data: { conversationId, messageId: saved.id },
				})
				.catch(() => {});
		}

		return saved;
	}

	async markMessagesAsRead(
		conversationId: string,
		userId: string,
	): Promise<void> {
		await this.assertParticipant(conversationId, userId);

		await this.messageRepo
			.createQueryBuilder()
			.update(ChatMessage)
			.set({ isRead: true })
			.where('conversationId = :conversationId', { conversationId })
			.andWhere('senderId != :userId', { userId })
			.andWhere('isRead = false')
			.execute();
	}

	private async assertParticipant(
		conversationId: string,
		userId: string,
	): Promise<ChatConversation> {
		const conversation = await this.convRepo.findOne({
			where: { id: conversationId },
			relations: ['participants'],
		});

		if (!conversation) {
			throw new NotFoundException(`Conversation #${conversationId} not found`);
		}

		const isMember = conversation.participants.some((p) => p.id === userId);
		if (!isMember) {
			throw new ForbiddenException('You are not a participant in this conversation');
		}

		return conversation;
	}
}

