import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlogPhase2Entities1793100000000 implements MigrationInterface {
	name = 'BlogPhase2Entities1793100000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// 1. Expand Comments table with moderation fields
		await queryRunner.query(`
			ALTER TABLE "comments"
			ADD COLUMN IF NOT EXISTS "isHidden" boolean NOT NULL DEFAULT false,
			ADD COLUMN IF NOT EXISTS "hiddenReason" character varying(255);
		`);

		// 2. Create Notification Type Enum if not exists
		await queryRunner.query(`
			DO $$
			BEGIN
				IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type_enum') THEN
					CREATE TYPE "notification_type_enum" AS ENUM (
						'NEW_COMMENT',
						'REPLY',
						'POST_APPROVED',
						'POST_REJECTED',
						'POST_PENDING',
						'MENTION',
						'NEW_MESSAGE',
						'SYSTEM',
						'NEW_POST_FROM_FOLLOWING',
						'NEW_POST_IN_CATEGORY'
					);
				END IF;
			END$$;
		`);

		// 3. Create Notifications table
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "notifications" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
				"deleted_at" TIMESTAMP,
				"type" "notification_type_enum" NOT NULL,
				"title" character varying(255) NOT NULL,
				"message" text,
				"data" jsonb,
				"isRead" boolean NOT NULL DEFAULT false,
				"userId" uuid NOT NULL,
				"actorId" uuid,
				CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id"),
				CONSTRAINT "FK_notifications_user" FOREIGN KEY ("userId")
					REFERENCES "users"("id") ON DELETE CASCADE,
				CONSTRAINT "FK_notifications_actor" FOREIGN KEY ("actorId")
					REFERENCES "users"("id") ON DELETE SET NULL
			);
			CREATE INDEX IF NOT EXISTS "idx_notifications_user_unread"
			ON "notifications" ("userId", "isRead", "created_at" DESC);
			CREATE INDEX IF NOT EXISTS "idx_notifications_user_id"
			ON "notifications" ("userId");
		`);

		// 4. Create User Follows table (Author Follow)
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "user_follows" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
				"deleted_at" TIMESTAMP,
				"followerId" uuid NOT NULL,
				"followingId" uuid NOT NULL,
				CONSTRAINT "PK_user_follows_id" PRIMARY KEY ("id"),
				CONSTRAINT "UQ_user_follows" UNIQUE ("followerId", "followingId"),
				CONSTRAINT "FK_user_follows_follower" FOREIGN KEY ("followerId")
					REFERENCES "users"("id") ON DELETE CASCADE,
				CONSTRAINT "FK_user_follows_following" FOREIGN KEY ("followingId")
					REFERENCES "users"("id") ON DELETE CASCADE
			);
			CREATE INDEX IF NOT EXISTS "idx_user_follows_follower" ON "user_follows" ("followerId");
			CREATE INDEX IF NOT EXISTS "idx_user_follows_following" ON "user_follows" ("followingId");
		`);

		// 5. Create Category Follows table
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "category_follows" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
				"deleted_at" TIMESTAMP,
				"userId" uuid NOT NULL,
				"categoryId" uuid NOT NULL,
				CONSTRAINT "PK_category_follows_id" PRIMARY KEY ("id"),
				CONSTRAINT "UQ_category_follows" UNIQUE ("userId", "categoryId"),
				CONSTRAINT "FK_category_follows_user" FOREIGN KEY ("userId")
					REFERENCES "users"("id") ON DELETE CASCADE,
				CONSTRAINT "FK_category_follows_category" FOREIGN KEY ("categoryId")
					REFERENCES "categories"("id") ON DELETE CASCADE
			);
			CREATE INDEX IF NOT EXISTS "idx_category_follows_user" ON "category_follows" ("userId");
			CREATE INDEX IF NOT EXISTS "idx_category_follows_category" ON "category_follows" ("categoryId");
		`);

		// 6. Create Post Reactions table
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "post_reactions" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
				"deleted_at" TIMESTAMP,
				"postId" uuid NOT NULL,
				"userId" uuid NOT NULL,
				"type" character varying(20) NOT NULL DEFAULT 'like',
				CONSTRAINT "PK_post_reactions_id" PRIMARY KEY ("id"),
				CONSTRAINT "UQ_post_reactions" UNIQUE ("postId", "userId", "type"),
				CONSTRAINT "FK_post_reactions_post" FOREIGN KEY ("postId")
					REFERENCES "posts"("id") ON DELETE CASCADE,
				CONSTRAINT "FK_post_reactions_user" FOREIGN KEY ("userId")
					REFERENCES "users"("id") ON DELETE CASCADE
			);
			CREATE INDEX IF NOT EXISTS "idx_post_reactions_post" ON "post_reactions" ("postId");
			CREATE INDEX IF NOT EXISTS "idx_post_reactions_user" ON "post_reactions" ("userId");
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS "post_reactions";`);
		await queryRunner.query(`DROP TABLE IF EXISTS "category_follows";`);
		await queryRunner.query(`DROP TABLE IF EXISTS "user_follows";`);
		await queryRunner.query(`DROP TABLE IF EXISTS "notifications";`);
		await queryRunner.query(`DROP TYPE IF EXISTS "notification_type_enum";`);
		await queryRunner.query(`
			ALTER TABLE "comments"
			DROP COLUMN IF EXISTS "isHidden",
			DROP COLUMN IF EXISTS "hiddenReason";
		`);
	}
}

