import { IMultiTenancyModuleOptions } from '@hl8/multi-tenancy';

/**
 * 消息队列适配器类型枚举
 *
 * 定义支持的消息队列适配器类型，包括RabbitMQ、Redis、Kafka、Memory等。
 *
 * @description 此枚举定义支持的消息队列适配器类型。
 * 包括RabbitMQ、Redis、Kafka、Memory等主流消息队列。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 适配器类型规则
 * - RABBITMQ：RabbitMQ消息队列
 * - REDIS：Redis Streams消息队列
 * - KAFKA：Apache Kafka消息队列
 * - MEMORY：内存消息队列（用于测试）
 *
 * ### 适配器选择规则
 * - 根据业务需求选择适配器
 * - 支持适配器动态切换
 * - 支持适配器健康检查
 * - 支持适配器性能监控
 *
 * @example
 * ```typescript
 * // 使用RabbitMQ适配器
 * const adapter = MessagingAdapterType.RABBITMQ;
 *
 * // 使用Redis适配器
 * const adapter = MessagingAdapterType.REDIS;
 * ```
 */
export enum MessagingAdapterType {
  RABBITMQ = 'rabbitmq',
  REDIS = 'redis',
  KAFKA = 'kafka',
  MEMORY = 'memory',
}

/**
 * 消息处理器函数类型
 */
export type MessageHandler<T = unknown> = (message: T) => Promise<void> | void;

/**
 * 事件处理器函数类型
 */
export type EventHandler<T = unknown> = (event: T) => Promise<void> | void;

/**
 * 任务处理器函数类型
 */
export type TaskHandler<T = unknown> = (task: T) => Promise<void> | void;

/**
 * 死信队列处理器函数类型
 */
export type DeadLetterHandler = (
  message: DeadLetterMessage
) => Promise<void> | void;

/**
 * 消息接口
 */
export interface Message<T = unknown> {
  /** 消息唯一标识符 */
  id: string;
  /** 消息内容 */
  data: T;
  /** 消息时间戳 */
  timestamp: Date;
  /** 消息路由键 */
  routingKey?: string;
  /** 消息头信息 */
  headers?: Record<string, unknown>;
  /** 租户ID */
  tenantId?: string;
  /** 消息类型 */
  type?: string;
  /** 消息版本 */
  version?: string;
}

/**
 * 发布选项接口
 */
export interface PublishOptions {
  /** 消息过期时间（毫秒） */
  expiration?: number;
  /** 消息优先级 */
  priority?: number;
  /** 消息持久化 */
  persistent?: boolean;
  /** 消息头信息 */
  headers?: Record<string, unknown>;
  /** 路由键 */
  routingKey?: string;
  /** 使用的适配器类型 */
  adapter?: MessagingAdapterType;
  /** 消息确认 */
  mandatory?: boolean;
  /** 消息确认回调 */
  ack?: boolean;
  /** Kafka分区（仅用于Kafka适配器） */
  partition?: number;
}

/**
 * 发送选项接口
 */
export interface SendOptions {
  /** 消息过期时间（毫秒） */
  expiration?: number;
  /** 消息优先级 */
  priority?: number;
  /** 消息持久化 */
  persistent?: boolean;
  /** 消息头信息 */
  headers?: Record<string, unknown>;
  /** 使用的适配器类型 */
  adapter?: MessagingAdapterType;
  /** 消息确认 */
  mandatory?: boolean;
  /** 消息确认回调 */
  ack?: boolean;
  /** 延迟发送（毫秒） */
  delay?: number;
  /** Kafka分区（仅用于Kafka适配器） */
  partition?: number;
}

/**
 * 队列选项接口
 */
