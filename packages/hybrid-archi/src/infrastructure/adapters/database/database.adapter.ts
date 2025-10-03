/**
 * 数据库适配器
 *
 * 实现多数据库策略，提供统一的数据库操作能力。
 * 作为通用功能组件，支持PostgreSQL、MongoDB等多种数据库。
 *
 * @description 数据库适配器实现多数据库策略
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@hl8/database';
import { PinoLogger } from '@hl8/logger';

/**
 * 数据库配置接口
 */
export interface IDatabaseConfig {
  /** 是否启用PostgreSQL */
  enablePostgreSQL: boolean;
  /** 是否启用MongoDB */
  enableMongoDB: boolean;
  /** 是否启用事务 */
  enableTransaction: boolean;
  /** 是否启用连接池 */
  enableConnectionPool: boolean;
  /** 连接池大小 */
  poolSize: number;
  /** 是否启用查询缓存 */
  enableQueryCache: boolean;
  /** 查询缓存TTL（秒） */
  queryCacheTtl: number;
  /** 是否启用查询日志 */
  enableQueryLogging: boolean;
  /** 是否启用慢查询监控 */
  enableSlowQueryMonitoring: boolean;
  /** 慢查询阈值（毫秒） */
  slowQueryThreshold: number;
  /** 是否启用数据迁移 */
  enableMigration: boolean;
  /** 是否启用数据备份 */
  enableBackup: boolean;
}

/**
 * 数据库类型枚举
 */
export enum DatabaseType {
  /** PostgreSQL */
  POSTGRESQL = 'postgresql',
  /** MongoDB */
  MONGODB = 'mongodb',
}

/**
 * 查询选项接口
 */
export interface IQueryOptions {
  /** 是否使用缓存 */
  useCache?: boolean;
  /** 缓存TTL（秒） */
  cacheTtl?: number;
  /** 查询超时（毫秒） */
  timeout?: number;
  /** 是否记录查询日志 */
  logQuery?: boolean;
  /** 查询标签 */
  tags?: string[];
}

/**
 * 事务选项接口
 */
export interface ITransactionOptions {
  /** 事务隔离级别 */
  isolationLevel?:
    | 'READ_UNCOMMITTED'
    | 'READ_COMMITTED'
    | 'REPEATABLE_READ'
    | 'SERIALIZABLE';
  /** 事务超时（毫秒） */
  timeout?: number;
  /** 是否只读事务 */
  readOnly?: boolean;
}

/**
 * 数据库适配器
 *
 * 实现多数据库策略
 */
