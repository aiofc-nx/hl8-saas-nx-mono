/**
 * 缓存模块类型定义
 *
 * @description 定义缓存模块的核心类型和接口
 * 基于Redis和nestjs-cls实现高性能、多租户的缓存解决方案
 *
 * @since 1.0.0
 */

import { IMultiTenancyModuleOptions } from '@hl8/multi-tenancy';

/**
 * 缓存服务接口
 *
 * @description 定义缓存服务的核心功能接口
 */
export interface ICacheService {
  // 基础操作 - 自动处理租户上下文
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;

  // 批量操作
  mget<T>(keys: string[]): Promise<(T | null)[]>;
  mset<T>(pairs: Array<{ key: string; value: T; ttl?: number }>): Promise<void>;
  mdelete(keys: string[]): Promise<void>;

  // 高级操作
  expire(key: string, ttl: number): Promise<void>;
  ttl(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  flush(): Promise<void>;

  // 租户上下文操作
  getCurrentTenant(): string | null;
  hasTenantContext(): boolean;
}

/**
 * 缓存策略接口
 *
 * @description 定义缓存策略的核心功能
 */
export interface ICacheStrategy {
  shouldCache(key: string, value: any): boolean;
  getTTL(key: string): number;
  onHit(key: string): void;
  onMiss(key: string): void;
  onEvict(key: string): void;
}

/**
 * 上下文管理接口
 *
 * @description 定义上下文管理的核心功能
 */
export interface IContextManager {
  setTenant(tenantId: string): void;
  getTenant(): string | null;
  setUser(userId: string): void;
  getUser(): string | null;
  setRequestId(requestId: string): void;
  getRequestId(): string | null;
  clear(): void;
}

/**
 * 租户隔离接口
 *
 * @description 定义租户隔离的核心功能
 */
export interface ITenantIsolation {
  getTenantKey(key: string): string;
  clearTenantCache(): Promise<void>;
  getTenantStats(): Promise<TenantCacheStats>;
  listTenantKeys(): Promise<string[]>;
}

/**
 * 缓存配置接口
 */
export interface CacheModuleOptions {
  redis: RedisConfig;
  defaultTTL?: number;
  keyPrefix?: string;
  enableTenantIsolation?: boolean; // 保留用于向后兼容
  strategy?: CacheStrategyConfig;
  monitoring?: MonitoringConfig;
  cls?: ClsConfig;
  multiTenancy?: IMultiTenancyModuleOptions; // 新增多租户配置
}

/**
 * Redis配置接口
 */
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
}

/**
 * 缓存策略配置接口
 */
export interface CacheStrategyConfig {
  type: 'ttl' | 'lru' | 'lfu' | 'custom';
  options?: any;
}

/**
 * 监控配置接口
 */
export interface MonitoringConfig {
  enableStats?: boolean;
  enableHealthCheck?: boolean;
  statsInterval?: number;
}

/**
 * CLS配置接口
 */
export interface ClsConfig {
  global?: boolean;
  middleware?: {
    mount?: boolean;
    generateId?: boolean;
  };
  interceptor?: {
    mount?: boolean;
  };
}

/**
 * 缓存统计接口
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: number;
  tenantStats: Map<string, TenantCacheStats>;
}

/**
 * 租户缓存统计接口
 */
export interface TenantCacheStats {
  tenantId: string;
  hits: number;
  misses: number;
  hitRate: number;
  keyCount: number;
  memoryUsage: number;
  lastAccessed: Date;
}

/**
 * 健康检查接口
 */
export interface CacheHealthCheck {
  isHealthy: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  latency: number;
  errorCount: number;
  lastError?: string;
  tenantContextAvailable: boolean;
}

/**
 * 发布选项接口
 */
export interface PublishOptions {
  adapter?: MessagingAdapterType;
  persistent?: boolean;
  messageId?: string;
  correlationId?: string;
  replyTo?: string;
}

/**
 * 发送选项接口
 */
export interface SendOptions {
  adapter?: MessagingAdapterType;
  priority?: number;
  delay?: number;
}

/**
 * 消息队列适配器类型
 */
export enum MessagingAdapterType {
  RABBITMQ = 'rabbitmq',
  REDIS = 'redis',
  KAFKA = 'kafka',
  MEMORY = 'memory',
}

/**
 * 连接信息接口
 */
export interface ConnectionInfo {
  host: string;
  port: number;
  db: number;
  status: 'connected' | 'disconnected' | 'reconnecting';
  latency: number;
  lastConnected: Date;
}

/**
 * 队列信息接口
 */
export interface QueueInfo {
  name: string;
  length: number;
  consumers: number;
  messagesPerSecond: number;
  memoryUsage: number;
}

/**
 * 消息处理器类型
 */
export type MessageHandler<T = any> = (message: T) => Promise<void> | void;

/**
 * 事件处理器类型
 */
export type EventHandler<T = any> = (event: T) => Promise<void> | void;

/**
 * 任务处理器类型
 */
export type TaskHandler<T = any> = (task: T) => Promise<void> | void;

/**
 * 事件选项接口
 */
export interface EventOptions {
  persistent?: boolean;
  priority?: number;
}

/**
 * 任务选项接口
 */
export interface TaskOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: BackoffOptions;
}

/**
 * 退避选项接口
 */
export interface BackoffOptions {
  type: 'fixed' | 'exponential';
  delay: number;
  maxDelay?: number;
}

/**
 * 缓存装饰器选项接口
 */
export interface CacheableOptions {
  condition?: (result: any) => boolean;
  unless?: (result: any) => boolean;
  tenantAware?: boolean;
  keyGenerator?: (args: any[]) => string;
}

