/**
 * 通用缓存服务接口
 *
 * @description 缓存服务的通用接口定义
 * @since 1.0.0
 */

/**
 * 缓存服务接口
 *
 * @description 提供统一的缓存操作接口
 *
 * ## 业务规则
 *
 * ### 缓存策略规则
 * - 支持多级缓存（内存、Redis等）
 * - 支持缓存过期时间设置
 * - 支持缓存键命名规范
 * - 支持缓存失效策略
 *
 * ### 性能规则
 * - 缓存操作应该是异步的
 * - 缓存操作应该支持批量操作
 * - 缓存操作应该支持事务性
 * - 缓存操作应该支持监控和统计
 */
export interface ICacheService {
  /**
   * 获取缓存值
   *
   * @description 从缓存中获取值
   * @param key - 缓存键
   * @returns 缓存值或null
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * 设置缓存值
   *
   * @description 设置缓存值
   * @param key - 缓存键
   * @param value - 缓存值
   * @param ttl - 过期时间（秒）
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * 删除缓存值
   *
   * @description 删除指定的缓存值
   * @param key - 缓存键
   */
  delete(key: string): Promise<void>;

  /**
   * 清空缓存
   *
   * @description 清空所有缓存值
   */
  clear(): Promise<void>;

  /**
   * 检查缓存是否存在
   *
   * @description 检查指定的缓存键是否存在
   * @param key - 缓存键
   * @returns 是否存在
   */
  has(key: string): Promise<boolean>;

  /**
   * 获取多个缓存值
   *
   * @description 批量获取多个缓存值
   * @param keys - 缓存键数组
   * @returns 缓存值映射
   */
  getMany<T>(keys: string[]): Promise<Map<string, T>>;

  /**
   * 设置多个缓存值
   *
   * @description 批量设置多个缓存值
   * @param entries - 缓存键值对映射
   * @param ttl - 过期时间（秒）
   */
  setMany<T>(entries: Map<string, T>, ttl?: number): Promise<void>;

  /**
   * 删除多个缓存值
   *
   * @description 批量删除多个缓存值
   * @param keys - 缓存键数组
   */
  deleteMany(keys: string[]): Promise<void>;

  /**
   * 获取缓存统计信息
   *
   * @description 获取缓存的统计信息
   * @returns 缓存统计信息
   */
  getStats(): Promise<CacheStats>;
}

/**
 * 缓存统计信息
 */
export interface CacheStats {
  hitCount: number;
  missCount: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: number;
  lastCleanup: Date;
}

/**
 * 缓存配置
 */
export interface CacheConfig {
  defaultTTL: number;
  maxMemoryUsage: number;
  cleanupInterval: number;
  enableCompression: boolean;
  enableEncryption: boolean;
}