export interface QueueOptions {
  /** 队列是否持久化 */
  durable?: boolean;
  /** 队列是否独占 */
  exclusive?: boolean;
  /** 队列是否自动删除 */
  autoDelete?: boolean;
  /** 队列参数 */
  arguments?: Record<string, unknown>;
  /** 消息TTL（毫秒） */
  messageTtl?: number;
  /** 队列TTL（毫秒） */
  queueTtl?: number;
  /** 最大消息长度 */
  maxLength?: number;
  /** 最大字节长度 */
  maxBytes?: number;
  /** 死信交换器 */
  deadLetterExchange?: string;
  /** 死信路由键 */
  deadLetterRoutingKey?: string;
  /** Kafka分区数量（仅用于Kafka适配器） */
  partitions?: number;
  /** Kafka副本因子（仅用于Kafka适配器） */
  replicationFactor?: number;
  /** Kafka主题配置（仅用于Kafka适配器） */
  configEntries?: Array<{ name: string; value: string }>;
}

/**
 * 事件选项接口
 */
export interface EventOptions {
  /** 事件过期时间（毫秒） */
  expiration?: number;
  /** 事件优先级 */
  priority?: number;
  /** 事件持久化 */
  persistent?: boolean;
  /** 事件头信息 */
  headers?: Record<string, unknown>;
  /** 使用的适配器类型 */
  adapter?: MessagingAdapterType;
  /** 事件确认 */
  ack?: boolean;
  /** 事件版本 */
  version?: string;
}

/**
 * 任务选项接口
 */
export interface TaskOptions {
  /** 任务优先级 */
  priority?: number;
  /** 任务延迟执行（毫秒） */
  delay?: number;
  /** 任务重试次数 */
  retries?: number;
  /** 任务超时时间（毫秒） */
  timeout?: number;
  /** 任务头信息 */
  headers?: Record<string, unknown>;
  /** 使用的适配器类型 */
  adapter?: MessagingAdapterType;
  /** 任务确认 */
  ack?: boolean;
  /** 任务标签 */
  tags?: string[];
}

/**
 * 调度选项接口
 */
export interface ScheduleOptions {
  /** 调度表达式（cron格式） */
  cron?: string;
  /** 调度时间间隔（毫秒） */
  interval?: number;
  /** 调度开始时间 */
  startDate?: Date;
  /** 调度结束时间 */
  endDate?: Date;
  /** 调度时区 */
  timezone?: string;
  /** 是否立即执行一次 */
  immediate?: boolean;
  /** 延迟执行时间（毫秒） */
  delay?: number;
}

/**
 * 连接信息接口
 */
export interface ConnectionInfo {
  /** 连接状态 */
  connected: boolean;
  /** 连接时间 */
  connectedAt?: Date;
  /** 断开时间 */
  disconnectedAt?: Date;
  /** 连接错误 */
  error?: string;
  /** 连接配置 */
  config?: Record<string, unknown>;
}

/**
 * 队列信息接口
 */
export interface QueueInfo {
  /** 队列名称 */
  name: string;
  /** 队列消息数量 */
  messageCount: number;
  /** 队列消费者数量 */
  consumerCount: number;
  /** 队列是否持久化 */
  durable: boolean;
  /** 队列是否独占 */
  exclusive: boolean;
  /** 队列是否自动删除 */
  autoDelete: boolean;
  /** 队列参数 */
  arguments?: Record<string, unknown>;
}

/**
 * 主题信息接口
 */
export interface TopicInfo {
  /** 主题名称 */
  name: string;
  /** 主题分区数量 */
  partitions: number;
  /** 主题副本数量 */
  replicas: number;
  /** 主题配置 */
  config?: Record<string, unknown>;
}

/**
 * 任务状态枚举
 */
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying',
}

/**
 * 任务消息接口
 */
export interface TaskMessage {
  /** 任务ID */
  taskId: string;
  /** 任务名称 */
  taskName: string;
  /** 任务数据 */
  data: unknown;
}

/**
 * 任务历史接口
 */
export interface TaskHistory {
  /** 任务ID */
  taskId: string;
  /** 任务名称 */
  taskName: string;
  /** 任务状态 */
  status: TaskStatus;
  /** 任务时间戳 */
  createdAt: Date;
  /** 任务数据 */
  data: unknown;
  /** 任务错误 */
  error?: string;
  /** 租户ID */
  tenantId?: string;
}

/**
 * 调度任务接口
 */
