import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsArray,
  IsObject,
} from 'class-validator';

/**
 * 消息队列适配器类型枚举
 */
export enum MessagingAdapterType {
  RABBITMQ = 'rabbitmq',
  REDIS = 'redis',
  KAFKA = 'kafka',
  MEMORY = 'memory',
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
 * RabbitMQ配置类
 *
 * RabbitMQ消息队列的连接和配置选项，支持完整的消息队列配置。
 *
 * @description 此配置类提供RabbitMQ消息队列的连接和配置选项。
 * 支持连接URL、交换机、队列前缀、重试配置等完整功能。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 连接配置规则
 * - 支持连接URL配置
 * - 支持交换机配置
 * - 支持队列前缀配置
 * - 支持连接池配置
 *
 * ### 重试配置规则
 * - 支持重试次数配置
 * - 支持重试间隔配置
 * - 支持退避策略配置
 * - 支持重试超时配置
 *
 * ### 性能配置规则
 * - 支持连接池大小配置
 * - 支持心跳间隔配置
 * - 支持超时配置
 * - 支持并发配置
 *
 * @example
 * ```typescript
 * // 创建RabbitMQ配置
 * const config = new RabbitMQConfig();
 * config.url = 'amqp://localhost:5672';
 * config.exchange = 'hl8_saas';
 * config.queuePrefix = 'hl8_';
 * ```
 */
export class RabbitMQConfig {
  @IsString()
  url!: string;

  @IsOptional()
  @IsString()
  exchange?: string;

  @IsOptional()
  @IsString()
  queuePrefix?: string;

  @IsOptional()
  @IsNumber()
  heartbeat?: number;

  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;
}

/**
 * Redis配置类
 *
 * @description Redis Streams和Pub/Sub的配置选项
 */
export class RedisConfig {
  @IsString()
  host!: string;

  @IsNumber()
  port!: number;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsNumber()
  db?: number;

  @IsString()
  streamPrefix!: string;

  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;
}

/**
 * Kafka配置类
 *
 * @description Apache Kafka的配置选项
 */
export class KafkaConfig {
  @IsString()
  clientId!: string;

  @IsArray()
  @IsString({ each: true })
  brokers!: string[];

  @IsString()
  topicPrefix!: string;

  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;
}

/**
 * 重试配置类
 *
 * @description 消息重试机制的配置选项
 */
export class RetryConfig {
  @IsNumber()
  maxRetries!: number;

  @IsNumber()
  retryDelay!: number;

  @IsEnum(BackoffStrategy)
  backoff!: BackoffStrategy;

  @IsBoolean()
  enableDeadLetterQueue!: boolean;
}

/**
 * 监控配置类
 *
 * @description 消息队列监控和统计的配置选项
 */
export class MonitoringConfig {
  @IsBoolean()
  enableStats!: boolean;

  @IsBoolean()
  enableHealthCheck!: boolean;

  @IsNumber()
  statsInterval!: number;
}

/**
 * 缓存TTL配置类
 *
 * @description 各种缓存功能的TTL配置
 */
export class CacheTTLConfig {
  @IsOptional()
  @IsNumber()
  messageDedup?: number;

  @IsOptional()
  @IsNumber()
  consumerState?: number;

  @IsOptional()
  @IsNumber()
  stats?: number;

  @IsOptional()
  @IsNumber()
  deadLetter?: number;

  @IsOptional()
  @IsNumber()
  tenantConfig?: number;
}

/**
 * Redis缓存配置类
 *
 * @description 缓存模块的Redis配置
 */
export class CacheRedisConfig {
  @IsString()
  host!: string;

  @IsNumber()
  port!: number;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsNumber()
  db?: number;
}

/**
 * 消息队列缓存配置类
 *
 * @description 消息队列模块的缓存配置选项
 */
export class MessagingCacheConfig {
  @IsOptional()
  @IsBoolean()
  enableMessageDeduplication?: boolean;

  @IsOptional()
  @IsBoolean()
  enableConsumerStateCache?: boolean;

  @IsOptional()
  @IsBoolean()
  enableStatsCache?: boolean;

  @IsOptional()
  @IsBoolean()
  enableDeadLetterCache?: boolean;

  @IsOptional()
  @IsBoolean()
  enableTenantConfigCache?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => CacheTTLConfig)
  cacheTTL?: CacheTTLConfig;

  @IsOptional()
  @IsString()
  keyPrefix?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CacheRedisConfig)
  redis?: CacheRedisConfig;
}

