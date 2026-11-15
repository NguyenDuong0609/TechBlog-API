import { BaseEntity } from '@modules/shared/base/base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('settings')
export class Setting extends BaseEntity {
	@Column({ type: 'varchar', length: 255, unique: true })
	@Index('idx_settings_key')
	key: string;

	@Column({ type: 'jsonb' })
	value: any;

	@Column({ type: 'varchar', length: 500, nullable: true })
	description: string;

	@Column({ type: 'boolean', default: false })
	isPublic: boolean;
}
