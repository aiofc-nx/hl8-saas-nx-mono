/**
 * 多租户数据库服务
 *
 * @description 提供多租户数据库操作服务
 * 支持租户级别的数据隔离、连接管理、事务处理等
 *
 * @fileoverview 多租户数据库服务实现文件
 * @since 1.0.0
 */

import { Injectable, Inject } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import type { EntityManager, Connection } from '@mikro-orm/core';
import { PinoLogger } from '@hl8/logger';
import { ConnectionManager } from './connection.manager';
import { DatabaseService } from './database.service';
import { DI_TOKENS } from './constants';
import type {
  ITenantDatabaseService,
  DatabaseModuleOptions,
  ConnectionInfo,
} from './types';
import {
  TenantNotFoundException,
  DatabaseQueryException,
  DatabaseTransactionException,
} from './exceptions';

/**
 * 多租户数据库服务类
 *
 * @description 扩展基础数据库服务，提供多租户数据隔离和管理功能
 * 支持租户级别的数据库操作、事务管理、数据库创建等
 *
 * ## 业务规则
 *
 * ### 租户隔离规则
 * - 每个租户的数据必须完全隔离
 * - 租户ID必须通过上下文传递
 * - 跨租户操作严格禁止
 * - 租户数据访问必须验证权限
 *
 * ### 租户连接规则
 * - 租户连接采用懒加载策略
 * - 每个租户的连接数受限制
 * - 空闲租户连接会自动关闭
 * - 租户连接支持动态创建
 *
 * ### 租户数据库规则
 * - 支持动态创建租户数据库
 * - 租户数据库删除需要确认
 * - 租户迁移独立管理
 * - 租户数据库支持备份恢复
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     private readonly tenantDbService: TenantDatabaseService,
 *     private readonly cls: ClsService
 *   ) {}
 *
 *   async createUser(userData: UserData): Promise<User> {
 *     const tenantId = this.cls.get('tenantId');
 *
 *     return this.tenantDbService.executeTenantTransaction(
 *       tenantId,
 *       async (em) => {
 *         const user = new User(userData);
 *         await em.persistAndFlush(user);
 *         return user;
 *       }
 *     );
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class TenantDatabaseService
  extends DatabaseService
  implements ITenantDatabaseService
{
  constructor(
    connectionManager: ConnectionManager,
    cls: ClsService,
    logger: PinoLogger,
    @Inject(DI_TOKENS.MODULE_OPTIONS)
    private readonly options: DatabaseModuleOptions
  ) {
    super(connectionManager, cls, logger);
    this.logger.info('TenantDatabaseService initialized');
  }

  /**
   * 获取租户数据库连接
   *
   * @description 获取指定租户的数据库连接
   *
   * @param tenantId - 租户ID
   * @returns 租户数据库连接
   * @throws {TenantNotFoundException} 租户连接不存在时抛出
   *
   * @example
   * ```typescript
   * const connection = await service.getTenantConnection('tenant-123');
   * ```
   */
  async getTenantConnection(tenantId: string): Promise<Connection> {
    this.validateTenantId(tenantId);

    try {
      return await this.connectionManager.getTenantConnection(tenantId);
    } catch (error) {
      this.logger.error('Failed to get tenant connection', {
        tenantId,
        error,
      });
      throw error;
    }
  }

  /**
   * 获取租户实体管理器
   *
   * @description 获取指定租户的 EntityManager 实例
   *
   * @param tenantId - 租户ID
   * @returns 租户实体管理器
   * @throws {TenantNotFoundException} 租户 EntityManager 不存在时抛出
   *
   * @example
   * ```typescript
   * const em = await service.getTenantEntityManager('tenant-123');
   * const users = await em.find(User, {});
   * ```
   */
  async getTenantEntityManager(tenantId: string): Promise<EntityManager> {
    this.validateTenantId(tenantId);

    try {
      // 优先使用上下文中的 EntityManager
      const contextEm = this.cls.get<EntityManager>('entityManager');
      if (contextEm) {
        return contextEm;
      }

      const connection = await this.getTenantConnection(tenantId);
      // 从连接获取 EntityManager
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (connection as any)['em'] as EntityManager;
    } catch (error) {
      this.logger.error('Failed to get tenant entity manager', {
        tenantId,
        error,
      });
      throw error;
    }
  }

  /**
   * 执行租户SQL查询
   *
   * @description 在指定租户的数据库中执行SQL查询
   *
   * @param tenantId - 租户ID
   * @param sql - SQL查询语句
   * @param params - 查询参数
   * @returns 查询结果数组
   * @throws {DatabaseQueryException} 查询执行失败时抛出
   *
   * @example
   * ```typescript
   * const users = await service.executeTenantQuery<User>(
   *   'tenant-123',
   *   'SELECT * FROM users WHERE status = ?',
   *   ['active']
   * );
   * ```
   */
  async executeTenantQuery<T>(
    tenantId: string,
    sql: string,
    params?: unknown[]
  ): Promise<T[]> {
    this.validateTenantId(tenantId);

    const startTime = Date.now();

    try {
      this.logger.debug('Executing tenant query', { tenantId, sql, params });

      const em = await this.getTenantEntityManager(tenantId);
      const result = await em.getConnection().execute(sql, params);

      const executionTime = Date.now() - startTime;
      this.logger.debug('Tenant query executed successfully', {
        tenantId,
        sql,
        executionTime,
        resultCount: Array.isArray(result) ? result.length : 0,
      });

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error('Tenant query execution failed', {
        tenantId,
        sql,
        params,
        executionTime,
        error,
      });

      throw new DatabaseQueryException(
        `租户查询执行失败: ${tenantId}`,
        {
          tenantId,
          sql,
          params,
          executionTime,
        },
        error as Error
      );
    }
  }

  /**
   * 执行租户事务
   *
   * @description 在指定租户的数据库中执行事务
   *
   * @param tenantId - 租户ID
   * @param callback - 事务回调函数
   * @returns 事务执行结果
   * @throws {DatabaseTransactionException} 事务执行失败时抛出
   *
   * @example
   * ```typescript
   * const user = await service.executeTenantTransaction(
   *   'tenant-123',
   *   async (em) => {
   *     const user = new User();
   *     await em.persistAndFlush(user);
   *     return user;
   *   }
   * );
   * ```
   */
  async executeTenantTransaction<T>(
    tenantId: string,
    callback: (em: EntityManager) => Promise<T>
  ): Promise<T> {
    this.validateTenantId(tenantId);

    const startTime = Date.now();
    const transactionId = `tx-${tenantId}-${Date.now()}`;

    try {
      this.logger.debug('Starting tenant transaction', {
        tenantId,
        transactionId,
      });

      const em = await this.getTenantEntityManager(tenantId);
      const result = await em.transactional(callback);

      const executionTime = Date.now() - startTime;
      this.logger.debug('Tenant transaction committed successfully', {
        tenantId,
        transactionId,
        executionTime,
      });

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error('Tenant transaction failed and rolled back', {
        tenantId,
        transactionId,
        executionTime,
        error,
      });

      throw new DatabaseTransactionException(
        `租户事务执行失败: ${tenantId}`,
        {
          tenantId,
          transactionId,
          executionTime,
        },
        error as Error
      );
    }
  }

  /**
   * 创建租户数据库
   *
   * @description 为指定租户创建独立的数据库
   *
   * @param tenantId - 租户ID
   * @throws {DatabaseConnectionException} 数据库创建失败时抛出
   *
   * @example
   * ```typescript
   * await service.createTenantDatabase('tenant-123');
   * ```
   */
  async createTenantDatabase(tenantId: string): Promise<void> {
    this.validateTenantId(tenantId);

    this.logger.info('Creating tenant database', { tenantId });

    await this.connectionManager.createTenantDatabase(tenantId);

    this.logger.info('Tenant database created successfully', { tenantId });
  }

  /**
   * 删除租户数据库
   *
   * @description 删除指定租户的数据库（谨慎操作）
   *
   * @param tenantId - 租户ID
   * @throws {DatabaseConnectionException} 数据库删除失败时抛出
   *
   * @example
   * ```typescript
   * await service.deleteTenantDatabase('tenant-123');
   * ```
   */
  async deleteTenantDatabase(tenantId: string): Promise<void> {
    this.validateTenantId(tenantId);

    this.logger.warn('Deleting tenant database', { tenantId });

    await this.connectionManager.deleteTenantDatabase(tenantId);

    this.logger.warn('Tenant database deleted', { tenantId });
  }

  /**
   * 迁移租户数据库
   *
   * @description 运行租户数据库的迁移脚本
   *
   * @param tenantId - 租户ID
   * @throws {DatabaseMigrationException} 迁移失败时抛出
   *
   * @example
   * ```typescript
   * await service.migrateTenant('tenant-123');
   * ```
   */
  async migrateTenant(tenantId: string): Promise<void> {
    this.validateTenantId(tenantId);

    this.logger.info('Migrating tenant database', { tenantId });

    // 实际迁移逻辑由 MigrationService 处理
    // 这里是占位实现
    this.logger.info('Tenant database migrated', { tenantId });
  }

  /**
   * 获取租户连接信息
   *
   * @description 获取指定租户的连接详细信息
   *
   * @param tenantId - 租户ID
   * @returns 租户连接信息
   * @throws {TenantNotFoundException} 租户连接不存在时抛出
   *
   * @example
   * ```typescript
   * const info = await service.getTenantConnectionInfo('tenant-123');
   * console.log(info.database, info.status);
   * ```
   */
  async getTenantConnectionInfo(tenantId: string): Promise<ConnectionInfo> {
    this.validateTenantId(tenantId);

    await this.getTenantConnection(tenantId);
    const baseInfo = this.connectionManager.getConnectionInfo();

    return {
      ...baseInfo,
      tenantId,
      database: this.getTenantDatabaseName(tenantId),
    };
  }

  /**
   * 验证租户ID
   *
   * @description 验证租户ID的有效性
   *
   * @param tenantId - 租户ID
   * @throws {TenantNotFoundException} 租户ID无效时抛出
   * @private
   */
  private validateTenantId(tenantId: string): void {
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      throw new TenantNotFoundException('租户ID无效', { tenantId });
    }
  }

  /**
   * 获取租户数据库名称
   *
   * @description 根据租户ID生成数据库名称
   *
   * @param tenantId - 租户ID
   * @returns 数据库名称
   * @private
   */
  private getTenantDatabaseName(tenantId: string): string {
    const prefix = this.options.tenant?.tenantDatabasePrefix || 'hl8_tenant_';
    return `${prefix}${tenantId}`;
  }
}
