/**
 * 基础设施层常量定义
 *
 * 统一管理基础设施层中使用的所有常量，包括：
 * - 缓存相关常量
 * - 数据库相关常量
 * - 消息队列相关常量
 * - 事件存储相关常量
 * - 端口适配器相关常量
 * - 映射器相关常量
 * - 工厂相关常量
 * - 错误码和状态码
 *
 * @description 基础设施层常量管理
 * 提供统一的常量定义，避免硬编码，提高代码可维护性
 *
 * ## 业务规则
 *
 * ### 常量命名规则
 * - 使用 UPPER_SNAKE_CASE 命名
 * - 按功能模块分组
 * - 提供清晰的注释说明
 * - 使用 as const 确保类型安全
 *
 * ### 常量组织规则
 * - 按功能模块分组（缓存、数据库、消息队列等）
 * - 每个模块内部按字母顺序排列
 * - 提供完整的 JSDoc 注释
 * - 使用命名空间避免命名冲突
 *
 * @example
 * ```typescript
 * import { INFRASTRUCTURE_CONSTANTS } from './constants';
 *
 * // 使用缓存常量
 * const cacheKey = INFRASTRUCTURE_CONSTANTS.CACHE.DEFAULT_TTL;
 *
 * // 使用数据库常量
 * const queryTimeout = INFRASTRUCTURE_CONSTANTS.DATABASE.DEFAULT_QUERY_TIMEOUT;
 * ```
 *
 * @since 1.0.0
 */

/**
 * 基础设施层常量
 */
