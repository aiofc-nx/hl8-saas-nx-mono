import { DynamicModule, Module } from '@nestjs/common';
import {
  MultiTenancyModule,
  TenantContextService,
  TenantIsolationService,
} from '@hl8/multi-tenancy';
import { ExceptionModule } from '@hl8/common';
import { CacheModule } from '@hl8/cache';
// 移除ConfigService导入，使用直接注入配置类的方式
import {
  MessagingModuleOptions,
  MessagingAdapterType,
  MESSAGING_MODULE_OPTIONS,
} from './types/messaging.types';
import { MessagingService } from './messaging.service';
import { EventService } from './event.service';
import { TaskService } from './task.service';
import { MessageDeduplicationService } from './services/message-deduplication.service';
import { ConsumerStateService } from './services/consumer-state.service';
import { DeadLetterCacheService } from './services/dead-letter-cache.service';
import { TenantConfigCacheService } from './services/tenant-config-cache.service';
import { AdvancedMonitoringCacheService } from './services/advanced-monitoring-cache.service';
import { CacheMonitoringService } from './services/cache-monitoring.service';
import { RabbitMQAdapter } from './adapters/rabbitmq.adapter';
import { RedisAdapter } from './adapters/redis.adapter';
import { KafkaAdapter } from './adapters/kafka.adapter';
import { MemoryAdapter } from './adapters/memory.adapter';
import { MessagingMonitor } from './monitoring/messaging-monitor.service';
import { MessagingStatsService } from './monitoring/messaging-stats.service';
import { HealthCheckService } from './monitoring/health-check.service';

