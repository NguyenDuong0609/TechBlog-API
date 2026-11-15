import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlogPhase3Entities1793200000000 implements MigrationInterface {
	name = 'BlogPhase3Entities1793200000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// 0. Add isActive column to users table
		await queryRunner.query(`
			ALTER TABLE "users"
			ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
		`);

		// 1. Chat Conversations table
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "chat_conversations" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
				"deleted_at" TIMESTAMP,
				"lastMessageAt" TIMESTAMP,
				CONSTRAINT "PK_chat_conversations_id" PRIMARY KEY ("id")
			);
		`);

		// 2. Conversation Participants join table
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "conversation_participants" (
				"conversationId" uuid NOT NULL,
				"userId" uuid NOT NULL,
				CONSTRAINT "PK_conversation_participants" PRIMARY KEY ("conversationId", "userId"),
				CONSTRAINT "FK_conversation_participants_conv" FOREIGN KEY ("conversationId")
					REFERENCES "chat_conversations"("id") ON DELETE CASCADE,
				CONSTRAINT "FK_conversation_participants_user" FOREIGN KEY ("userId")
					REFERENCES "users"("id") ON DELETE CASCADE
			);
			CREATE INDEX IF NOT EXISTS "idx_conversation_participants_user"
			ON "conversation_participants" ("userId");
		`);

		// 3. Chat Messages table
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "chat_messages" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
				"deleted_at" TIMESTAMP,
				"conversationId" uuid NOT NULL,
				"senderId" uuid NOT NULL,
				"content" text NOT NULL,
				"isRead" boolean NOT NULL DEFAULT false,
				CONSTRAINT "PK_chat_messages_id" PRIMARY KEY ("id"),
				CONSTRAINT "FK_chat_messages_conv" FOREIGN KEY ("conversationId")
					REFERENCES "chat_conversations"("id") ON DELETE CASCADE,
				CONSTRAINT "FK_chat_messages_sender" FOREIGN KEY ("senderId")
					REFERENCES "users"("id") ON DELETE CASCADE
			);
			CREATE INDEX IF NOT EXISTS "idx_chat_messages_conv_created"
			ON "chat_messages" ("conversationId", "created_at" ASC);
			CREATE INDEX IF NOT EXISTS "idx_chat_messages_sender"
			ON "chat_messages" ("senderId");
		`);

		// 4. System Settings table
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "settings" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
				"deleted_at" TIMESTAMP,
				"key" character varying(255) NOT NULL,
				"value" jsonb NOT NULL,
				"description" character varying(500),
				"isPublic" boolean NOT NULL DEFAULT false,
				CONSTRAINT "UQ_settings_key" UNIQUE ("key"),
				CONSTRAINT "PK_settings_id" PRIMARY KEY ("id")
			);
			CREATE INDEX IF NOT EXISTS "idx_settings_key" ON "settings" ("key");
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS "settings";`);
		await queryRunner.query(`DROP TABLE IF EXISTS "chat_messages";`);
		await queryRunner.query(`DROP TABLE IF EXISTS "conversation_participants";`);
		await queryRunner.query(`DROP TABLE IF EXISTS "chat_conversations";`);
	}
}