export const INFRASTRUCTURE_CONSTANTS = {
  /**
   * 缓存相关常量
   */
  CACHE: {
    /** 默认缓存生存时间（秒） */
    DEFAULT_TTL: 3600,
    /** 默认内存缓存大小限制 */
    DEFAULT_MEMORY_CACHE_SIZE: 1000,
    /** 默认 Redis 缓存大小限制 */
    DEFAULT_REDIS_CACHE_SIZE: 10000,
    /** 缓存键前缀 */
    KEY_PREFIX: 'hybrid_archi',
    /** 缓存统计键 */
    STATS_KEY: 'cache_stats',
    /** 缓存清理间隔（毫秒） */
    CLEANUP_INTERVAL: 300000, // 5分钟
    /** 缓存命中率阈值 */
    HIT_RATE_THRESHOLD: 0.8,
    /** 缓存级别 */
    LEVEL: {
      MEMORY: 'memory',
      REDIS: 'redis',
      DISTRIBUTED: 'distributed',
    } as const,
  },

  /**
   * 数据库相关常量
   */
  DATABASE: {
    /** 默认查询超时时间（毫秒） */
    DEFAULT_QUERY_TIMEOUT: 30000,
    /** 默认连接超时时间（毫秒） */
    DEFAULT_CONNECTION_TIMEOUT: 10000,
    /** 默认事务超时时间（毫秒） */
    DEFAULT_TRANSACTION_TIMEOUT: 60000,
    /** 默认连接池大小 */
    DEFAULT_POOL_SIZE: 10,
    /** 默认重试次数 */
    DEFAULT_RETRY_COUNT: 3,
    /** 默认重试延迟（毫秒） */
    DEFAULT_RETRY_DELAY: 1000,
    /** 查询缓存默认 TTL（秒） */
    QUERY_CACHE_TTL: 300,
    /** 慢查询阈值（毫秒） */
    SLOW_QUERY_THRESHOLD: 1000,
    /** 数据库类型 */
    TYPE: {
      POSTGRESQL: 'postgresql',
      MYSQL: 'mysql',
      SQLITE: 'sqlite',
      MONGODB: 'mongodb',
    } as const,
    /** 事务隔离级别 */
    ISOLATION_LEVEL: {
      READ_UNCOMMITTED: 'read_uncommitted',
      READ_COMMITTED: 'read_committed',
      REPEATABLE_READ: 'repeatable_read',
      SERIALIZABLE: 'serializable',
    } as const,
  },

  /**
   * 消息队列相关常量
   */
  MESSAGE_QUEUE: {
    /** 默认消息 TTL（毫秒） */
    DEFAULT_MESSAGE_TTL: 300000,
    /** 默认重试次数 */
    DEFAULT_RETRY_COUNT: 3,
    /** 默认重试延迟（毫秒） */
    DEFAULT_RETRY_DELAY: 1000,
    /** 默认队列大小 */
    DEFAULT_QUEUE_SIZE: 1000,
    /** 默认批处理大小 */
    DEFAULT_BATCH_SIZE: 100,
    /** 消息优先级 */
    PRIORITY: {
      LOW: 1,
      NORMAL: 5,
      HIGH: 10,
      CRITICAL: 20,
    } as const,
    /** 队列状态 */
    STATUS: {
      ACTIVE: 'active',
      PAUSED: 'paused',
      STOPPED: 'stopped',
    } as const,
  },

  /**
   * 事件存储相关常量
   */
  EVENT_STORE: {
    /** 默认事件 TTL（毫秒） */
    DEFAULT_EVENT_TTL: 86400000, // 24小时
    /** 默认快照间隔 */
    DEFAULT_SNAPSHOT_INTERVAL: 100,
    /** 默认事件批处理大小 */
    DEFAULT_BATCH_SIZE: 1000,
    /** 事件存储类型 */
    TYPE: {
      IN_MEMORY: 'in_memory',
      DATABASE: 'database',
      FILE: 'file',
    } as const,
    /** 事件状态 */
    STATUS: {
      PENDING: 'pending',
      PROCESSED: 'processed',
      FAILED: 'failed',
    } as const,
  },

  /**
   * 端口适配器相关常量
   */
  PORT_ADAPTERS: {
    /** 默认健康检查间隔（毫秒） */
    DEFAULT_HEALTH_CHECK_INTERVAL: 30000,
    /** 默认重试次数 */
    DEFAULT_RETRY_COUNT: 3,
    /** 默认超时时间（毫秒） */
    DEFAULT_TIMEOUT: 5000,
    /** 适配器类型 */
    TYPE: {
      LOGGER: 'logger',
      CONFIGURATION: 'configuration',
      ID_GENERATOR: 'id_generator',
      TIME_PROVIDER: 'time_provider',
      VALIDATION: 'validation',
      EVENT_BUS: 'event_bus',
    } as const,
    /** 健康状态 */
    HEALTH_STATUS: {
      HEALTHY: 'healthy',
      UNHEALTHY: 'unhealthy',
      UNKNOWN: 'unknown',
    } as const,
  },

  /**
   * 映射器相关常量
   */
  MAPPERS: {
    /** 默认映射器缓存大小 */
    DEFAULT_CACHE_SIZE: 100,
    /** 默认映射器 TTL（毫秒） */
    DEFAULT_TTL: 3600000, // 1小时
    /** 映射器类型 */
    TYPE: {
      DOMAIN: 'domain',
      AGGREGATE: 'aggregate',
      VALUE_OBJECT: 'value_object',
      DTO: 'dto',
    } as const,
    /** 映射器状态 */
    STATUS: {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      ERROR: 'error',
    } as const,
  },

  /**
   * 工厂相关常量
   */
  FACTORIES: {
    /** 默认服务启动超时（毫秒） */
    DEFAULT_SERVICE_START_TIMEOUT: 30000,
    /** 默认服务停止超时（毫秒） */
    DEFAULT_SERVICE_STOP_TIMEOUT: 10000,
    /** 默认健康检查超时（毫秒） */
    DEFAULT_HEALTH_CHECK_TIMEOUT: 5000,
    /** 工厂类型 */
    TYPE: {
      CACHE: 'cache',
      DATABASE: 'database',
      MESSAGE_QUEUE: 'message_queue',
      EVENT_STORE: 'event_store',
      DOMAIN_SERVICE: 'domain_service',
    } as const,
  },

  /**
   * 错误码和状态码
   */
  ERROR_CODES: {
    /** 缓存错误码 */
    CACHE: {
      KEY_NOT_FOUND: 'CACHE_KEY_NOT_FOUND',
      CONNECTION_FAILED: 'CACHE_CONNECTION_FAILED',
      OPERATION_FAILED: 'CACHE_OPERATION_FAILED',
    } as const,
    /** 数据库错误码 */
    DATABASE: {
      CONNECTION_FAILED: 'DATABASE_CONNECTION_FAILED',
      QUERY_FAILED: 'DATABASE_QUERY_FAILED',
      TRANSACTION_FAILED: 'DATABASE_TRANSACTION_FAILED',
      CONSTRAINT_VIOLATION: 'DATABASE_CONSTRAINT_VIOLATION',
    } as const,
    /** 消息队列错误码 */
    MESSAGE_QUEUE: {
      PUBLISH_FAILED: 'MESSAGE_QUEUE_PUBLISH_FAILED',
      CONSUME_FAILED: 'MESSAGE_QUEUE_CONSUME_FAILED',
      CONNECTION_FAILED: 'MESSAGE_QUEUE_CONNECTION_FAILED',
    } as const,
    /** 事件存储错误码 */
    EVENT_STORE: {
      STORE_FAILED: 'EVENT_STORE_STORE_FAILED',
      RETRIEVE_FAILED: 'EVENT_STORE_RETRIEVE_FAILED',
      SNAPSHOT_FAILED: 'EVENT_STORE_SNAPSHOT_FAILED',
    } as const,
  },

  /**
   * 日志相关常量
   */
  LOGGING: {
    /** 默认日志级别 */
    DEFAULT_LEVEL: 'info',
    /** 日志级别 */
    LEVEL: {
      DEBUG: 'debug',
      INFO: 'info',
      WARN: 'warn',
      ERROR: 'error',
    } as const,
    /** 日志上下文 */
    CONTEXT: {
      CACHE: 'cache',
      DATABASE: 'database',
      MESSAGE_QUEUE: 'message_queue',
      EVENT_STORE: 'event_store',
      PORT_ADAPTER: 'port_adapter',
      MAPPER: 'mapper',
      FACTORY: 'factory',
    } as const,
  },

  /**
   * 性能监控相关常量
   */
  PERFORMANCE: {
    /** 默认指标收集间隔（毫秒） */
    DEFAULT_METRICS_INTERVAL: 60000, // 1分钟
    /** 默认性能阈值（毫秒） */
    DEFAULT_PERFORMANCE_THRESHOLD: 1000,
    /** 指标类型 */
    METRICS_TYPE: {
      RESPONSE_TIME: 'response_time',
      THROUGHPUT: 'throughput',
      ERROR_RATE: 'error_rate',
      MEMORY_USAGE: 'memory_usage',
    } as const,
  },

  /**
   * 配置相关常量
   */
  CONFIG: {
    /** 默认配置前缀 */
    DEFAULT_PREFIX: 'HYBRID_ARCHI',
    /** 默认环境 */
    DEFAULT_ENVIRONMENT: 'development',
    /** 环境类型 */
    ENVIRONMENT: {
      DEVELOPMENT: 'development',
      TESTING: 'testing',
      STAGING: 'staging',
      PRODUCTION: 'production',
    } as const,
  },
} as const;

