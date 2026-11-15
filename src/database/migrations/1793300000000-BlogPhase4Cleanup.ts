import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlogPhase4Cleanup1793300000000 implements MigrationInterface {
	name = 'BlogPhase4Cleanup1793300000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Drop legacy boilerplate tables if they exist
		await queryRunner.query(`
			DROP TABLE IF EXISTS "checkin_stats" CASCADE;
			DROP TABLE IF EXISTS "checkins" CASCADE;
			DROP TABLE IF EXISTS "flash_card_states" CASCADE;
			DROP TABLE IF EXISTS "flash_cards" CASCADE;
			DROP TABLE IF EXISTS "collections" CASCADE;
			DROP TABLE IF EXISTS "topics" CASCADE;
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// No rollback needed for dropping legacy tables
	}
}