/**
 * 消息队列模块
 *
 * 集成@hl8/multi-tenancy的企业级多租户消息队列解决方案，支持多种消息队列。
 *
 * @description 此模块为SAAS平台提供统一、可靠、安全的消息传递服务。
 * 支持多租户隔离、消息持久化、重试机制、监控统计等企业级功能。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 模块功能规则
 * - 支持多种消息队列适配器（RabbitMQ、Redis、Kafka、Memory）
 * - 支持多租户隔离和上下文管理
 * - 支持消息持久化和重试机制
 * - 支持事件驱动和异步任务处理
 *
 * ### 多租户规则
 * - 支持租户级别的消息隔离
 * - 支持租户级别的配置管理
 * - 支持租户级别的监控统计
 * - 支持租户级别的缓存管理
 *
 * ### 缓存集成规则
 * - 支持消息去重和状态管理
 * - 支持死信队列缓存
 * - 支持租户配置缓存
 * - 支持高级监控缓存
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     MessagingModule.forRoot({
 *       adapter: MessagingAdapterType.RABBITMQ,
 *       rabbitmq: {
 *         url: 'amqp://localhost:5672',
 *         exchange: 'hl8_saas',
 *         queuePrefix: 'hl8_',
 *       },
 *       multiTenancy: {
 *         context: {
 *           enableAutoInjection: true,
 *           contextTimeout: 30000,
 *         },
 *         isolation: {
 *           strategy: 'key-prefix',
 *           keyPrefix: 'hl8:messaging:',
 *           enableIsolation: true,
 *         }
 *       }
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class MessagingModule {
  /**
   * 配置消息队列模块
   *
   * @description 创建配置好的消息队列模块实例
   * 集成@hl8/multi-tenancy多租户基础设施
   * 支持多种消息队列适配器
   *
   * @param options 模块配置选项
   * @returns 动态模块配置
   */
  static forRoot(options: MessagingModuleOptions): DynamicModule {
    return {
      module: MessagingModule,
      imports: [
        // 集成异常处理模块
        ExceptionModule.forRoot({
          documentationUrl:
            options.documentationUrl || 'https://docs.hl8.com/messaging/errors',
          logLevel: 'error',
          enableStackTrace: true,
          // 移除不支持的配置属性
        }),
        // 集成缓存模块
        CacheModule.forRoot({
          redis: options.cache?.redis || {
            host: 'localhost',
            port: 6379,
            db: 1, // 使用不同的数据库避免冲突
          },
          keyPrefix: options.cache?.keyPrefix || 'hl8:messaging:cache:',
          enableTenantIsolation: options.enableTenantIsolation !== false,
          defaultTTL: 3600,
          multiTenancy: options.multiTenancy
            ? {
                context: options.multiTenancy.context,
                isolation: {
                  ...options.multiTenancy.isolation,
                  keyPrefix: options.cache?.keyPrefix || 'hl8:messaging:cache:',
                },
                middleware: options.multiTenancy.middleware,
                security: options.multiTenancy.security,
              }
            : undefined,
        }),
        // 集成 multi-tenancy 模块
        MultiTenancyModule.forRoot(
          options.multiTenancy || {
            context: {
              enableAutoInjection: true,
              contextTimeout: 30000,
              enableAuditLog: true,
              contextStorage: 'memory',
              allowCrossTenantAccess: false,
            },
            isolation: {
              strategy: 'key-prefix',
              keyPrefix: options.keyPrefix || 'hl8:messaging:',
              namespace: 'messaging-namespace',
              enableIsolation: options.enableTenantIsolation !== false,
              level: 'strict',
            },
            middleware: {
              enableTenantMiddleware: true,
              tenantHeader: 'X-Tenant-ID',
              tenantQueryParam: 'tenant',
              tenantSubdomain: true,
              validationTimeout: 5000,
              strictValidation: true,
            },
            security: {
              enableSecurityCheck: true,
              maxFailedAttempts: 5,
              lockoutDuration: 300000,
              enableAuditLog: true,
              enableIpWhitelist: false,
            },
          }
        ),
      ],
      providers: [
        {
          provide: MESSAGING_MODULE_OPTIONS,
          useValue: options,
        },
        MessagingService,
        EventService,
        TaskService,
        // 根据配置的适配器类型提供相应的适配器
        ...this.createAdapters(options),
        MessagingMonitor,
        MessagingStatsService,
        HealthCheckService,
      ],
      exports: [
        MessagingService,
        EventService,
        TaskService,
        TenantContextService,
        TenantIsolationService,
        MessagingMonitor,
        MessagingStatsService,
        HealthCheckService,
      ],
    };
  }

  /**
   * 异步配置消息队列模块
   *
   * @description 支持异步配置的消息队列模块
   * 适用于需要动态配置的场景
   *
   * @param options 异步模块配置选项
   * @returns 动态模块配置
   */
  static forRootAsync(options: {
    useFactory: (
      ...args: unknown[]
    ) => Promise<MessagingModuleOptions> | MessagingModuleOptions;
    inject?: any[];
    imports?: any[];
  }): DynamicModule {
    return {
      module: MessagingModule,
      imports: [
        MultiTenancyModule.forRootAsync({
          useFactory: async (...args: unknown[]) => {
            const messagingOptions = await options.useFactory(...args);
            return (
              messagingOptions.multiTenancy || {
                context: {
                  enableAutoInjection: true,
                  contextTimeout: 30000,
                  enableAuditLog: true,
                  contextStorage: 'memory',
                  allowCrossTenantAccess: false,
                },
                isolation: {
                  strategy: 'key-prefix',
                  keyPrefix: messagingOptions.keyPrefix || 'hl8:messaging:',
                  namespace: 'messaging-namespace',
                  enableIsolation:
                    messagingOptions.enableTenantIsolation !== false,
                  level: 'strict',
                },
                middleware: {
                  enableTenantMiddleware: true,
                  tenantHeader: 'X-Tenant-ID',
                  tenantQueryParam: 'tenant',
                  tenantSubdomain: true,
                  validationTimeout: 5000,
                  strictValidation: true,
                },
                security: {
                  enableSecurityCheck: true,
                  maxFailedAttempts: 5,
                  lockoutDuration: 300000,
                  enableAuditLog: true,
                  enableIpWhitelist: false,
                },
              }
            );
          },
          inject: options.inject,
        }),
        ...(options.imports || []),
      ],
      providers: [
        {
          provide: MESSAGING_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        MessagingService,
        EventService,
        TaskService,
        // 异步创建适配器
        {
          provide: 'MESSAGING_ADAPTERS',
          useFactory: async (...args: unknown[]) => {
            const messagingOptions = await options.useFactory(...args);
            return this.createAdapters(messagingOptions);
          },
          inject: options.inject,
        },
        MessagingMonitor,
        MessagingStatsService,
        HealthCheckService,
        MessageDeduplicationService,
        ConsumerStateService,
        DeadLetterCacheService,
        TenantConfigCacheService,
        AdvancedMonitoringCacheService,
        CacheMonitoringService,
      ],
      exports: [
        MessagingService,
        EventService,
        TaskService,
        TenantContextService,
        TenantIsolationService,
        MessagingMonitor,
        MessagingStatsService,
        HealthCheckService,
        MessageDeduplicationService,
        ConsumerStateService,
        DeadLetterCacheService,
        TenantConfigCacheService,
        AdvancedMonitoringCacheService,
        CacheMonitoringService,
      ],
    };
  }

  /**
   * 创建消息队列适配器
   *
   * @description 根据配置选项创建相应的消息队列适配器
   * 支持RabbitMQ、Redis、Kafka、Memory等多种适配器
   *
   * @param options 模块配置选项
   * @returns 适配器提供者数组
   */
  private static createAdapters(options: MessagingModuleOptions): any[] {
    const adapters: any[] = [];

    // 根据配置的适配器类型创建相应的适配器
    switch (options.adapter) {
      case MessagingAdapterType.RABBITMQ:
        if (!options.rabbitmq) {
          throw new Error(
            'RabbitMQ configuration is required when using RabbitMQ adapter'
          );
        }
        adapters.push({
          provide: 'MESSAGING_ADAPTER',
          useFactory: () => {
            if (!options.rabbitmq) {
              throw new Error('RabbitMQ configuration is missing');
            }
            return new RabbitMQAdapter(options.rabbitmq);
          },
        });
        break;

      case MessagingAdapterType.REDIS:
        if (!options.redis) {
          throw new Error(
            'Redis configuration is required when using Redis adapter'
          );
        }
        adapters.push({
          provide: 'MESSAGING_ADAPTER',
          useFactory: () => {
            if (!options.redis) {
              throw new Error('Redis configuration is missing');
            }
            return new RedisAdapter(options.redis);
          },
        });
        break;

      case MessagingAdapterType.KAFKA:
        if (!options.kafka) {
          throw new Error(
            'Kafka configuration is required when using Kafka adapter'
          );
        }
        adapters.push({
          provide: 'MESSAGING_ADAPTER',
          useFactory: () => {
            if (!options.kafka) {
              throw new Error('Kafka configuration is missing');
            }
            return new KafkaAdapter(options.kafka);
          },
        });
        break;

      case MessagingAdapterType.MEMORY:
        adapters.push({
          provide: 'MESSAGING_ADAPTER',
          useFactory: () => {
            return new MemoryAdapter();
          },
        });
        break;

      default:
        throw new Error(`Unsupported messaging adapter: ${options.adapter}`);
    }

    // 始终提供内存适配器作为备用
    adapters.push({
      provide: 'MEMORY_ADAPTER',
      useFactory: () => {
        return new MemoryAdapter();
      },
    });

    return adapters;
  }

  /**
   * 使用配置模块创建消息队列模块
   *
   * @description 从配置模块加载消息队列配置，支持类型安全的配置管理
   *
   * @param config 配置对象
   * @returns 动态模块
   */
  static forRootWithConfig(config: MessagingModuleOptions): DynamicModule {
    const options = config;

    return {
      module: MessagingModule,
      imports: [
        // 集成异常处理模块
        ExceptionModule.forRoot({
          documentationUrl:
            options.documentationUrl || 'https://docs.hl8.com/messaging/errors',
          logLevel: 'error',
          enableStackTrace: true,
          // 移除不支持的配置属性
        }),
        // 集成缓存模块
        CacheModule.forRoot({
          redis: options.cache?.redis || {
            host: 'localhost',
            port: 6379,
            db: 1, // 使用不同的数据库避免冲突
          },
          keyPrefix: options.cache?.keyPrefix || 'hl8:messaging:cache:',
          enableTenantIsolation: options.enableTenantIsolation !== false,
          defaultTTL: 3600,
          multiTenancy: options.multiTenancy
            ? {
                context: options.multiTenancy.context,
                isolation: {
                  ...options.multiTenancy.isolation,
                  keyPrefix: options.cache?.keyPrefix || 'hl8:messaging:cache:',
                },
                middleware: options.multiTenancy.middleware,
                security: options.multiTenancy.security,
              }
            : undefined,
        }),
        // 集成 multi-tenancy 模块
        MultiTenancyModule.forRoot(
          options.multiTenancy || {
            context: {
              enableAutoInjection: true,
              contextTimeout: 30000,
              enableAuditLog: true,
              contextStorage: 'memory',
              allowCrossTenantAccess: false,
            },
            isolation: {
              strategy: 'key-prefix',
              keyPrefix: options.keyPrefix || 'hl8:messaging:',
              namespace: 'messaging-namespace',
              enableIsolation: options.enableTenantIsolation !== false,
              level: 'strict',
            },
            middleware: {
              enableTenantMiddleware: true,
              tenantHeader: 'X-Tenant-ID',
              tenantQueryParam: 'tenant',
              tenantSubdomain: true,
              validationTimeout: 5000,
              strictValidation: true,
            },
            security: {
              enableSecurityCheck: true,
              maxFailedAttempts: 5,
              lockoutDuration: 300000,
              enableAuditLog: true,
              enableIpWhitelist: false,
            },
          }
        ),
      ],
      providers: [
        {
          provide: MESSAGING_MODULE_OPTIONS,
          useValue: options,
        },
        {
          provide: 'MESSAGING_ADAPTERS',
          useFactory: () => {
            return this.createAdapters(options);
          },
        },
        MessagingService,
        EventService,
        TaskService,
        TenantContextService,
        TenantIsolationService,
        MessagingMonitor,
        MessagingStatsService,
        HealthCheckService,
        MessageDeduplicationService,
        ConsumerStateService,
        DeadLetterCacheService,
        TenantConfigCacheService,
        AdvancedMonitoringCacheService,
        CacheMonitoringService,
      ],
      exports: [
        MessagingService,
        EventService,
        TaskService,
        TenantContextService,
        TenantIsolationService,
        MessagingMonitor,
        MessagingStatsService,
        HealthCheckService,
        MessageDeduplicationService,
        ConsumerStateService,
        DeadLetterCacheService,
        TenantConfigCacheService,
        AdvancedMonitoringCacheService,
        CacheMonitoringService,
      ],
    };
  }
}