/**
 * 基础设施层错误消息
 */
export const INFRASTRUCTURE_ERROR_MESSAGES = {
  /** 缓存错误消息 */
  CACHE: {
    KEY_NOT_FOUND: '缓存键未找到',
    CONNECTION_FAILED: '缓存连接失败',
    OPERATION_FAILED: '缓存操作失败',
    INVALID_KEY: '无效的缓存键',
    TTL_EXPIRED: '缓存生存时间已过期',
  } as const,

  /** 数据库错误消息 */
  DATABASE: {
    CONNECTION_FAILED: '数据库连接失败',
    QUERY_FAILED: '数据库查询失败',
    TRANSACTION_FAILED: '数据库事务失败',
    CONSTRAINT_VIOLATION: '数据库约束违反',
    TIMEOUT: '数据库操作超时',
    INVALID_QUERY: '无效的数据库查询',
  } as const,

  /** 消息队列错误消息 */
  MESSAGE_QUEUE: {
    PUBLISH_FAILED: '消息发布失败',
    CONSUME_FAILED: '消息消费失败',
    CONNECTION_FAILED: '消息队列连接失败',
    QUEUE_FULL: '消息队列已满',
    MESSAGE_EXPIRED: '消息已过期',
  } as const,

  /** 事件存储错误消息 */
  EVENT_STORE: {
    STORE_FAILED: '事件存储失败',
    RETRIEVE_FAILED: '事件检索失败',
    SNAPSHOT_FAILED: '快照创建失败',
    EVENT_NOT_FOUND: '事件未找到',
    INVALID_EVENT: '无效的事件',
  } as const,

  /** 端口适配器错误消息 */
  PORT_ADAPTER: {
    INITIALIZATION_FAILED: '端口适配器初始化失败',
    HEALTH_CHECK_FAILED: '端口适配器健康检查失败',
    OPERATION_FAILED: '端口适配器操作失败',
    TIMEOUT: '端口适配器操作超时',
  } as const,

  /** 映射器错误消息 */
  MAPPER: {
    MAPPING_FAILED: '映射失败',
    INVALID_SOURCE: '无效的源对象',
    INVALID_TARGET: '无效的目标对象',
    REGISTRATION_FAILED: '映射器注册失败',
  } as const,

  /** 工厂错误消息 */
  FACTORY: {
    CREATION_FAILED: '对象创建失败',
    INVALID_CONFIG: '无效的配置',
    SERVICE_START_FAILED: '服务启动失败',
    SERVICE_STOP_FAILED: '服务停止失败',
  } as const,
} as const;

/**
 * 基础设施层默认配置
 */
