import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlogCoreEntities1793000000000 implements MigrationInterface {
	name = 'BlogCoreEntities1793000000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// 1. Expand User table
		await queryRunner.query(`
			ALTER TABLE "users"
			ADD COLUMN IF NOT EXISTS "bio" text,
			ADD COLUMN IF NOT EXISTS "avatarUrl" character varying(500),
			ADD COLUMN IF NOT EXISTS "socialLinks" jsonb DEFAULT '{}',
			ADD COLUMN IF NOT EXISTS "postCount" integer NOT NULL DEFAULT 0;
		`);

		// 2. Add Author to user_role_enum if type exists
		await queryRunner.query(`
			DO $$
			BEGIN
				IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
					ALTER TYPE "user_role_enum" ADD VALUE IF NOT EXISTS 'Author';
				END IF;
			END$$;
		`);

		// 3. Create Enums
		await queryRunner.query(`
			DO $$
			BEGIN
				IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_status_enum') THEN
					CREATE TYPE "post_status_enum" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED');
				END IF;
				IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_level_enum') THEN
					CREATE TYPE "post_level_enum" AS ENUM ('basic', 'series', 'lab', 'advanced');
				END IF;
			END$$;
		`);

		// 4. Create Categories table
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "categories" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
				"deleted_at" TIMESTAMP,
				"name" character varying(100) NOT NULL,
				"slug" character varying(120) NOT NULL,
				"description" text,
				"color" character varying(50),
				"icon" character varying(100),
				"postCount" integer NOT NULL DEFAULT 0,
				CONSTRAINT "PK_categories_id" PRIMARY KEY ("id"),
				CONSTRAINT "UQ_categories_slug" UNIQUE ("slug")
			);
			CREATE UNIQUE INDEX IF NOT EXISTS "idx_categories_slug" ON "categories" ("slug");
		`);

		// 5. Create Tags table
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "tags" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
				"deleted_at" TIMESTAMP,
				"name" character varying(80) NOT NULL,
				"slug" character varying(100) NOT NULL,
				"usageCount" integer NOT NULL DEFAULT 0,
				CONSTRAINT "PK_tags_id" PRIMARY KEY ("id"),
				CONSTRAINT "UQ_tags_slug" UNIQUE ("slug")
			);
			CREATE UNIQUE INDEX IF NOT EXISTS "idx_tags_slug" ON "tags" ("slug");
		`);

		// 6. Create Posts table
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "posts" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
				"deleted_at" TIMESTAMP,
				"title" character varying(255) NOT NULL,
				"slug" character varying(255) NOT NULL,
				"content" text NOT NULL,
				"excerpt" text,
				"coverImage" character varying(500),
				"status" "post_status_enum" NOT NULL DEFAULT 'DRAFT',
				"level" "post_level_enum" NOT NULL DEFAULT 'basic',
				"viewCount" integer NOT NULL DEFAULT 0,
				"readingTime" integer NOT NULL DEFAULT 1,
				"reactionCount" integer NOT NULL DEFAULT 0,
				"commentCount" integer NOT NULL DEFAULT 0,
				"isFeatured" boolean NOT NULL DEFAULT false,
				"isEditorsChoice" boolean NOT NULL DEFAULT false,
				"publishedAt" TIMESTAMP WITH TIME ZONE,
				"metaTitle" character varying(255),
				"metaDescription" character varying(500),
				"rejectReason" text,
				"authorId" uuid NOT NULL,
				"categoryId" uuid,
				CONSTRAINT "PK_posts_id" PRIMARY KEY ("id"),
				CONSTRAINT "UQ_posts_slug" UNIQUE ("slug"),
				CONSTRAINT "FK_posts_author" FOREIGN KEY ("authorId")
					REFERENCES "users"("id") ON DELETE CASCADE,
				CONSTRAINT "FK_posts_category" FOREIGN KEY ("categoryId")
					REFERENCES "categories"("id") ON DELETE SET NULL
			);
			CREATE UNIQUE INDEX IF NOT EXISTS "idx_posts_slug" ON "posts" ("slug");
			CREATE INDEX IF NOT EXISTS "idx_posts_status" ON "posts" ("status");
			CREATE INDEX IF NOT EXISTS "idx_posts_author_id" ON "posts" ("authorId");
			CREATE INDEX IF NOT EXISTS "idx_posts_published_at" ON "posts" ("publishedAt");
			CREATE INDEX IF NOT EXISTS "idx_posts_category_id" ON "posts" ("categoryId");
			CREATE INDEX IF NOT EXISTS "idx_posts_level" ON "posts" ("level");
		`);

		// 7. Create post_tags join table
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "post_tags" (
				"postId" uuid NOT NULL,
				"tagId" uuid NOT NULL,
				CONSTRAINT "PK_post_tags" PRIMARY KEY ("postId", "tagId"),
				CONSTRAINT "FK_post_tags_post" FOREIGN KEY ("postId")
					REFERENCES "posts"("id") ON DELETE CASCADE,
				CONSTRAINT "FK_post_tags_tag" FOREIGN KEY ("tagId")
					REFERENCES "tags"("id") ON DELETE CASCADE
			);
			CREATE INDEX IF NOT EXISTS "idx_post_tags_tag_id" ON "post_tags" ("tagId");
		`);

		// 8. Create Series table
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "series" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
				"deleted_at" TIMESTAMP,
				"title" character varying(200) NOT NULL,
				"slug" character varying(220) NOT NULL,
				"description" text,
				"coverImage" character varying(500),
				"postCount" integer NOT NULL DEFAULT 0,
				"authorId" uuid NOT NULL,
				CONSTRAINT "PK_series_id" PRIMARY KEY ("id"),
				CONSTRAINT "UQ_series_slug" UNIQUE ("slug"),
				CONSTRAINT "FK_series_author" FOREIGN KEY ("authorId")
					REFERENCES "users"("id") ON DELETE CASCADE
			);
			CREATE UNIQUE INDEX IF NOT EXISTS "idx_series_slug" ON "series" ("slug");
			CREATE INDEX IF NOT EXISTS "idx_series_author_id" ON "series" ("authorId");
		`);

		// 9. Create series_posts table
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "series_posts" (
				"id" uuid NOT NULL DEFAULT gen_random_uuid(),
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
				"deleted_at" TIMESTAMP,
				"seriesId" uuid NOT NULL,
				"postId" uuid NOT NULL,
				"order" integer NOT NULL DEFAULT 0,
				CONSTRAINT "PK_series_posts_id" PRIMARY KEY ("id"),
				CONSTRAINT "UQ_series_post" UNIQUE ("seriesId", "postId"),
				CONSTRAINT "FK_series_posts_series" FOREIGN KEY ("seriesId")
					REFERENCES "series"("id") ON DELETE CASCADE,
				CONSTRAINT "FK_series_posts_post" FOREIGN KEY ("postId")
					REFERENCES "posts"("id") ON DELETE CASCADE
			);
			CREATE INDEX IF NOT EXISTS "idx_series_posts_series_id" ON "series_posts" ("seriesId");
			CREATE INDEX IF NOT EXISTS "idx_series_posts_post_id" ON "series_posts" ("postId");
			CREATE INDEX IF NOT EXISTS "idx_series_posts_order" ON "series_posts" ("seriesId", "order");
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS "series_posts";`);
		await queryRunner.query(`DROP TABLE IF EXISTS "series";`);
		await queryRunner.query(`DROP TABLE IF EXISTS "post_tags";`);
		await queryRunner.query(`DROP TABLE IF EXISTS "posts";`);
		await queryRunner.query(`DROP TABLE IF EXISTS "tags";`);
		await queryRunner.query(`DROP TABLE IF EXISTS "categories";`);
		await queryRunner.query(`DROP TYPE IF EXISTS "post_level_enum";`);
		await queryRunner.query(`DROP TYPE IF EXISTS "post_status_enum";`);
		await queryRunner.query(`
			ALTER TABLE "users"
			DROP COLUMN IF EXISTS "bio",
			DROP COLUMN IF EXISTS "avatarUrl",
			DROP COLUMN IF EXISTS "socialLinks",
			DROP COLUMN IF EXISTS "postCount";
		`);
	}
}

