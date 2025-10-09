import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';

@Entity({ tableName: 'user_credentials' })
export class UserCredentialsOrmEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'uuid' })
  @Index()
  userId!: string;

  @Property({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Property({ type: 'varchar', length: 255 })
  passwordSalt!: string;

  @Property({ type: 'int', default: 0 })
  failedLoginAttempts!: number;

  @Property({ type: 'timestamp', nullable: true })
  lockedUntil?: Date;

  @Property({ type: 'timestamp', nullable: true })
  passwordChangedAt?: Date;

  @Property({ type: 'boolean', default: false })
  mfaEnabled!: boolean;

  @Property({ type: 'varchar', length: 255, nullable: true })
  mfaSecret?: string;

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