export interface ScheduledTask {
  /** 任务ID */
  taskId: string;
  /** 任务名称 */
  taskName: string;
  /** 调度配置 */
  schedule: ScheduleOptions;
  /** 任务数据 */
  data: unknown;
  /** 下次执行时间 */
  nextRunAt: Date;
  /** 任务状态 */
  status: TaskStatus;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 租户ID */
  tenantId?: string;
}

/**
 * 死信消息接口
 */
export interface DeadLetterMessage {
  /** 消息ID */
  messageId: string;
  /** 原始消息 */
  originalMessage: Message;
  /** 错误信息 */
  error: string;
  /** 重试次数 */
  retryCount: number;
  /** 进入死信队列时间 */
  deadLetterAt: Date;
  /** 租户ID */
  tenantId?: string;
}

/**
 * 连接统计接口
 */
export interface ConnectionStats {
  /** 连接数量 */
  connectionCount: number;
  /** 活跃连接数量 */
  activeConnectionCount: number;
  /** 总连接时间 */
  totalConnectionTime: number;
  /** 平均连接时间 */
  averageConnectionTime: number;
  /** 连接错误次数 */
  connectionErrorCount: number;
  /** 最后连接时间 */
  lastConnectedAt?: Date;
  /** 最后断开时间 */
  lastDisconnectedAt?: Date;
}

/**
 * 适配器统计接口
 */
export interface AdapterStats {
  /** 适配器类型 */
  adapterType: MessagingAdapterType;
  /** 连接状态 */
  connected: boolean;
  /** 消息发送数量 */
  messagesSent: number;
  /** 消息接收数量 */
  messagesReceived: number;
  /** 消息发送错误数量 */
  sendErrorCount: number;
  /** 消息接收错误数量 */
  receiveErrorCount: number;
  /** 队列数量 */
  queueCount: number;
  /** 主题数量 */
  topicCount: number;
  /** 消费者数量 */
  consumerCount: number;
  /** 生产者数量 */
  producerCount: number;
}

/**
 * 消息统计接口
 */
export interface MessageStats {
  /** 总消息数量 */
  totalMessages: number;
  /** 发送消息数量 */
  sentMessages: number;
  /** 接收消息数量 */
  receivedMessages: number;
  /** 处理成功消息数量 */
  processedMessages: number;
  /** 处理失败消息数量 */
  failedMessages: number;
  /** 重试消息数量 */
  retriedMessages: number;
  /** 死信消息数量 */
  deadLetterMessages: number;
  /** 消息吞吐量（每秒） */
  throughput: number;
  /** 平均处理时间（毫秒） */
  averageProcessingTime: number;
}

/**
 * 队列统计接口
 */
export interface QueueStats {
  /** 队列名称 */
  queueName: string;
  /** 队列消息数量 */
  messageCount: number;
  /** 队列消费者数量 */
  consumerCount: number;
  /** 队列处理速度（每秒） */
  processingRate: number;
  /** 队列平均处理时间（毫秒） */
  averageProcessingTime: number;
  /** 队列错误数量 */
  errorCount: number;
  /** 队列重试数量 */
  retryCount: number;
}

/**
 * 主题统计接口
 */
export interface TopicStats {
  /** 主题名称 */
  topicName: string;
  /** 主题分区数量 */
  partitionCount: number;
  /** 主题消息数量 */
  messageCount: number;
  /** 主题消费者数量 */
  consumerCount: number;
  /** 主题处理速度（每秒） */
  processingRate: number;
  /** 主题平均处理时间（毫秒） */
  averageProcessingTime: number;
  /** 主题错误数量 */
  errorCount: number;
}

/**
 * 吞吐量统计接口
 */
export interface ThroughputStats {
  /** 消息吞吐量（每秒） */
  messageThroughput: number;
  /** 字节吞吐量（每秒） */
  byteThroughput: number;
  /** 峰值消息吞吐量（每秒） */
  peakMessageThroughput: number;
  /** 峰值字节吞吐量（每秒） */
  peakByteThroughput: number;
  /** 平均消息吞吐量（每秒） */
  averageMessageThroughput: number;
  /** 平均字节吞吐量（每秒） */
  averageByteThroughput: number;
}

