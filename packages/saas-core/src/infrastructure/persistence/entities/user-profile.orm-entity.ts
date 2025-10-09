import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';

@Entity({ tableName: 'user_profiles' })
export class UserProfileOrmEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'uuid' })
  @Index()
  userId!: string;

  @Property({ type: 'varchar', length: 100, nullable: true })
  fullName?: string;

  @Property({ type: 'varchar', length: 50, nullable: true })
  nickname?: string;

  @Property({ type: 'varchar', length: 500, nullable: true })
  avatar?: string;

  @Property({ type: 'varchar', length: 20, nullable: true })
  gender?: string;

  @Property({ type: 'date', nullable: true })
  birthday?: Date;

  @Property({ type: 'varchar', length: 500, nullable: true })
  bio?: string;

  @Property({ type: 'varchar', length: 50, default: 'Asia/Shanghai' })
  timezone!: string;

  @Property({ type: 'varchar', length: 10, default: 'zh-CN' })
  language!: string;

  @Property({ type: 'uuid' })
  tenantId!: string;

  @Property({ type: 'timestamp' })
  createdAt!: Date;

  @Property({ type: 'timestamp' })
  updatedAt!: Date;

  @Property({ type: 'varchar', length: 50 })
  createdBy!: string;

  @Property({ type: 'varchar', length: 50 })
  updatedBy!: string;

  @Property({ type: 'int', default: 1 })
  version!: number;
}