@Injectable()
export class DatabaseAdapter {
  private readonly config: IDatabaseConfig;
  private readonly queryCache = new Map<
    string,
    { result: unknown; expiresAt: number }
  >();
  private readonly queryStats = {
    totalQueries: 0,
    cachedQueries: 0,
    slowQueries: 0,
    averageQueryTime: 0,
  };

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: PinoLogger,
    config: Partial<IDatabaseConfig> = {}
  ) {
    this.config = {
      enablePostgreSQL: config.enablePostgreSQL ?? true,
      enableMongoDB: config.enableMongoDB ?? true,
      enableTransaction: config.enableTransaction ?? true,
      enableConnectionPool: config.enableConnectionPool ?? true,
      poolSize: config.poolSize ?? 10,
      enableQueryCache: config.enableQueryCache ?? true,
      queryCacheTtl: config.queryCacheTtl ?? 300,
      enableQueryLogging: config.enableQueryLogging ?? true,
      enableSlowQueryMonitoring: config.enableSlowQueryMonitoring ?? true,
      slowQueryThreshold: config.slowQueryThreshold ?? 1000,
      enableMigration: config.enableMigration ?? true,
      enableBackup: config.enableBackup ?? true,
    };
  }

  /**
   * 执行查询
   *
   * @param query - 查询语句
   * @param params - 查询参数
   * @param options - 查询选项
   * @returns 查询结果
   */
  async query<T = unknown>(
    query: string,
    params: unknown[] = [],
    options: IQueryOptions = {}
  ): Promise<T[]> {
    const startTime = Date.now();
    const queryId = this.generateQueryId();

    try {
      // 检查查询缓存
      if (this.config.enableQueryCache && options.useCache !== false) {
        const cacheKey = this.getQueryCacheKey(query, params);
        const cached = this.getFromQueryCache(cacheKey);
        if (cached) {
          this.queryStats.cachedQueries++;
          this.logger.debug(`查询缓存命中: ${queryId}`, {
            queryId,
            query: query.substring(0, 100),
            cacheKey,
          });
          return cached;
        }
      }

      // 记录查询日志
      if (this.config.enableQueryLogging && options.logQuery !== false) {
        this.logger.debug(`执行查询: ${queryId}`, {
          queryId,
          query: query.substring(0, 100),
          params,
          tags: options.tags,
        });
      }

      // 执行查询
      let result: T[];
      if (
        typeof (this.databaseService as unknown as Record<string, unknown>)[
          'query'
        ] === 'function'
      ) {
        result = await (
          this.databaseService as unknown as {
            query: (query: string, params: unknown[]) => Promise<T[]>;
          }
        ).query(query, params);
      } else {
        console.warn('DatabaseService不支持query方法');
        throw new Error('DatabaseService不支持query方法');
      }

      // 缓存查询结果
      if (this.config.enableQueryCache && options.useCache !== false) {
        const cacheKey = this.getQueryCacheKey(query, params);
        this.setQueryCache(
          cacheKey,
          result,
          options.cacheTtl || this.config.queryCacheTtl
        );
      }

      // 更新查询统计
      const queryTime = Date.now() - startTime;
      this.updateQueryStats(queryTime);

      // 慢查询监控
      if (
        this.config.enableSlowQueryMonitoring &&
        queryTime > this.config.slowQueryThreshold
      ) {
        this.queryStats.slowQueries++;
        this.logger.warn(`慢查询检测: ${queryId}`, {
          queryId,
          query: query.substring(0, 100),
          queryTime,
          threshold: this.config.slowQueryThreshold,
        });
      }

      this.logger.debug(`查询完成: ${queryId}`, {
        queryId,
        queryTime,
        resultCount: result.length,
      });

      return result;
    } catch (error) {
      this.logger.error(`查询失败: ${queryId}`, error, {
        queryId,
        query: query.substring(0, 100),
        params,
      });
      throw error;
    }
  }

  /**
   * 执行事务
   *
   * @param callback - 事务回调函数
   * @param options - 事务选项
   * @returns 事务结果
   */
  async transaction<T>(
    callback: (transaction: unknown) => Promise<T>,
    options: ITransactionOptions = {}
  ): Promise<T> {
    const transactionId = this.generateTransactionId();

    try {
      this.logger.debug(`开始事务: ${transactionId}`, {
        transactionId,
        isolationLevel: options.isolationLevel,
        readOnly: options.readOnly,
      });

      // 由于DatabaseService可能没有transaction方法，我们提供一个基础实现
      let result: T;
      try {
        // 尝试调用DatabaseService的transaction方法
        if (typeof (this.databaseService as any).transaction === 'function') {
          result = await (this.databaseService as any).transaction(callback, {
            isolationLevel: options.isolationLevel,
            timeout: options.timeout,
            readOnly: options.readOnly,
          });
        } else {
          // 如果没有transaction方法，直接执行回调
          this.logger.warn('DatabaseService不支持事务，直接执行操作', {
            transactionId,
          });
          result = await callback({} as unknown);
        }
      } catch (error) {
        this.logger.error('事务执行失败', error, { transactionId });
        throw error;
      }

      this.logger.debug(`事务提交成功: ${transactionId}`, {
        transactionId,
      });

      return result;
    } catch (error) {
      this.logger.error(`事务回滚: ${transactionId}`, error, {
        transactionId,
      });
      throw error;
    }
  }

  /**
   * 插入数据
   *
   * @param table - 表名
   * @param data - 数据
   * @param options - 查询选项
   * @returns 插入结果
   */
  async insert<T = unknown>(
    table: string,
    data: T | T[],
    options: IQueryOptions = {}
  ): Promise<unknown> {
    const startTime = Date.now();
    const operationId = this.generateOperationId('insert');

    try {
      this.logger.debug(`插入数据: ${operationId}`, {
        operationId,
        table,
        dataCount: Array.isArray(data) ? data.length : 1,
      });

      // 使用兼容性检查调用 insert 方法
      let result: unknown;
      if (
        typeof (this.databaseService as unknown as Record<string, unknown>)[
          'insert'
        ] === 'function'
      ) {
        result = await (
          this.databaseService as unknown as {
            insert: (table: string, data: T | T[]) => Promise<unknown>;
          }
        ).insert(table, data);
      } else {
        console.warn('DatabaseService不支持insert方法');
        throw new Error('DatabaseService不支持insert方法');
      }

      const operationTime = Date.now() - startTime;
      this.updateQueryStats(operationTime);

      this.logger.debug(`插入完成: ${operationId}`, {
        operationId,
        table,
        operationTime,
        resultCount: Array.isArray(result) ? result.length : 1,
      });

      return result;
    } catch (error) {
      this.logger.error(`插入失败: ${operationId}`, error, {
        operationId,
        table,
      });
      throw error;
    }
  }

  /**
   * 更新数据
   *
   * @param table - 表名
   * @param data - 数据
   * @param where - 条件
   * @param options - 查询选项
   * @returns 更新结果
   */
  async update<T = unknown>(
    table: string,
    data: Partial<T>,
    where: unknown,
    options: IQueryOptions = {}
  ): Promise<unknown> {
    const startTime = Date.now();
    const operationId = this.generateOperationId('update');

    try {
      this.logger.debug(`更新数据: ${operationId}`, {
        operationId,
        table,
        where,
      });

      // 使用兼容性检查调用 update 方法
      let result: unknown;
      if (
        typeof (this.databaseService as unknown as Record<string, unknown>)[
          'update'
        ] === 'function'
      ) {
        result = await (
          this.databaseService as unknown as {
            update: (
              table: string,
              data: Partial<T>,
              where: unknown
            ) => Promise<unknown>;
          }
        ).update(table, data, where);
      } else {
        console.warn('DatabaseService不支持update方法');
        throw new Error('DatabaseService不支持update方法');
      }

      const operationTime = Date.now() - startTime;
      this.updateQueryStats(operationTime);

      this.logger.debug(`更新完成: ${operationId}`, {
        operationId,
        table,
        operationTime,
        affectedRows: (result as { affectedRows?: number })?.affectedRows || 0,
      });

      return result;
    } catch (error) {
      this.logger.error(`更新失败: ${operationId}`, error, {
        operationId,
        table,
      });
      throw error;
    }
  }

  /**
   * 删除数据
   *
   * @param table - 表名
   * @param where - 条件
   * @param options - 查询选项
   * @returns 删除结果
   */
  async delete(
    table: string,
    where: unknown,
    options: IQueryOptions = {}
  ): Promise<unknown> {
    const startTime = Date.now();
    const operationId = this.generateOperationId('delete');

    try {
      this.logger.debug(`删除数据: ${operationId}`, {
        operationId,
        table,
        where,
      });

      // 使用兼容性检查调用 delete 方法
      let result: unknown;
      if (
        typeof (this.databaseService as unknown as Record<string, unknown>)[
          'delete'
        ] === 'function'
      ) {
        result = await (
          this.databaseService as unknown as {
            delete: (table: string, where: unknown) => Promise<unknown>;
          }
        ).delete(table, where);
      } else {
        console.warn('DatabaseService不支持delete方法');
        throw new Error('DatabaseService不支持delete方法');
      }

      const operationTime = Date.now() - startTime;
      this.updateQueryStats(operationTime);

      this.logger.debug(`删除完成: ${operationId}`, {
        operationId,
        table,
        operationTime,
        affectedRows: (result as { affectedRows?: number })?.affectedRows || 0,
      });

      return result;
    } catch (error) {
      this.logger.error(`删除失败: ${operationId}`, error, {
        operationId,
        table,
      });
      throw error;
    }
  }

  /**
   * 查找数据
   *
   * @param table - 表名
   * @param where - 条件
   * @param options - 查询选项
   * @returns 查找结果
   */
  async find<T = unknown>(
    table: string,
    where: unknown = {},
    options: IQueryOptions = {}
  ): Promise<T[]> {
    const startTime = Date.now();
    const operationId = this.generateOperationId('find');

    try {
      this.logger.debug(`查找数据: ${operationId}`, {
        operationId,
        table,
        where,
      });

      // 使用兼容性检查调用 find 方法
      let result: T[];
      if (
        typeof (this.databaseService as unknown as Record<string, unknown>)[
          'find'
        ] === 'function'
      ) {
        result = await (
          this.databaseService as unknown as {
            find: (table: string, where: unknown) => Promise<T[]>;
          }
        ).find(table, where);
      } else {
        console.warn('DatabaseService不支持find方法');
        throw new Error('DatabaseService不支持find方法');
      }

      const operationTime = Date.now() - startTime;
      this.updateQueryStats(operationTime);

      this.logger.debug(`查找完成: ${operationId}`, {
        operationId,
        table,
        operationTime,
        resultCount: result.length,
      });

      return result;
    } catch (error) {
      this.logger.error(`查找失败: ${operationId}`, error, {
        operationId,
        table,
      });
      throw error;
    }
  }

  /**
   * 查找单条数据
   *
   * @param table - 表名
   * @param where - 条件
   * @param options - 查询选项
   * @returns 查找结果
   */
  async findOne<T = unknown>(
    table: string,
    where: unknown = {},
    options: IQueryOptions = {}
  ): Promise<T | null> {
    const startTime = Date.now();
    const operationId = this.generateOperationId('findOne');

    try {
      this.logger.debug(`查找单条数据: ${operationId}`, {
        operationId,
        table,
        where,
      });

      // 使用兼容性检查调用 findOne 方法
      let result: T | null;
      if (
        typeof (this.databaseService as unknown as Record<string, unknown>)[
          'findOne'
        ] === 'function'
      ) {
        result = await (
          this.databaseService as unknown as {
            findOne: (table: string, where: unknown) => Promise<T | null>;
          }
        ).findOne(table, where);
      } else {
        console.warn('DatabaseService不支持findOne方法');
        throw new Error('DatabaseService不支持findOne方法');
      }

      const operationTime = Date.now() - startTime;
      this.updateQueryStats(operationTime);

      this.logger.debug(`查找完成: ${operationId}`, {
        operationId,
        table,
        operationTime,
        found: result !== null,
      });

      return result;
    } catch (error) {
      this.logger.error(`查找失败: ${operationId}`, error, {
        operationId,
        table,
      });
      throw error;
    }
  }

  /**
   * 计数
   *
   * @param table - 表名
   * @param where - 条件
   * @param options - 查询选项
   * @returns 计数结果
   */
  async count(
    table: string,
    where: unknown = {},
    options: IQueryOptions = {}
  ): Promise<number> {
    const startTime = Date.now();
    const operationId = this.generateOperationId('count');

    try {
      this.logger.debug(`计数: ${operationId}`, {
        operationId,
        table,
        where,
      });

      // 使用兼容性检查调用 count 方法
      let result: number;
      if (
        typeof (this.databaseService as unknown as Record<string, unknown>)[
          'count'
        ] === 'function'
      ) {
        result = await (
          this.databaseService as unknown as {
            count: (table: string, where: unknown) => Promise<number>;
          }
        ).count(table, where);
      } else {
        console.warn('DatabaseService不支持count方法');
        throw new Error('DatabaseService不支持count方法');
      }

      const operationTime = Date.now() - startTime;
      this.updateQueryStats(operationTime);

      this.logger.debug(`计数完成: ${operationId}`, {
        operationId,
        table,
        operationTime,
        count: result,
      });

      return result;
    } catch (error) {
      this.logger.error(`计数失败: ${operationId}`, error, {
        operationId,
        table,
      });
      throw error;
    }
  }

  /**
   * 获取数据库统计信息
   *
   * @returns 数据库统计信息
   */
  getDatabaseStatistics(): {
    totalQueries: number;
    cachedQueries: number;
    slowQueries: number;
    averageQueryTime: number;
    cacheHitRate: number;
    slowQueryRate: number;
  } {
    const cacheHitRate =
      this.queryStats.totalQueries > 0
        ? this.queryStats.cachedQueries / this.queryStats.totalQueries
        : 0;

    const slowQueryRate =
      this.queryStats.totalQueries > 0
        ? this.queryStats.slowQueries / this.queryStats.totalQueries
        : 0;

    return {
      totalQueries: this.queryStats.totalQueries,
      cachedQueries: this.queryStats.cachedQueries,
      slowQueries: this.queryStats.slowQueries,
      averageQueryTime: this.queryStats.averageQueryTime,
      cacheHitRate,
      slowQueryRate,
    };
  }

  /**
   * 重置统计信息
   */
  resetStatistics(): void {
    this.queryStats.totalQueries = 0;
    this.queryStats.cachedQueries = 0;
    this.queryStats.slowQueries = 0;
    this.queryStats.averageQueryTime = 0;
  }

  /**
   * 清理查询缓存
   */
  clearQueryCache(): void {
    this.queryCache.clear();
    this.logger.debug('查询缓存已清理');
  }

  // ==================== 私有方法 ====================

  /**
   * 生成查询ID
   */
  private generateQueryId(): string {
    return `query-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 生成事务ID
   */
  private generateTransactionId(): string {
    return `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 生成操作ID
   */
  private generateOperationId(operation: string): string {
    return `${operation}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
  }

  /**
   * 获取查询缓存键
   */
  private getQueryCacheKey(query: string, params: any[]): string {
    const paramsHash = JSON.stringify(params);
    return `query:${Buffer.from(query + paramsHash).toString('base64')}`;
  }

  /**
   * 从查询缓存获取
   */
  private getFromQueryCache(key: string): any | null {
    const item = this.queryCache.get(key);
    if (!item) {
      return null;
    }

    if (item.expiresAt < Date.now()) {
      this.queryCache.delete(key);
      return null;
    }

    return item.result;
  }

  /**
   * 设置查询缓存
   */
  private setQueryCache(key: string, result: any, ttl: number): void {
    const expiresAt = Date.now() + ttl * 1000;
    this.queryCache.set(key, { result, expiresAt });
  }

  /**
   * 更新查询统计
   */
  private updateQueryStats(queryTime: number): void {
    this.queryStats.totalQueries++;
    this.queryStats.averageQueryTime =
      (this.queryStats.averageQueryTime * (this.queryStats.totalQueries - 1) +
        queryTime) /
      this.queryStats.totalQueries;
  }
}