export const INFRASTRUCTURE_DEFAULT_CONFIG = {
  /** 缓存默认配置 */
  CACHE: {
    ttl: INFRASTRUCTURE_CONSTANTS.CACHE.DEFAULT_TTL,
    memoryCacheSize: INFRASTRUCTURE_CONSTANTS.CACHE.DEFAULT_MEMORY_CACHE_SIZE,
    redisCacheSize: INFRASTRUCTURE_CONSTANTS.CACHE.DEFAULT_REDIS_CACHE_SIZE,
    keyPrefix: INFRASTRUCTURE_CONSTANTS.CACHE.KEY_PREFIX,
    cleanupInterval: INFRASTRUCTURE_CONSTANTS.CACHE.CLEANUP_INTERVAL,
  },

  /** 数据库默认配置 */
  DATABASE: {
    queryTimeout: INFRASTRUCTURE_CONSTANTS.DATABASE.DEFAULT_QUERY_TIMEOUT,
    connectionTimeout:
      INFRASTRUCTURE_CONSTANTS.DATABASE.DEFAULT_CONNECTION_TIMEOUT,
    transactionTimeout:
      INFRASTRUCTURE_CONSTANTS.DATABASE.DEFAULT_TRANSACTION_TIMEOUT,
    poolSize: INFRASTRUCTURE_CONSTANTS.DATABASE.DEFAULT_POOL_SIZE,
    retryCount: INFRASTRUCTURE_CONSTANTS.DATABASE.DEFAULT_RETRY_COUNT,
    retryDelay: INFRASTRUCTURE_CONSTANTS.DATABASE.DEFAULT_RETRY_DELAY,
  },

  /** 消息队列默认配置 */
  MESSAGE_QUEUE: {
    messageTtl: INFRASTRUCTURE_CONSTANTS.MESSAGE_QUEUE.DEFAULT_MESSAGE_TTL,
    retryCount: INFRASTRUCTURE_CONSTANTS.MESSAGE_QUEUE.DEFAULT_RETRY_COUNT,
    retryDelay: INFRASTRUCTURE_CONSTANTS.MESSAGE_QUEUE.DEFAULT_RETRY_DELAY,
    queueSize: INFRASTRUCTURE_CONSTANTS.MESSAGE_QUEUE.DEFAULT_QUEUE_SIZE,
    batchSize: INFRASTRUCTURE_CONSTANTS.MESSAGE_QUEUE.DEFAULT_BATCH_SIZE,
  },

  /** 事件存储默认配置 */
  EVENT_STORE: {
    eventTtl: INFRASTRUCTURE_CONSTANTS.EVENT_STORE.DEFAULT_EVENT_TTL,
    snapshotInterval:
      INFRASTRUCTURE_CONSTANTS.EVENT_STORE.DEFAULT_SNAPSHOT_INTERVAL,
    batchSize: INFRASTRUCTURE_CONSTANTS.EVENT_STORE.DEFAULT_BATCH_SIZE,
  },

  /** 端口适配器默认配置 */
  PORT_ADAPTERS: {
    healthCheckInterval:
      INFRASTRUCTURE_CONSTANTS.PORT_ADAPTERS.DEFAULT_HEALTH_CHECK_INTERVAL,
    retryCount: INFRASTRUCTURE_CONSTANTS.PORT_ADAPTERS.DEFAULT_RETRY_COUNT,
    timeout: INFRASTRUCTURE_CONSTANTS.PORT_ADAPTERS.DEFAULT_TIMEOUT,
  },

  /** 映射器默认配置 */
  MAPPERS: {
    cacheSize: INFRASTRUCTURE_CONSTANTS.MAPPERS.DEFAULT_CACHE_SIZE,
    ttl: INFRASTRUCTURE_CONSTANTS.MAPPERS.DEFAULT_TTL,
  },

  /** 工厂默认配置 */
  FACTORIES: {
    serviceStartTimeout:
      INFRASTRUCTURE_CONSTANTS.FACTORIES.DEFAULT_SERVICE_START_TIMEOUT,
    serviceStopTimeout:
      INFRASTRUCTURE_CONSTANTS.FACTORIES.DEFAULT_SERVICE_STOP_TIMEOUT,
    healthCheckTimeout:
      INFRASTRUCTURE_CONSTANTS.FACTORIES.DEFAULT_HEALTH_CHECK_TIMEOUT,
  },
} as const;

/**
 * 基础设施层类型定义
 */
export type InfrastructureConstants = typeof INFRASTRUCTURE_CONSTANTS;
export type InfrastructureErrorMessages = typeof INFRASTRUCTURE_ERROR_MESSAGES;
export type InfrastructureDefaultConfig = typeof INFRASTRUCTURE_DEFAULT_CONFIG;