/**
 * 缓存键生成器类型
 */
export type CacheKeyGenerator = (args: any[]) => string;

/**
 * 序列化器类型
 */
export type Serializer<T = any> = {
  serialize(value: T): string;
  deserialize(value: string): T;
};

/**
 * 连接池统计接口
 */
export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  maxConnections: number;
}

/**
 * 租户消息队列配置接口
 */
export interface TenantMessagingConfig {
  enableIsolation: boolean;
  tenantPrefix: string;
  autoCreateTenantQueues: boolean;
  tenantQueueLimit: number;
}

/**
 * 重试配置接口
 */
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoff: 'linear' | 'exponential';
  enableDeadLetterQueue: boolean;
}

/**
 * 连接池配置接口
 */
export interface ConnectionPoolConfig {
  postgres: {
    min: number;
    max: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
    acquireTimeoutMillis: number;
  };
  redis: {
    minPoolSize: number;
    maxPoolSize: number;
    maxIdleTimeMS: number;
    connectTimeoutMS: number;
    serverSelectionTimeoutMS: number;
  };
  tenant: {
    maxTenants: number;
    tenantConnectionLimit: number;
    tenantIdleTimeout: number;
  };
}

/**
 * 多租户消息服务接口
 */
export interface ITenantMessagingService extends ICacheService {
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
    handler?: MessageHandler<any>
  ): Promise<void>;
  getTenantQueues(tenantId: string): Promise<string[]>;
  clearTenantMessages(tenantId: string): Promise<void>;
  getTenantStats(tenantId: string): Promise<TenantCacheStats>;
}

/**
 * 租户隔离策略接口
 */
export interface ITenantIsolationStrategy {
  getTenantNamespace(tenantId: string): string;
  getTenantQueueName(tenantId: string, queueName: string): string;
  getTenantTopicName(tenantId: string, topicName: string): string;
  shouldIsolateTenant(tenantId: string): boolean;
  getTenantRoutingKey(tenantId: string, routingKey: string): string;
  getTenantConfig(tenantId: string): TenantMessagingConfig;
  createTenantConfig(tenantId: string): TenantMessagingConfig;
  updateTenantConfig(
    tenantId: string,
    config: TenantMessagingConfig
  ): Promise<void>;
}

/**
 * 消息队列监控接口
 */
export interface IMessagingMonitor {
  getConnectionStats(): Promise<ConnectionStats>;
  getAdapterStats(adapterType: MessagingAdapterType): Promise<AdapterStats>;
  getMessageStats(): Promise<MessageStats>;
  getQueueStats(queueName: string): Promise<QueueStats>;
  getTopicStats(topicName: string): Promise<TopicStats>;
  getThroughputStats(): Promise<ThroughputStats>;
  getLatencyStats(): Promise<LatencyStats>;
  getErrorStats(): Promise<ErrorStats>;
  getTenantStats(tenantId: string): Promise<TenantCacheStats>;
  getAllTenantStats(): Promise<Map<string, TenantCacheStats>>;
  healthCheck(): Promise<HealthStatus>;
  adapterHealthCheck(adapterType: MessagingAdapterType): Promise<HealthStatus>;
}

/**
 * 连接统计接口
 */
export interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  failedConnections: number;
  reconnectionAttempts: number;
  lastReconnection: Date;
}

/**
 * 适配器统计接口
 */
export interface AdapterStats {
  type: MessagingAdapterType;
  isConnected: boolean;
  connectionCount: number;
  messageCount: number;
  errorCount: number;
  uptime: number;
}

/**
 * 消息统计接口
 */
export interface MessageStats {
  totalMessages: number;
  publishedMessages: number;
  consumedMessages: number;
  failedMessages: number;
  retriedMessages: number;
  averageMessageSize: number;
}

/**
 * 队列统计接口
 */
export interface QueueStats {
  name: string;
  messageCount: number;
  consumerCount: number;
  processingRate: number;
  errorRate: number;
  averageProcessingTime: number;
}

/**
 * 主题统计接口
 */
export interface TopicStats {
  name: string;
  messageCount: number;
  subscriberCount: number;
  publishingRate: number;
  subscriptionRate: number;
}

/**
 * 吞吐量统计接口
 */
export interface ThroughputStats {
  messagesPerSecond: number;
  bytesPerSecond: number;
  peakThroughput: number;
  averageThroughput: number;
}

/**
 * 延迟统计接口
 */
export interface LatencyStats {
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  percentile95: number;
  percentile99: number;
}

/**
 * 错误统计接口
 */
export interface ErrorStats {
  totalErrors: number;
  errorRate: number;
  errorTypes: Map<string, number>;
  lastError: Date;
  errorTrend: number[];
}

/**
 * 健康状态接口
 */
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  checks: Map<string, HealthCheck>;
  summary: string;
}

/**
 * 健康检查接口
 */
export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  duration: number;
  timestamp: Date;
}

/**
 * 消息队列统计接口
 */
export interface MessagingStats {
  totalConnections: number;
  activeConnections: number;
  failedConnections: number;
  adapterStats: Map<MessagingAdapterType, AdapterStats>;
  totalMessages: number;
  publishedMessages: number;
  consumedMessages: number;
  failedMessages: number;
  retriedMessages: number;
  totalQueues: number;
  activeQueues: number;
  queueStats: Map<string, QueueStats>;
  totalTenants: number;
  activeTenants: number;
  tenantStats: Map<string, TenantCacheStats>;
  averageLatency: number;
  throughput: number;
  errorRate: number;
}

/**
 * 缓存模块选项令牌
 */
export const CACHE_MODULE_OPTIONS = 'CACHE_MODULE_OPTIONS';
