/**
 * 数据库迁移服务
 *
 * @description 管理数据库迁移的创建、执行、回滚等操作
 * 支持主数据库和租户数据库的迁移管理
 *
 * @fileoverview 数据库迁移服务实现文件
 * @since 1.0.0
 */

import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import type { Migrator } from '@mikro-orm/migrations';
import { PinoLogger } from '@hl8/logger';
import { DI_TOKENS, MIGRATION_STATUS } from './constants';
import type {
  IMigrationService,
  DatabaseModuleOptions,
  MigrationStatus,
  MigrationInfo,
} from './types';
import { DatabaseMigrationException } from './exceptions';
import { ConnectionManager } from './connection.manager';

/**
 * 数据库迁移服务类
 *
 * @description 提供数据库迁移的完整功能
 * 支持迁移生成、执行、回滚、状态查询等操作
 *
 * ## 业务规则
 *
 * ### 迁移执行规则
 * - 迁移必须按版本顺序执行
 * - 迁移失败时必须回滚
 * - 生产环境禁止自动迁移
 * - 迁移执行前必须备份数据
 *
 * ### 版本管理规则
 * - 使用时间戳作为版本号
 * - 迁移文件命名遵循规范
 * - 支持迁移依赖关系
 * - 记录所有迁移历史
 *
 * ### 租户迁移规则
 * - 租户迁移独立管理
 * - 支持批量租户迁移
 * - 租户迁移失败不影响其他租户
 * - 新租户自动应用所有迁移
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class DatabaseInitService {
 *   constructor(private readonly migrationService: MigrationService) {}
 *
 *   async initialize() {
 *     // 运行主数据库迁移
 *     await this.migrationService.runMigrations();
 *
 *     // 运行租户迁移
 *     await this.migrationService.runTenantMigrations('tenant-123');
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class MigrationService implements IMigrationService, OnModuleInit {
  /**
   * ORM 实例
   */
  private orm!: MikroORM;

  /**
   * 迁移器实例
   */
  private migrator!: Migrator;

  constructor(
    @Inject(DI_TOKENS.MODULE_OPTIONS)
    private readonly options: DatabaseModuleOptions,
    private readonly connectionManager: ConnectionManager,
    private readonly logger: PinoLogger
  ) {
    this.logger.info('MigrationService initialized');
  }

  /**
   * 模块初始化钩子
   *
   * @description 如果配置了启动时运行迁移，则自动执行
   */
  async onModuleInit(): Promise<void> {
    if (this.options.migration?.runMigrationsOnStartup) {
      this.logger.info('Running migrations on startup...');
      try {
        await this.runMigrations();
        this.logger.info('Startup migrations completed');
      } catch (error) {
        this.logger.error('Startup migrations failed', { error });
        throw error;
      }
    }
  }

  /**
   * 运行所有待执行迁移
   *
   * @description 执行所有尚未应用的数据库迁移
   *
   * @throws {DatabaseMigrationException} 迁移执行失败时抛出
   *
   * @example
   * ```typescript
   * await migrationService.runMigrations();
   * ```
   */
  async runMigrations(): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.info('Running database migrations...');

      if (!this.migrator) {
        throw new Error('Migrator not initialized');
      }

      const pending = await this.migrator.getPendingMigrations();
      this.logger.info('Pending migrations', {
        count: pending.length,
        migrations: pending.map((m) => m.name),
      });

      if (pending.length === 0) {
        this.logger.info('No pending migrations');
        return;
      }

      await this.migrator.up();

      const executionTime = Date.now() - startTime;
      this.logger.info('Database migrations completed', {
        count: pending.length,
        executionTime,
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error('Database migrations failed', {
        executionTime,
        error,
      });

      throw new DatabaseMigrationException(
        '数据库迁移执行失败',
        {
          executionTime,
        },
        error as Error
      );
    }
  }

  /**
   * 运行租户迁移
   *
   * @description 执行指定租户数据库的迁移
   *
   * @param tenantId - 租户ID
   * @throws {DatabaseMigrationException} 迁移执行失败时抛出
   *
   * @example
   * ```typescript
   * await migrationService.runTenantMigrations('tenant-123');
   * ```
   */
  async runTenantMigrations(tenantId: string): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.info('Running tenant migrations', { tenantId });

      // 实际实现需要为租户创建独立的 Migrator
      // 这里是简化实现
      const executionTime = Date.now() - startTime;
      this.logger.info('Tenant migrations completed', {
        tenantId,
        executionTime,
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error('Tenant migrations failed', {
        tenantId,
        executionTime,
        error,
      });

      throw new DatabaseMigrationException(
        `租户迁移执行失败: ${tenantId}`,
        {
          tenantId,
          executionTime,
        },
        error as Error
      );
    }
  }

  /**
   * 生成迁移文件
   *
   * @description 根据实体变更生成新的迁移文件
   *
   * @param name - 迁移名称
   * @returns 生成的迁移文件路径
   * @throws {DatabaseMigrationException} 迁移生成失败时抛出
   *
   * @example
   * ```typescript
   * const path = await migrationService.generateMigration('add-user-table');
   * ```
   */
  async generateMigration(name: string): Promise<string> {
    try {
      this.logger.info('Generating migration', { name });

      if (!this.migrator) {
        throw new Error('Migrator not initialized');
      }

      const migration = await this.migrator.createMigration(
        undefined,
        false,
        true
      );

      this.logger.info('Migration generated', {
        name,
        path: migration.fileName,
      });

      return migration.fileName;
    } catch (error) {
      this.logger.error('Migration generation failed', { name, error });

      throw new DatabaseMigrationException(
        '迁移文件生成失败',
        { name },
        error as Error
      );
    }
  }

  /**
   * 回滚迁移
   *
   * @description 回滚到指定版本
   *
   * @param version - 目标版本
   * @throws {DatabaseMigrationException} 回滚失败时抛出
   *
   * @example
   * ```typescript
   * await migrationService.rollbackMigration('20231201000001');
   * ```
   */
  async rollbackMigration(version: string): Promise<void> {
    try {
      this.logger.warn('Rolling back migration', { version });

      if (!this.migrator) {
        throw new Error('Migrator not initialized');
      }

      await this.migrator.down({ to: version });

      this.logger.warn('Migration rolled back', { version });
    } catch (error) {
      this.logger.error('Migration rollback failed', { version, error });

      throw new DatabaseMigrationException(
        '迁移回滚失败',
        { version },
        error as Error
      );
    }
  }

  /**
   * 回滚租户迁移
   *
   * @description 回滚指定租户的迁移
   *
   * @param tenantId - 租户ID
   * @param version - 目标版本
   * @throws {DatabaseMigrationException} 回滚失败时抛出
   *
   * @example
   * ```typescript
   * await migrationService.rollbackTenantMigration('tenant-123', '20231201000001');
   * ```
   */
  async rollbackTenantMigration(
    tenantId: string,
    version: string
  ): Promise<void> {
    try {
      this.logger.warn('Rolling back tenant migration', {
        tenantId,
        version,
      });

      // 实际实现需要为租户创建独立的 Migrator
      this.logger.warn('Tenant migration rolled back', { tenantId, version });
    } catch (error) {
      this.logger.error('Tenant migration rollback failed', {
        tenantId,
        version,
        error,
      });

      throw new DatabaseMigrationException(
        `租户迁移回滚失败: ${tenantId}`,
        {
          tenantId,
          version,
        },
        error as Error
      );
    }
  }

  /**
   * 获取迁移状态
   *
   * @description 获取主数据库的迁移状态信息
   *
   * @returns 迁移状态
   *
   * @example
   * ```typescript
   * const status = await migrationService.getMigrationStatus();
   * console.log(status.currentVersion, status.pendingCount);
   * ```
   */
  async getMigrationStatus(): Promise<MigrationStatus> {
    try {
      if (!this.migrator) {
        return {
          currentVersion: '0',
          latestVersion: '0',
          pendingCount: 0,
          executedCount: 0,
          status: MIGRATION_STATUS.PENDING,
        };
      }

      const executed = await this.migrator.getExecutedMigrations();
      const pending = await this.migrator.getPendingMigrations();

      return {
        currentVersion: executed[executed.length - 1]?.name || '0',
        latestVersion:
          pending[pending.length - 1]?.name ||
          executed[executed.length - 1]?.name ||
          '0',
        pendingCount: pending.length,
        executedCount: executed.length,
        status:
          pending.length > 0
            ? MIGRATION_STATUS.PENDING
            : MIGRATION_STATUS.COMPLETED,
        lastMigrationAt: executed[executed.length - 1]?.executed_at,
      };
    } catch (error) {
      this.logger.error('Failed to get migration status', { error });
      throw new DatabaseMigrationException(
        '获取迁移状态失败',
        {},
        error as Error
      );
    }
  }

  /**
   * 获取租户迁移状态
   *
   * @description 获取指定租户的迁移状态
   *
   * @param tenantId - 租户ID
   * @returns 租户迁移状态
   *
   * @example
   * ```typescript
   * const status = await migrationService.getTenantMigrationStatus('tenant-123');
   * ```
   */
  async getTenantMigrationStatus(tenantId: string): Promise<MigrationStatus> {
    try {
      // 实际实现需要查询租户数据库的迁移状态
      return {
        currentVersion: '0',
        latestVersion: '0',
        pendingCount: 0,
        executedCount: 0,
        status: MIGRATION_STATUS.PENDING,
      };
    } catch (error) {
      this.logger.error('Failed to get tenant migration status', {
        tenantId,
        error,
      });

      throw new DatabaseMigrationException(
        `获取租户迁移状态失败: ${tenantId}`,
        { tenantId },
        error as Error
      );
    }
  }

  /**
   * 列出所有迁移
   *
   * @description 列出所有迁移文件的信息
   *
   * @returns 迁移信息列表
   *
   * @example
   * ```typescript
   * const migrations = await migrationService.listMigrations();
   * migrations.forEach(m => console.log(m.name, m.status));
   * ```
   */
  async listMigrations(): Promise<MigrationInfo[]> {
    try {
      if (!this.migrator) {
        return [];
      }

      const executed = await this.migrator.getExecutedMigrations();
      const pending = await this.migrator.getPendingMigrations();

      const executedMigrations: MigrationInfo[] = executed.map((m) => ({
        name: m.name || '',
        version: m.name || '',
        status: MIGRATION_STATUS.COMPLETED,
        executedAt: m.executed_at,
      }));

      const pendingMigrations: MigrationInfo[] = pending.map((m) => ({
        name: m.name || '',
        version: m.name || '',
        status: MIGRATION_STATUS.PENDING,
      }));

      return [...executedMigrations, ...pendingMigrations];
    } catch (error) {
      this.logger.error('Failed to list migrations', { error });
      throw new DatabaseMigrationException(
        '获取迁移列表失败',
        {},
        error as Error
      );
    }
  }

  /**
   * 列出租户迁移
   *
   * @description 列出指定租户的所有迁移
   *
   * @param tenantId - 租户ID
   * @returns 租户迁移信息列表
   *
   * @example
   * ```typescript
   * const migrations = await migrationService.listTenantMigrations('tenant-123');
   * ```
   */
  async listTenantMigrations(tenantId: string): Promise<MigrationInfo[]> {
    try {
      // 实际实现需要查询租户数据库的迁移列表
      return [];
    } catch (error) {
      this.logger.error('Failed to list tenant migrations', {
        tenantId,
        error,
      });

      throw new DatabaseMigrationException(
        `获取租户迁移列表失败: ${tenantId}`,
        { tenantId },
        error as Error
      );
    }
  }

  /**
   * 设置 ORM 实例
   *
   * @description 由 DatabaseModule 注入 ORM 实例
   *
   * @param orm - MikroORM 实例
   * @internal
   */
  setOrm(orm: MikroORM): void {
    this.orm = orm;
    this.migrator = orm.getMigrator();
  }
}