/**
 * 延迟统计接口
 */
export interface LatencyStats {
  /** 平均延迟（毫秒） */
  averageLatency: number;
  /** 最小延迟（毫秒） */
  minLatency: number;
  /** 最大延迟（毫秒） */
  maxLatency: number;
  /** 95%延迟（毫秒） */
  p95Latency: number;
  /** 99%延迟（毫秒） */
  p99Latency: number;
  /** 延迟分布 */
  latencyDistribution: Record<string, number>;
}

/**
 * 错误统计接口
 */
export interface ErrorStats {
  /** 总错误数量 */
  totalErrors: number;
  /** 连接错误数量 */
  connectionErrors: number;
  /** 消息发送错误数量 */
  sendErrors: number;
  /** 消息接收错误数量 */
  receiveErrors: number;
  /** 处理错误数量 */
  processingErrors: number;
  /** 超时错误数量 */
  timeoutErrors: number;
  /** 错误类型分布 */
  errorTypeDistribution: Record<string, number>;
  /** 错误率 */
  errorRate: number;
}

/**
 * 租户消息统计接口
 */
export interface TenantMessagingStats {
  /** 租户ID */
  tenantId: string;
  /** 租户消息数量 */
  messageCount: number;
  /** 租户队列数量 */
  queueCount: number;
  /** 租户主题数量 */
  topicCount: number;
  /** 租户消费者数量 */
  consumerCount: number;
  /** 租户生产者数量 */
  producerCount: number;
  /** 租户消息吞吐量（每秒） */
  throughput: number;
  /** 租户平均处理时间（毫秒） */
  averageProcessingTime: number;
  /** 租户错误数量 */
  errorCount: number;
  /** 租户重试数量 */
  retryCount: number;
  /** 租户死信数量 */
  deadLetterCount: number;
}

/**
 * 健康状态枚举
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  DEGRADED = 'degraded',
  UNKNOWN = 'unknown',
}

/**
 * 健康检查接口
 */
export interface HealthCheck {
  /** 检查名称 */
  name: string;
  /** 健康状态 */
  status: HealthStatus;
  /** 检查时间 */
  checkedAt: Date;
  /** 检查耗时（毫秒） */
  duration: number;
  /** 检查结果 */
  result: unknown;
  /** 错误信息 */
  error?: string;
  /** 租户ID */
  tenantId?: string;
}

/**
 * 适配器信息接口
 */
export interface AdapterInfo {
  /** 适配器类型 */
  type: MessagingAdapterType;
  /** 适配器名称 */
  name: string;
  /** 适配器版本 */
  version: string;
  /** 适配器描述 */
  description: string;
  /** 适配器配置 */
  config: Record<string, unknown>;
  /** 适配器状态 */
  status: HealthStatus;
}

/**
 * 退避策略枚举
 */
export enum BackoffStrategy {
  LINEAR = 'linear',
  EXPONENTIAL = 'exponential',
  FIXED = 'fixed',
}

/**
 * RabbitMQ配置接口
 */
export interface RabbitMQConfig {
  /** RabbitMQ连接URL */
  url: string;
  /** 交换器名称 */
  exchange: string;
  /** 队列前缀 */
  queuePrefix: string;
  /** 连接选项 */
  options?: Record<string, unknown>;
}

/**
 * Redis配置接口
 */
export interface RedisConfig {
  /** Redis主机 */
  host: string;
  /** Redis端口 */
  port: number;
  /** Redis密码 */
  password?: string;
  /** Redis数据库 */
  db?: number;
  /** 流前缀 */
  streamPrefix: string;
  /** 连接选项 */
  options?: Record<string, unknown>;
}

/**
 * Kafka配置接口
 */
export interface KafkaConfig {
  /** 客户端ID */
  clientId: string;
  /** 代理列表 */
  brokers: string[];
  /** 主题前缀 */
  topicPrefix: string;
  /** 连接选项 */
  options?: Record<string, unknown>;
}

/**
 * 租户消息配置接口
 */
