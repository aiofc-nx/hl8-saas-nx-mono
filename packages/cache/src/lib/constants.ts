/**
 * Cache 模块常量定义
 *
 * @description 定义缓存模块中使用的常量
 * 用于依赖注入、装饰器元数据、配置键等
 *
 * ## 最佳实践
 *
 * - ✅ 使用 `as const` 确保类型推断
 * - ✅ 按功能模块分类组织
 * - ✅ 使用 UPPER_SNAKE_CASE 命名规范
 * - ✅ 避免魔法数字和硬编码字符串
 * - ✅ 提供类型安全的常量访问
 *
 * ## 使用场景
 *
 * ### 依赖注入令牌
 * - 用于 NestJS 依赖注入系统
 * - 标识模块配置和服务提供者
 *
 * ### 装饰器元数据键
 * - 用于装饰器标记方法
 * - 存储缓存策略配置
 *
 * @example
 * ```typescript
 * // 使用依赖注入令牌
 * @Inject(DI_TOKENS.MODULE_OPTIONS)
 * private readonly options: CacheModuleOptions
 *
 * // 使用装饰器元数据键
 * @SetMetadata(DECORATOR_METADATA.CACHEABLE, options)
 * ```
 *
 * @fileoverview 缓存模块常量定义文件
 */

// ============================================================================
// 依赖注入令牌 (Dependency Injection Tokens)
// ============================================================================

/**
 * 依赖注入令牌常量
 *
 * @description 用于 NestJS 依赖注入系统的令牌集合
 * 使用 as const 确保类型安全和自动补全
 */
export const DI_TOKENS = {
  /**
   * 缓存模块配置选项令牌
   *
   * @description 用于注入缓存模块的配置参数
   *
   * @example
   * ```typescript
   * @Inject(DI_TOKENS.MODULE_OPTIONS)
   * private readonly options: CacheModuleOptions
   * ```
   */
  MODULE_OPTIONS: 'CACHE_MODULE_OPTIONS',
} as const;

// ============================================================================
// 装饰器元数据键 (Decorator Metadata Keys)
// ============================================================================

/**
 * 装饰器元数据键常量
 *
 * @description 用于装饰器系统的元数据键集合
 * 按照装饰器功能分类组织
 */
export const DECORATOR_METADATA = {
  /**
   * 可缓存装饰器元数据键
   *
   * @description 用于 @Cacheable() 装饰器
   * - 自动缓存方法的返回值
   * - 支持租户上下文隔离
   * - 支持条件缓存和键生成
   * - 支持 TTL 设置
   *
   * @example
   * ```typescript
   * @Cacheable('user', { ttl: 3600 })
   * async getUser(id: string): Promise<User> {
   *   return await this.userRepository.findById(id);
   * }
   * ```
   */
  CACHEABLE: 'cacheable',

  /**
   * 缓存更新装饰器元数据键
   *
   * @description 用于 @CachePut() 装饰器
   * - 总是执行方法逻辑
   * - 执行后更新缓存值
   * - 支持租户上下文隔离
   * - 支持条件更新
   *
   * @example
   * ```typescript
   * @CachePut('user')
   * async updateUser(id: string, data: UpdateUserDto): Promise<User> {
   *   return await this.userRepository.update(id, data);
   * }
   * ```
   */
  CACHE_PUT: 'cache_put',

  /**
   * 缓存清除装饰器元数据键
   *
   * @description 用于 @CacheEvict() 装饰器
   * - 按键清除单个缓存
   * - 按模式批量清除缓存
   * - 支持条件清除
   * - 支持执行前/后清除
   *
   * @example
   * ```typescript
   * @CacheEvict('user', { allEntries: true })
   * async deleteUser(id: string): Promise<void> {
   *   await this.userRepository.delete(id);
   * }
   * ```
   */
  CACHE_EVICT: 'cache_evict',
} as const;

// ============================================================================
// 缓存配置常量 (Cache Configuration Constants)
// ============================================================================

/**
 * 缓存配置默认值
 *
 * @description 定义缓存模块的默认配置值
 * 避免在代码中出现魔法数字
 */
export const CACHE_DEFAULTS = {
  /**
   * 默认 TTL（秒）
   *
   * @description 缓存项的默认过期时间
   */
  TTL: 3600,

  /**
   * 默认键前缀
   *
   * @description 缓存键的默认前缀
   */
  KEY_PREFIX: 'cache',

  /**
   * 默认 Redis 数据库索引
   *
   * @description Redis 连接的默认数据库编号
   */
  REDIS_DB: 0,

  /**
   * 默认 Redis 端口
   *
   * @description Redis 服务器的默认端口号
   */
  REDIS_PORT: 6379,

  /**
   * 连接重试延迟（毫秒）
   *
   * @description Redis 连接失败时的重试延迟
   */
  RETRY_DELAY: 3000,

  /**
   * 最大重试次数
   *
   * @description Redis 连接失败时的最大重试次数
   */
  MAX_RETRIES: 3,
} as const;

// ============================================================================
// 类型导出 (Type Exports)
// ============================================================================

/**
 * 依赖注入令牌类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type DITokenType = (typeof DI_TOKENS)[keyof typeof DI_TOKENS];

/**
 * 装饰器元数据键类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type DecoratorMetadataType =
  (typeof DECORATOR_METADATA)[keyof typeof DECORATOR_METADATA];
