/**
 * Messaging 模块常量定义
 *
 * @description 定义消息队列模块中使用的常量
 * 用于依赖注入、装饰器元数据、消息队列配置等
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
 * - 用于消息处理器装饰器
 * - 用于事件处理器装饰器
 * - 用于任务处理器装饰器
 *
 * @example
 * ```typescript
 * // 使用依赖注入令牌
 * @Inject(DI_TOKENS.MODULE_OPTIONS)
 * private readonly options: MessagingModuleOptions
 *
 * // 使用装饰器元数据键
 * @SetMetadata(DECORATOR_METADATA.MESSAGE_HANDLERS, handlers)
 * ```
 *
 * @fileoverview 消息队列模块常量定义文件
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
   * 消息队列模块配置选项令牌
   *
   * @description 用于注入消息队列模块的配置参数
   *
   * @example
   * ```typescript
   * @Inject(DI_TOKENS.MODULE_OPTIONS)
   * private readonly options: MessagingModuleOptions
   * ```
   */
  MODULE_OPTIONS: 'MESSAGING_MODULE_OPTIONS',
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
   * 消息处理器元数据键
   *
   * @description 用于 @MessageHandler() 装饰器
   * - 标识消息处理器方法
   * - 存储消息队列和处理器配置
   *
   * @example
   * ```typescript
   * @MessageHandler('user.created')
   * async handleUserCreated(message: UserCreatedMessage) {
   *   // 处理用户创建消息
   * }
   * ```
   */
  MESSAGE_HANDLERS: 'messageHandlers',

  /**
   * 事件处理器元数据键
   *
   * @description 用于 @EventHandler() 装饰器
   * - 标识事件处理器方法
   * - 存储事件名称和处理器配置
   *
   * @example
   * ```typescript
   * @EventHandler('order.completed')
   * async handleOrderCompleted(event: OrderCompletedEvent) {
   *   // 处理订单完成事件
   * }
   * ```
   */
  EVENT_HANDLERS: 'eventHandlers',

  /**
   * 任务处理器元数据键
   *
   * @description 用于 @TaskHandler() 装饰器
   * - 标识任务处理器方法
   * - 存储任务名称和处理器配置
   *
   * @example
   * ```typescript
   * @TaskHandler('send-email')
   * async handleSendEmail(task: SendEmailTask) {
   *   // 处理发送邮件任务
   * }
   * ```
   */
  TASK_HANDLERS: 'taskHandlers',
} as const;

// ============================================================================
// 消息队列适配器常量 (Messaging Adapter Constants)
// ============================================================================

/**
 * 消息队列适配器类型
 *
 * @description 定义支持的消息队列适配器类型
 * 使用 as const 确保类型安全
 */
export const ADAPTER_TYPES = {
  /**
   * RabbitMQ 适配器
   *
   * @description 使用 RabbitMQ 作为消息队列
   * 推荐用于生产环境
   */
  RABBITMQ: 'rabbitmq',

  /**
   * Redis 适配器
   *
   * @description 使用 Redis Streams 作为消息队列
   * 适用于简单的消息队列场景
   */
  REDIS: 'redis',

  /**
   * Kafka 适配器
   *
   * @description 使用 Apache Kafka 作为消息队列
   * 适用于高吞吐量场景
   */
  KAFKA: 'kafka',

  /**
   * 内存适配器
   *
   * @description 使用内存作为消息队列
   * 仅用于开发和测试环境
   */
  MEMORY: 'memory',
} as const;

// ============================================================================
// 任务状态常量 (Task Status Constants)
// ============================================================================

/**
 * 任务状态类型
 *
 * @description 定义任务的状态类型
 * 使用 as const 确保类型安全
 */
export const TASK_STATUS = {
  /**
   * 待处理状态
   *
   * @description 任务已创建，等待处理
   */
  PENDING: 'pending',

  /**
   * 运行中状态
   *
   * @description 任务正在执行
   */
  RUNNING: 'running',

  /**
   * 已完成状态
   *
   * @description 任务成功完成
   */
  COMPLETED: 'completed',

  /**
   * 失败状态
   *
   * @description 任务执行失败
   */
  FAILED: 'failed',

  /**
   * 已取消状态
   *
   * @description 任务被取消
   */
  CANCELLED: 'cancelled',

  /**
   * 重试中状态
   *
   * @description 任务正在重试
   */
  RETRYING: 'retrying',
} as const;

// ============================================================================
// 健康状态常量 (Health Status Constants)
// ============================================================================

