/**
 * 初始化数据库架构迁移
 *
 * @description 创建 SAAS Core 模块的初始数据库表结构
 *
 * ## 创建的表
 * - tenants: 租户表
 * - tenant_configurations: 租户配置表
 * - event_store: 事件存储表
 * - snapshot_store: 快照存储表
 *
 * @class Migration001_InitialSchema
 * @since 1.0.0
 */

import { Migration } from '@mikro-orm/migrations';

export class Migration001_InitialSchema extends Migration {
  async up(): Promise<void> {
    // 创建租户表
    this.addSql(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY,
        code VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        domain VARCHAR(255) NOT NULL UNIQUE,
        type VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL,
        trial_ends_at TIMESTAMP NULL,
        activated_at TIMESTAMP NULL,
        tenant_id UUID NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        created_by VARCHAR(50) NOT NULL,
        updated_by VARCHAR(50) NOT NULL,
        deleted_by VARCHAR(50) NULL,
        version INT NOT NULL DEFAULT 1
      );
    `);

    // 创建索引
    this.addSql(`CREATE INDEX idx_tenants_code ON tenants(code);`);
    this.addSql(`CREATE INDEX idx_tenants_domain ON tenants(domain);`);
    this.addSql(`CREATE INDEX idx_tenants_tenant_id ON tenants(tenant_id);`);
    this.addSql(`CREATE INDEX idx_tenants_status ON tenants(status);`);
    this.addSql(`CREATE INDEX idx_tenants_type ON tenants(type);`);

    // 创建租户配置表
    this.addSql(`
      CREATE TABLE IF NOT EXISTS tenant_configurations (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL,
        max_users INT NOT NULL,
        max_storage_mb INT NOT NULL,
        max_organizations INT NOT NULL,
        max_department_levels INT NOT NULL,
        max_api_calls_per_day INT NOT NULL,
        enabled_features JSONB NOT NULL DEFAULT '[]',
        custom_settings JSONB NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(50) NOT NULL,
        updated_by VARCHAR(50) NOT NULL,
        version INT NOT NULL DEFAULT 1,
        CONSTRAINT fk_tenant_config_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);

    this.addSql(`CREATE INDEX idx_tenant_config_tenant_id ON tenant_configurations(tenant_id);`);

    // 创建事件存储表
    this.addSql(`
      CREATE TABLE IF NOT EXISTS event_store (
        id VARCHAR(50) PRIMARY KEY,
        aggregate_type VARCHAR(50) NOT NULL,
        aggregate_id VARCHAR(50) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB NOT NULL,
        metadata JSONB NOT NULL,
        version INT NOT NULL,
        tenant_id VARCHAR(50) NOT NULL,
        occurred_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.addSql(`CREATE INDEX idx_event_store_aggregate ON event_store(aggregate_type, aggregate_id);`);
    this.addSql(`CREATE INDEX idx_event_store_tenant_id ON event_store(tenant_id);`);
    this.addSql(`CREATE INDEX idx_event_store_version ON event_store(aggregate_type, aggregate_id, version);`);

    // 创建快照存储表
    this.addSql(`
      CREATE TABLE IF NOT EXISTS snapshot_store (
        id VARCHAR(50) PRIMARY KEY,
        aggregate_type VARCHAR(50) NOT NULL,
        aggregate_id VARCHAR(50) NOT NULL,
        snapshot_data JSONB NOT NULL,
        version INT NOT NULL,
        tenant_id VARCHAR(50) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.addSql(`CREATE INDEX idx_snapshot_store_aggregate ON snapshot_store(aggregate_type, aggregate_id);`);
    this.addSql(`CREATE INDEX idx_snapshot_store_version ON snapshot_store(aggregate_type, aggregate_id, version DESC);`);
  }

  override async down(): Promise<void> {
    // 按依赖关系反向删除表
    this.addSql(`DROP TABLE IF EXISTS snapshot_store;`);
    this.addSql(`DROP TABLE IF EXISTS event_store;`);
    this.addSql(`DROP TABLE IF EXISTS tenant_configurations;`);
    this.addSql(`DROP TABLE IF EXISTS tenants;`);
  }
}

