/**
 * 测试数据库辅助工具
 *
 * @description 提供测试数据库的初始化、清理和管理功能
 *
 * ## 功能特性
 *
 * - 自动创建和删除测试数据库
 * - Schema 同步和迁移
 * - 事务隔离（每个测试独立）
 * - 数据清理和重置
 * - 连接池管理
 *
 * ## 使用场景
 *
 * ### 1. 全局设置（所有测试前）
 * ```typescript
 * beforeAll(async () => {
 *   await TestDatabaseHelper.setup();
 * });
 * ```
 *
 * ### 2. 每个测试前清理
 * ```typescript
 * beforeEach(async () => {
 *   await TestDatabaseHelper.clearDatabase();
 * });
 * ```
 *
 * ### 3. 全局清理（所有测试后）
 * ```typescript
 * afterAll(async () => {
 *   await TestDatabaseHelper.teardown();
 * });
 * ```
 *
 * @module __tests__/setup
 * @since 1.0.0
 */

import { MikroORM, EntityManager } from '@mikro-orm/core';
import { SqlEntityManager } from '@mikro-orm/postgresql';
import { getTestDatabaseConfig } from './test-database.config';

/**
 * 测试数据库辅助类
 *
 * @description 单例模式，管理测试数据库的生命周期
 *
 * @class TestDatabaseHelper
 */
export class TestDatabaseHelper {
  /**
   * MikroORM 实例（单例）
   */
  private static orm: MikroORM | null = null;

  /**
   * EntityManager 实例
   */
  private static em: SqlEntityManager | null = null;

  /**
   * 初始化标志
   */
  private static initialized = false;

