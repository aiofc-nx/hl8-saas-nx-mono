/**
 * 通用缓存适配器接口
 *
 * @description 缓存操作的通用接口定义
 * @since 1.0.0
 */

/**
 * 缓存适配器接口
 *
 * @description 缓存操作的通用接口
 *
 * ## 业务规则
 *
 * ### 缓存策略规则
 * - 支持多级缓存（内存、Redis、数据库）
 * - 支持缓存过期时间
 * - 支持缓存键命名规范
 * - 支持缓存失效策略
 *
 * ### 性能规则
 * - 支持异步操作
 * - 支持批量操作
 * - 支持管道操作
 * - 支持连接复用
 *
 * ### 一致性规则
 * - 支持缓存更新通知
 * - 支持分布式缓存一致性
 * - 支持缓存版本控制
 * - 支持缓存事务性
 */
export interface ICacheAdapter {
  /**
   * 获取缓存
   *
   * @description 从缓存中获取值
   * @param key - 缓存键
   * @returns 缓存值
   */
  get<T = any>(key: string): Promise<T | null>;

  /**
   * 设置缓存
   *
   * @description 设置缓存值
   * @param key - 缓存键
   * @param value - 缓存值
   * @param ttl - 过期时间（秒）
   * @returns 设置结果
   */
  set(key: string, value: any, ttl?: number): Promise<void>;

  /**
   * 删除缓存
   *
   * @description 删除指定的缓存
   * @param key - 缓存键
   * @returns 删除结果
   */
  delete(key: string): Promise<void>;

  /**
   * 批量删除缓存
   *
   * @description 删除匹配模式的所有缓存
   * @param pattern - 匹配模式
   * @returns 删除结果
   */
  deletePattern(pattern: string): Promise<void>;

  /**
   * 检查缓存是否存在
   *
   * @description 检查指定的缓存键是否存在
   * @param key - 缓存键
   * @returns 是否存在
   */
  exists(key: string): Promise<boolean>;

  /**
   * 获取多个缓存值
   *
   * @description 批量获取多个缓存值
   * @param keys - 缓存键数组
   * @returns 缓存值映射
   */
  getMany<T = any>(keys: string[]): Promise<Map<string, T>>;

  /**
   * 设置多个缓存值
   *
   * @description 批量设置多个缓存值
   * @param entries - 缓存键值对映射
   * @param ttl - 过期时间（秒）
   * @returns 设置结果
   */
  setMany(entries: Map<string, any>, ttl?: number): Promise<void>;

  /**
   * 清空缓存
   *
   * @description 清空所有缓存
   * @returns 清空结果
   */
  clear(): Promise<void>;

  /**
   * 获取缓存统计信息
   *
   * @description 获取缓存的统计信息
   * @returns 缓存统计信息
   */
  getStats(): Promise<CacheAdapterStats>;

  /**
   * 检查连接状态
   *
   * @description 检查缓存连接状态
   * @returns 连接状态
   */
  isConnected(): Promise<boolean>;

  /**
   * 关闭连接
   *
   * @description 关闭缓存连接
   * @returns 关闭结果
   */
  close(): Promise<void>;
}

/**
 * 缓存适配器统计信息
 */
export interface CacheAdapterStats {
  hitCount: number;
  missCount: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: number;
  lastCleanup: Date;
}

/**
 * 缓存配置接口
 */
export interface CacheAdapterConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  ttl?: number;
  maxRetries?: number;
  retryDelayOnFailover?: number;
  enableReadyCheck?: boolean;
  maxMemoryPolicy?: string;
  lazyConnect?: boolean;
}