export interface TenantMessagingConfig {
  /** 是否启用隔离 */
  enableIsolation: boolean;
  /** 租户前缀 */
  tenantPrefix: string;
  /** 自动创建租户队列 */
  autoCreateTenantQueues: boolean;
  /** 租户队列限制 */
  tenantQueueLimit: number;
}

/**
 * 重试配置接口
 */
export interface RetryConfig {
  /** 最大重试次数 */
  maxRetries: number;
  /** 重试延迟（毫秒） */
  retryDelay: number;
  /** 退避策略 */
  backoff: BackoffStrategy;
  /** 启用死信队列 */
  enableDeadLetterQueue: boolean;
}

/**
 * 监控配置接口
 */
export interface MonitoringConfig {
  /** 启用统计 */
  enableStats: boolean;
  /** 启用健康检查 */
  enableHealthCheck: boolean;
  /** 统计间隔（毫秒） */
  statsInterval: number;
}

/**
 * 消息队列模块选项接口
 */
export interface MessagingModuleOptions {
  /** 适配器配置 */
  adapter: MessagingAdapterType;
  /** RabbitMQ配置 */
  rabbitmq?: RabbitMQConfig;
  /** Redis配置 */
  redis?: RedisConfig;
  /** Kafka配置 */
  kafka?: KafkaConfig;
  /** 多租户配置 - 集成@hl8/multi-tenancy */
  multiTenancy?: IMultiTenancyModuleOptions;
  /** 重试配置 */
  retry?: RetryConfig;
  /** 监控配置 */
  monitoring?: MonitoringConfig;
  /** 向后兼容配置 */
  tenant?: TenantMessagingConfig;
  /** 启用租户隔离 */
  enableTenantIsolation?: boolean;
  /** 键前缀 */
  keyPrefix?: string;
  /** 文档URL - 用于异常处理 */
  documentationUrl?: string;
  /** 缓存配置 */
  cache?: MessagingCacheConfig;
}

/**
 * 消息队列缓存配置接口
 */
export interface MessagingCacheConfig {
  /** 启用消息去重缓存 */
  enableMessageDeduplication?: boolean;
  /** 启用消费者状态缓存 */
  enableConsumerStateCache?: boolean;
  /** 启用统计信息缓存 */
  enableStatsCache?: boolean;
  /** 启用死信队列缓存 */
  enableDeadLetterCache?: boolean;
  /** 启用租户配置缓存 */
  enableTenantConfigCache?: boolean;
  /** 缓存TTL配置 */
  cacheTTL?: {
    /** 消息去重缓存TTL（秒） */
    messageDedup?: number;
    /** 消费者状态缓存TTL（秒） */
    consumerState?: number;
    /** 统计信息缓存TTL（秒） */
    stats?: number;
    /** 死信队列缓存TTL（秒） */
    deadLetter?: number;
    /** 租户配置缓存TTL（秒） */
    tenantConfig?: number;
  };
  /** 缓存键前缀 */
  keyPrefix?: string;
  /** Redis配置（可选，默认使用cache模块的配置） */
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
}

/**
 * 消息队列服务接口
 */
export interface IMessagingService {
  // 发布/订阅操作 - 自动处理租户上下文
  publish<T>(
    topic: string,
    message: T,
    options?: PublishOptions
  ): Promise<void>;
  subscribe<T>(topic: string, handler: MessageHandler<T>): Promise<void>;
  unsubscribe(topic: string, handler?: MessageHandler<unknown>): Promise<void>;

  // 队列操作 - 自动处理租户上下文
  sendToQueue<T>(
    queue: string,
    message: T,
    options?: SendOptions
  ): Promise<void>;
  consume<T>(queue: string, handler: MessageHandler<T>): Promise<void>;
  cancelConsumer(queue: string): Promise<void>;

  // 连接管理
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getConnectionInfo(): ConnectionInfo;

  // 队列管理
  createQueue(queue: string, options?: QueueOptions): Promise<void>;
  deleteQueue(queue: string): Promise<void>;
  purgeQueue(queue: string): Promise<void>;
  getQueueInfo(queue: string): Promise<QueueInfo>;