/**
 * 租户消息配置类
 *
 * @description 租户级别的消息配置选项（向后兼容）
 */
export class TenantMessagingConfig {
  @IsBoolean()
  enableIsolation!: boolean;

  @IsString()
  tenantPrefix!: string;

  @IsBoolean()
  autoCreateTenantQueues!: boolean;

  @IsNumber()
  tenantQueueLimit!: number;
}

/**
 * 多租户上下文配置类
 *
 * @description 多租户上下文管理的配置选项
 */
export class MultiTenancyContextConfig {
  @IsBoolean()
  enableAutoInjection!: boolean;

  @IsNumber()
  contextTimeout!: number;

  @IsBoolean()
  enableAuditLog!: boolean;

  @IsString()
  contextStorage!: string;

  @IsBoolean()
  allowCrossTenantAccess!: boolean;
}

/**
 * 多租户隔离配置类
 *
 * @description 多租户数据隔离的配置选项
 */
export class MultiTenancyIsolationConfig {
  @IsString()
  strategy!: string;

  @IsString()
  keyPrefix!: string;

  @IsString()
  namespace!: string;

  @IsBoolean()
  enableIsolation!: boolean;

  @IsString()
  level!: string;
}

/**
 * 多租户中间件配置类
 *
 * @description 多租户中间件的配置选项
 */
export class MultiTenancyMiddlewareConfig {
  @IsBoolean()
  enableTenantMiddleware!: boolean;

  @IsString()
  tenantHeader!: string;

  @IsString()
  tenantQueryParam!: string;

  @IsBoolean()
  tenantSubdomain!: boolean;

  @IsNumber()
  validationTimeout!: number;

  @IsBoolean()
  strictValidation!: boolean;
}

/**
 * 多租户安全配置类
 *
 * @description 多租户安全机制的配置选项
 */
export class MultiTenancySecurityConfig {
  @IsBoolean()
  enableSecurityCheck!: boolean;

  @IsNumber()
  maxFailedAttempts!: number;

  @IsNumber()
  lockoutDuration!: number;

  @IsBoolean()
  enableAuditLog!: boolean;

  @IsBoolean()
  enableIpWhitelist!: boolean;
}

/**
 * 多租户配置类
 *
 * @description 多租户模块的完整配置选项
 */
export class MultiTenancyConfig {
  @IsOptional()
  @ValidateNested()
  @Type(() => MultiTenancyContextConfig)
  context?: MultiTenancyContextConfig;

  @IsOptional()
  @ValidateNested()
  @Type(() => MultiTenancyIsolationConfig)
  isolation?: MultiTenancyIsolationConfig;

  @IsOptional()
  @ValidateNested()
  @Type(() => MultiTenancyMiddlewareConfig)
  middleware?: MultiTenancyMiddlewareConfig;

  @IsOptional()
  @ValidateNested()
  @Type(() => MultiTenancySecurityConfig)
  security?: MultiTenancySecurityConfig;
}

/**
 * 消息队列根配置类
 *
 * @description 消息队列模块的完整配置选项，支持类型安全和配置验证
 */
export class MessagingConfig {
  @IsEnum(MessagingAdapterType)
  adapter!: MessagingAdapterType;

  @IsOptional()
  @ValidateNested()
  @Type(() => RabbitMQConfig)
  rabbitmq?: RabbitMQConfig;

  @IsOptional()
  @ValidateNested()
  @Type(() => RedisConfig)
  redis?: RedisConfig;

  @IsOptional()
  @ValidateNested()
  @Type(() => KafkaConfig)
  kafka?: KafkaConfig;

  @IsOptional()
  @ValidateNested()
  @Type(() => MultiTenancyConfig)
  multiTenancy?: MultiTenancyConfig;

  @IsOptional()
  @ValidateNested()
  @Type(() => RetryConfig)
  retry?: RetryConfig;

  @IsOptional()
  @ValidateNested()
  @Type(() => MonitoringConfig)
  monitoring?: MonitoringConfig;

  @IsOptional()
  @ValidateNested()
  @Type(() => TenantMessagingConfig)
  tenant?: TenantMessagingConfig;

  @IsOptional()
  @IsBoolean()
  enableTenantIsolation?: boolean;

  @IsOptional()
  @IsString()
  keyPrefix?: string;

  @IsOptional()
  @IsString()
  documentationUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MessagingCacheConfig)
  cache?: MessagingCacheConfig;
}