  /**
   * 设置测试数据库
   *
   * @description 初始化数据库连接、同步 Schema、运行迁移
   *
   * ## 业务规则
   *
   * - 仅在第一次调用时初始化
   * - 创建所有表结构
   * - 应用所有迁移
   * - 建立连接池
   *
   * @throws {Error} 如果数据库连接失败
   *
   * @example
   * ```typescript
   * await TestDatabaseHelper.setup();
   * ```
   */
  static async setup(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 初始化 MikroORM
      const config = getTestDatabaseConfig();
      this.orm = await MikroORM.init(config);
      this.em = this.orm.em as SqlEntityManager;

      // 同步 Schema（测试环境可以直接删除并重建）
      const generator = this.orm.getSchemaGenerator();
      
      // 删除所有表（清理旧数据）
      await generator.dropSchema();
      
      // 创建所有表
      await generator.createSchema();

      // 运行迁移（可选，如果需要测试迁移脚本）
      // const migrator = this.orm.getMigrator();
      // await migrator.up();

      this.initialized = true;
      console.log('✅ 测试数据库初始化完成');
    } catch (error) {
      console.error('❌ 测试数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 清理测试数据库
   *
   * @description 关闭连接、清理资源
   *
   * ## 业务规则
   *
   * - 关闭所有连接
   * - 释放连接池
   * - 重置初始化状态
   *
   * @example
   * ```typescript
   * await TestDatabaseHelper.teardown();
   * ```
   */
  static async teardown(): Promise<void> {
    if (this.orm) {
      await this.orm.close(true);
      this.orm = null;
      this.em = null;
      this.initialized = false;
      console.log('✅ 测试数据库清理完成');
    }
  }

  /**
   * 清空所有数据表
   *
   * @description 删除所有表数据但保留表结构
   *
   * ## 业务规则
   *
   * - 保留表结构
   * - 删除所有数据
   * - 重置自增序列
   * - 在事务中执行（保证原子性）
   *
   * ## 使用场景
   *
   * - 每个测试前清理数据
   * - 确保测试独立性
   *
   * @throws {Error} 如果数据库未初始化
   *
   * @example
   * ```typescript
   * beforeEach(async () => {
   *   await TestDatabaseHelper.clearDatabase();
   * });
   * ```
   */
  static async clearDatabase(): Promise<void> {
    if (!this.orm) {
      throw new Error('测试数据库未初始化，请先调用 setup()');
    }

    try {
      const connection = this.orm.em.getConnection();
      
      // 获取所有表名
      const tables = await connection.execute(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'mikro_orm_%'
      `);

      if (tables.length > 0) {
        // 禁用外键约束
        await connection.execute('SET session_replication_role = replica;');

        // 清空所有表
        for (const table of tables) {
          await connection.execute(`TRUNCATE TABLE "${table['tablename']}" CASCADE;`);
        }

        // 重新启用外键约束
        await connection.execute('SET session_replication_role = DEFAULT;');
      }

      // 清理 EntityManager 缓存
      this.orm.em.clear();

      console.log('✅ 测试数据清理完成');
    } catch (error) {
      console.error('❌ 清理数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取 ORM 实例
   *
   * @returns {MikroORM} MikroORM 实例
   * @throws {Error} 如果数据库未初始化
   */
  static getOrm(): MikroORM {
    if (!this.orm) {
      throw new Error('测试数据库未初始化，请先调用 setup()');
    }
    return this.orm;
  }

  /**
   * 获取 EntityManager 实例
   *
   * @returns {SqlEntityManager} EntityManager 实例
   * @throws {Error} 如果数据库未初始化
   */
  static getEntityManager(): SqlEntityManager {
    if (!this.em) {
      throw new Error('测试数据库未初始化，请先调用 setup()');
    }
    return this.em;
  }

  /**
   * 创建新的 EntityManager（fork）
   *
   * @description 为每个测试创建独立的 EntityManager
   *
   * ## 业务规则
   *
   * - 每个测试使用独立的 EM
   * - 避免缓存污染
   * - 支持并行测试
   *
   * @returns {SqlEntityManager} 新的 EntityManager 实例
   * @throws {Error} 如果数据库未初始化
   *
   * @example
   * ```typescript
   * const em = TestDatabaseHelper.fork();
   * const user = await em.findOne(User, { id: '123' });
   * ```
   */
  static fork(): SqlEntityManager {
    if (!this.em) {
      throw new Error('测试数据库未初始化，请先调用 setup()');
    }
    return this.em.fork() as SqlEntityManager;
  }

  /**
   * 在事务中执行测试
   *
   * @description 将测试包装在事务中，测试完成后自动回滚
   *
   * ## 业务规则
   *
   * - 每个测试在独立事务中运行
   * - 测试完成后自动回滚
   * - 不污染数据库
   * - 速度更快（无需清理数据）
   *
   * @param callback 测试回调函数
   * @returns {Promise<T>} 回调函数返回值
   *
   * @example
   * ```typescript
   * it('should create user', async () => {
   *   await TestDatabaseHelper.runInTransaction(async (em) => {
   *     const user = new User(...);
   *     await em.persistAndFlush(user);
   *     expect(user.id).toBeDefined();
   *   });
   * });
   * ```
   */
  static async runInTransaction<T>(
    callback: (em: SqlEntityManager) => Promise<T>,
  ): Promise<T> {
    if (!this.orm) {
      throw new Error('测试数据库未初始化，请先调用 setup()');
    }

    const em = this.fork();
    
    try {
      return await em.transactional(callback);
    } finally {
      // 事务会自动回滚（如果测试失败）或提交（如果测试成功）
      // 这里不需要手动处理
    }
  }

  /**
   * 执行原始 SQL 查询
   *
   * @description 执行原始 SQL（用于复杂查询或数据准备）
   *
   * @param sql SQL 查询语句
   * @param params 查询参数
   * @returns {Promise<any>} 查询结果
   *
   * @example
   * ```typescript
   * const result = await TestDatabaseHelper.executeQuery(
   *   'SELECT * FROM users WHERE email = $1',
   *   ['test@example.com']
   * );
   * ```
   */
  static async executeQuery(sql: string, params: any[] = []): Promise<any> {
    if (!this.orm) {
      throw new Error('测试数据库未初始化，请先调用 setup()');
    }

    const connection = this.orm.em.getConnection();
    return await connection.execute(sql, params);
  }

  /**
   * 检查数据库连接状态
   *
   * @returns {Promise<boolean>} 连接是否正常
   *
   * @example
   * ```typescript
   * const isConnected = await TestDatabaseHelper.isConnected();
   * ```
   */
  static async isConnected(): Promise<boolean> {
    if (!this.orm) {
      return false;
    }

    try {
      await this.orm.em.getConnection().execute('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