  // 租户上下文操作
  getCurrentTenant(): string | null;
  hasTenantContext(): boolean;
}

/**
 * 事件服务接口
 */
export interface IEventService {
  // 事件操作 - 自动处理租户上下文
  emit<T>(eventName: string, data: T, options?: EventOptions): Promise<void>;
  on<T>(eventName: string, handler: EventHandler<T>): Promise<void>;
  off(eventName: string, handler?: EventHandler<unknown>): Promise<void>;
  once<T>(eventName: string, handler: EventHandler<T>): Promise<void>;

  // 事件管理
  getEventNames(): string[];
  getEventListeners(eventName: string): EventHandler<unknown>[];
  removeAllListeners(eventName?: string): Promise<void>;

  // 租户事件 - 使用multi-tenancy服务
  emitTenantEvent<T>(
    tenantId: string,
    eventName: string,
    data: T
  ): Promise<void>;
  onTenantEvent<T>(
    tenantId: string,
    eventName: string,
    handler: EventHandler<T>
  ): Promise<void>;
  offTenantEvent(
    tenantId: string,
    eventName: string,
    handler?: EventHandler<unknown>
  ): Promise<void>;
}

/**
 * 任务服务接口
 */
export interface ITaskService {
  // 任务操作 - 自动处理租户上下文
  addTask<T>(taskName: string, data: T, options?: TaskOptions): Promise<void>;
  processTask<T>(taskName: string, handler: TaskHandler<T>): Promise<void>;
  cancelTask(taskId: string): Promise<void>;

  // 任务管理
  getTaskStatus(taskId: string): Promise<TaskStatus>;
  getTaskHistory(taskName: string, limit?: number): Promise<TaskHistory[]>;
  retryTask(taskId: string): Promise<void>;
  failTask(taskId: string, error: Error): Promise<void>;

  // 任务调度
  scheduleTask<T>(
    taskName: string,
    data: T,
    schedule: ScheduleOptions
  ): Promise<void>;
  cancelScheduledTask(taskId: string): Promise<void>;
  getScheduledTasks(): Promise<ScheduledTask[]>;
}

/**
 * 租户消息服务接口
 */
export interface ITenantMessagingService extends IMessagingService {
  // 租户消息操作 - 使用multi-tenancy服务
  publishTenantMessage<T>(
    tenantId: string,
    topic: string,
    message: T
  ): Promise<void>;
  subscribeTenantMessage<T>(
    tenantId: string,
    topic: string,
    handler: MessageHandler<T>
  ): Promise<void>;
  unsubscribeTenantMessage(
    tenantId: string,
    topic: string,
    handler?: MessageHandler<unknown>
  ): Promise<void>;

  // 租户队列操作
  sendToTenantQueue<T>(
    tenantId: string,
    queue: string,
    message: T
  ): Promise<void>;
  consumeTenantQueue<T>(
    tenantId: string,
    queue: string,
    handler: MessageHandler<T>
  ): Promise<void>;

  // 租户管理
  createTenantQueues(tenantId: string): Promise<void>;
  deleteTenantQueues(tenantId: string): Promise<void>;
  getTenantQueues(tenantId: string): Promise<string[]>;
  clearTenantMessages(tenantId: string): Promise<void>;

  // 租户统计
  getTenantStats(tenantId: string): Promise<TenantMessagingStats>;
}

/**
 * 租户隔离策略接口
 */
export interface ITenantIsolationStrategy {
  // 命名空间策略 - 使用multi-tenancy服务
  getTenantNamespace(tenantId: string): string;
  getTenantQueueName(tenantId: string, queueName: string): Promise<string>;
  getTenantTopicName(tenantId: string, topicName: string): Promise<string>;

  // 路由策略
  shouldIsolateTenant(tenantId: string): boolean;
  getTenantRoutingKey(tenantId: string, routingKey: string): Promise<string>;

  // 配置策略
  getTenantConfig(tenantId: string): TenantMessagingConfig;
  createTenantConfig(tenantId: string): TenantMessagingConfig;
  updateTenantConfig(
    tenantId: string,
    config: TenantMessagingConfig
  ): Promise<void>;
}

