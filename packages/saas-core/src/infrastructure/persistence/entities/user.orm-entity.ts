import { Entity, PrimaryKey, Property, Unique, Index } from '@mikro-orm/core';

@Entity({ tableName: 'users' })
export class UserOrmEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'varchar', length: 50 })
  @Unique()
  @Index()
  username!: string;

  @Property({ type: 'varchar', length: 255 })
  @Unique()
  @Index()
  email!: string;

  @Property({ type: 'varchar', length: 20, nullable: true })
  phoneNumber?: string;

  @Property({ type: 'varchar', length: 20 })
  @Index()
  status!: string;

  @Property({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Property({ type: 'boolean', default: false })
  phoneVerified!: boolean;

  @Property({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Property({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Property({ type: 'timestamp' })
  createdAt!: Date;

  @Property({ type: 'timestamp' })
  updatedAt!: Date;

  @Property({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Property({ type: 'varchar', length: 50 })
  createdBy!: string;

  @Property({ type: 'varchar', length: 50 })
  updatedBy!: string;

  @Property({ type: 'int', default: 1 })
  version!: number;
}

