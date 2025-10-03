/**
 * 通用数据库适配器接口
 *
 * @description 数据库操作的通用接口定义
 * @since 1.0.0
 */

/**
 * 数据库适配器接口
 *
 * @description 数据库操作的通用接口
 *
 * ## 业务规则
 *
 * ### 数据库操作规则
 * - 支持多种数据库类型（PostgreSQL、MySQL、SQLite等）
 * - 支持连接池管理
 * - 支持事务处理
 * - 支持查询优化
 *
 * ### 事务规则
 * - 支持嵌套事务
 * - 支持事务回滚
 * - 支持事务隔离级别
 * - 支持分布式事务
 *
 * ### 性能规则
 * - 支持查询缓存
 * - 支持批量操作
 * - 支持异步操作
 * - 支持连接复用
 */
export interface IDatabaseAdapter {
  /**
   * 执行查询
   *
   * @description 执行SQL查询
   * @param query - SQL查询语句
   * @param params - 查询参数
   * @returns 查询结果
   */
  query<T = any>(query: string, params?: any[]): Promise<T[]>;

  /**
   * 执行事务
   *
   * @description 在事务中执行多个操作
   * @param operations - 操作列表
   * @returns 事务结果
   */
  transaction<T>(operations: (tx: any) => Promise<T>): Promise<T>;

  /**
   * 开始事务
   *
   * @description 开始数据库事务
   * @returns 事务对象
   */
  beginTransaction(): Promise<any>;

  /**
   * 提交事务
   *
   * @description 提交数据库事务
   * @param tx - 事务对象
   * @returns 提交结果
   */
  commitTransaction(tx: any): Promise<void>;

  /**
   * 回滚事务
   *
   * @description 回滚数据库事务
   * @param tx - 事务对象
   * @returns 回滚结果
   */
  rollbackTransaction(tx: any): Promise<void>;

  /**
   * 执行批量操作
   *
   * @description 执行批量数据库操作
   * @param operations - 操作列表
   * @returns 批量操作结果
   */
  batch<T>(operations: Array<{ query: string; params?: any[] }>): Promise<T[]>;

  /**
   * 检查连接状态
   *
   * @description 检查数据库连接状态
   * @returns 连接状态
   */
  isConnected(): Promise<boolean>;

  /**
   * 关闭连接
   *
   * @description 关闭数据库连接
   * @returns 关闭结果
   */
  close(): Promise<void>;
}

/**
 * 数据库配置接口
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  pool?: {
    min: number;
    max: number;
    idleTimeoutMillis: number;
  };
  connectionTimeoutMillis?: number;
  queryTimeoutMillis?: number;
}