/**
 * 消息适配器接口
 */
export interface IMessagingAdapter {
  // 连接管理
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // 消息操作
  publish<T>(
    topic: string,
    message: T,
    options?: PublishOptions
  ): Promise<void>;
  subscribe<T>(topic: string, handler: MessageHandler<T>): Promise<void>;
  sendToQueue<T>(
    queue: string,
    message: T,
    options?: SendOptions
  ): Promise<void>;
  consume<T>(queue: string, handler: MessageHandler<T>): Promise<void>;

  // 队列管理
  createQueue(queue: string, options?: QueueOptions): Promise<void>;
  deleteQueue(queue: string): Promise<void>;
  purgeQueue?(queue: string): Promise<void>;
  getQueueInfo(queue: string): Promise<QueueInfo>;

  // 订阅管理
  unsubscribe?(topic: string, handler: MessageHandler): Promise<void>;
  cancelConsumer?(queue: string): Promise<void>;

  // 连接信息
  getConnectionInfo?(): ConnectionInfo;

  // 适配器信息
  getAdapterType(): MessagingAdapterType;
  getAdapterInfo(): AdapterInfo;
}

/**
 * 重试策略接口
 */
export interface IRetryStrategy {
  // 重试配置
  getMaxRetries(): number;
  getRetryDelay(attempt: number): number;
  getBackoffStrategy(): BackoffStrategy;

  // 重试逻辑
  shouldRetry(error: Error, attempt: number): boolean;
  calculateRetryDelay(attempt: number): number;
  getRetryQueueName(originalQueue: string, attempt: number): Promise<string>;

  // 重试管理
  scheduleRetry(message: Message, attempt: number): Promise<void>;
  handleMaxRetriesReached(message: Message, error: Error): Promise<void>;
}

/**
 * 死信队列接口
 */
export interface IDeadLetterQueue {
  // 死信队列操作
  sendToDeadLetter(message: Message, error: Error): Promise<void>;
  processDeadLetterMessages(handler: DeadLetterHandler): Promise<void>;
  retryDeadLetterMessage(messageId: string): Promise<void>;
  deleteDeadLetterMessage(messageId: string): Promise<void>;

  // 死信队列管理
  getDeadLetterMessages(limit?: number): Promise<DeadLetterMessage[]>;
  getDeadLetterStats(): Promise<DeadLetterStats>;
  purgeDeadLetterQueue(): Promise<void>;
}

/**
 * 消息队列监控接口
 */
export interface IMessagingMonitor {
  // 连接监控
  getConnectionStats(): Promise<ConnectionStats>;
  getAdapterStats(adapterType: MessagingAdapterType): Promise<AdapterStats>;

  // 消息监控
  getMessageStats(): Promise<MessageStats>;
  getQueueStats(queueName: string): Promise<QueueStats>;
  getTopicStats(topicName: string): Promise<TopicStats>;

  // 性能监控
  getThroughputStats(): Promise<ThroughputStats>;
  getLatencyStats(): Promise<LatencyStats>;
  getErrorStats(): Promise<ErrorStats>;

  // 租户监控 - 使用multi-tenancy服务
  getTenantStats(tenantId: string): Promise<TenantMessagingStats>;
  getAllTenantStats(): Promise<Map<string, TenantMessagingStats>>;

  // 健康检查
  healthCheck(): Promise<HealthStatus>;
  adapterHealthCheck(adapterType: MessagingAdapterType): Promise<HealthStatus>;
}

/**
 * 死信统计接口
 */
export interface DeadLetterStats {
  /** 死信消息总数 */
  totalDeadLetterMessages: number;
  /** 死信消息处理数量 */
  processedDeadLetterMessages: number;
  /** 死信消息重试数量 */
  retriedDeadLetterMessages: number;
  /** 死信消息删除数量 */
  deletedDeadLetterMessages: number;
  /** 死信消息队列长度 */
  queueLength: number;
  /** 死信消息平均处理时间（毫秒） */
  averageProcessingTime: number;
}