/**
 * 健康状态类型
 *
 * @description 定义服务的健康状态类型
 * 使用 as const 确保类型安全
 */
export const HEALTH_STATUS = {
  /**
   * 健康状态
   *
   * @description 服务运行正常
   */
  HEALTHY: 'healthy',

  /**
   * 不健康状态
   *
   * @description 服务出现故障
   */
  UNHEALTHY: 'unhealthy',

  /**
   * 降级状态
   *
   * @description 服务部分功能不可用
   */
  DEGRADED: 'degraded',

  /**
   * 未知状态
   *
   * @description 无法确定服务状态
   */
  UNKNOWN: 'unknown',
} as const;

// ============================================================================
// 退避策略常量 (Backoff Strategy Constants)
// ============================================================================

/**
 * 退避策略类型
 *
 * @description 定义消息重试的退避策略
 * 使用 as const 确保类型安全
 */
export const BACKOFF_STRATEGIES = {
  /**
   * 线性退避
   *
   * @description 每次重试延迟固定增加
   */
  LINEAR: 'linear',

  /**
   * 指数退避
   *
   * @description 每次重试延迟指数增长
   */
  EXPONENTIAL: 'exponential',

  /**
   * 固定延迟
   *
   * @description 每次重试使用固定延迟
   */
  FIXED: 'fixed',
} as const;

// ============================================================================
// 配置默认值常量 (Configuration Defaults)
// ============================================================================

/**
 * 消息队列模块配置默认值
 *
 * @description 定义消息队列模块的默认配置值
 * 避免在代码中出现魔法数字和硬编码字符串
 */
export const MESSAGING_DEFAULTS = {
  /**
   * 默认队列前缀
   *
   * @description 消息队列的默认前缀
   */
  QUEUE_PREFIX: 'queue',

  /**
   * 默认主题前缀
   *
   * @description 发布/订阅主题的默认前缀
   */
  TOPIC_PREFIX: 'topic',

  /**
   * 默认交换器名称
   *
   * @description RabbitMQ 的默认交换器名称
   */
  EXCHANGE_NAME: 'messaging',

  /**
   * 最大重试次数
   *
   * @description 消息处理失败时的最大重试次数
   */
  MAX_RETRIES: 3,

  /**
   * 重试延迟（毫秒）
   *
   * @description 消息重试的默认延迟时间
   */
  RETRY_DELAY: 3000,

  /**
   * 消息过期时间（毫秒）
   *
   * @description 消息的默认过期时间
   */
  MESSAGE_TTL: 86400000, // 24 小时

  /**
   * 队列消息最大长度
   *
   * @description 队列中可保存的最大消息数量
   */
  MAX_QUEUE_LENGTH: 10000,

  /**
   * 统计间隔（毫秒）
   *
   * @description 统计信息更新的默认间隔时间
   */
  STATS_INTERVAL: 60000, // 1 分钟

  /**
   * 消费者预取数量
   *
   * @description 消费者一次性预取的消息数量
   */
  PREFETCH_COUNT: 10,

  /**
   * 连接超时（毫秒）
   *
   * @description 连接消息队列的超时时间
   */
  CONNECTION_TIMEOUT: 30000,
} as const;

// ============================================================================
// 队列选项常量 (Queue Options Constants)
// ============================================================================

/**
 * 队列选项默认值
 *
 * @description 定义创建队列时的默认选项
 * 使用 as const 确保类型安全
 */
export const QUEUE_DEFAULTS = {
  /**
   * 队列是否持久化
   *
   * @description 队列在服务器重启后是否保留
   */
  DURABLE: true,

  /**
   * 队列是否独占
   *
   * @description 队列是否只能被一个连接使用
   */
  EXCLUSIVE: false,

  /**
   * 队列是否自动删除
   *
   * @description 当没有消费者时是否自动删除队列
   */
  AUTO_DELETE: false,

  /**
   * 消息是否持久化
   *
   * @description 消息在服务器重启后是否保留
   */
  PERSISTENT: true,
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

/**
 * 适配器类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type AdapterType = (typeof ADAPTER_TYPES)[keyof typeof ADAPTER_TYPES];

/**
 * 任务状态类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type TaskStatusType = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

/**
 * 健康状态类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type HealthStatusType =
  (typeof HEALTH_STATUS)[keyof typeof HEALTH_STATUS];

/**
 * 退避策略类型
 *
 * @description 从常量对象中提取值类型，确保类型安全
 */
export type BackoffStrategyType =
  (typeof BACKOFF_STRATEGIES)[keyof typeof BACKOFF_STRATEGIES];
