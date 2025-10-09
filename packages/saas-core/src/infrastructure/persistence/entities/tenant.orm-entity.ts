/**
 * 租户 ORM 实体
 *
 * @description MikroORM 实体定义，用于租户数据的持久化
 *
 * ## 注意事项
 * - 这是 ORM 层的实体，与领域模型分离
 * - 包含 MikroORM 装饰器
 * - 通过映射器转换为领域模型
 *
 * @class TenantOrmEntity
 * @since 1.0.0
 */

import {
  Entity,
  PrimaryKey,
  Property,
  Unique,
  Index,
  OneToOne,
} from '@mikro-orm/core';

@Entity({ tableName: 'tenants' })
export class TenantOrmEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'varchar', length: 20 })
  @Unique()
  @Index()
  code!: string;

  @Property({ type: 'varchar', length: 100 })
  name!: string;

  @Property({ type: 'varchar', length: 255 })
  @Unique()
  @Index()
  domain!: string;

  @Property({ type: 'varchar', length: 20 })
  @Index()
  type!: string;

  @Property({ type: 'varchar', length: 20 })
  @Index()
  status!: string;

  @Property({ type: 'timestamp', nullable: true })
  trialEndsAt?: Date;

  @Property({ type: 'timestamp', nullable: true })
  activatedAt?: Date;

  // 审计字段
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

  @Property({ type: 'varchar', length: 50, nullable: true })
  deletedBy?: string;

  @Property({ type: 'int', default: 1 })
  version!: number;
}

