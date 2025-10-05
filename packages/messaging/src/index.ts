/**
 * HL8 SAAS平台消息队列模块
 *
 * 企业级多租户消息队列解决方案，支持多种消息队列和完整的事件驱动能力。
 *
 * @description 此模块提供企业级多租户消息队列解决方案。
 * 支持RabbitMQ、Redis Streams、Apache Kafka等多种消息队列。
 * 提供完整的事件驱动和异步任务处理能力，专为SAAS平台设计。
 *
 * ## 业务规则
 *
 * ### 模块导出规则
 * - 所有公共API必须通过此文件导出
 * - 导出内容按功能分类组织
 * - 支持按需导入和全量导入
 * - 保持API的向后兼容性
 *
 * ### 功能分类规则
 * - 核心模块：消息队列核心功能
 * - 配置模块：消息队列配置管理
 * - 核心服务：事件服务、任务服务等
 * - 缓存服务：消息去重、状态管理等
 * - 适配器：多种消息队列适配器
 * - 装饰器：事件处理器、任务处理器等
 * - 监控服务：性能监控、健康检查等
 * - 异常处理：消息队列异常处理
 * - 多租户服务：租户上下文和隔离
 * - 类型定义：消息队列类型定义
 * - 使用示例：集成示例和性能测试
 *
 * @example
 * ```typescript
 * // 导入核心服务
 * import { MessagingService, EventService, TaskService } from '@hl8/messaging';
 *
 * // 导入适配器
 * import { RabbitMQAdapter, RedisAdapter, KafkaAdapter } from '@hl8/messaging';
 *
 * // 导入装饰器
 * import { EventHandler, TaskHandler } from '@hl8/messaging';
 * ```
 */

// 核心模块导出
export * from './lib/messaging.module';

// 配置模块导出
export * from './lib/config/messaging.config';
export * from './lib/config/messaging-config.module';

// 常量定义导出
export * from './lib/constants';

// 核心服务导出
export * from './lib/messaging.service';
export * from './lib/event.service';
export * from './lib/task.service';

// 缓存服务导出
export * from './lib/services/message-deduplication.service';
export * from './lib/services/consumer-state.service';
export * from './lib/services/dead-letter-cache.service';
export * from './lib/services/tenant-config-cache.service';
export * from './lib/services/advanced-monitoring-cache.service';
export * from './lib/services/cache-monitoring.service';

// 适配器导出
export * from './lib/adapters/base.adapter';
export * from './lib/adapters/memory.adapter';
export * from './lib/adapters/rabbitmq.adapter';
export * from './lib/adapters/redis.adapter';
export * from './lib/adapters/kafka.adapter';

// 装饰器导出
export { EventHandler as EventHandlerDecorator } from './lib/decorators/event-handler.decorator';
export { TaskHandler as TaskHandlerDecorator } from './lib/decorators/task-handler.decorator';
export { MessageHandler as MessageHandlerDecorator } from './lib/decorators/message-handler.decorator';

// 监控服务导出
export * from './lib/monitoring/messaging-monitor.service';
export * from './lib/monitoring/messaging-stats.service';
export * from './lib/monitoring/health-check.service';

// 异常处理导出
export * from './lib/exceptions/messaging.exceptions';

// 多租户相关服务导出
export {
  TenantContextService,
  TenantIsolationService,
} from '@hl8/multi-tenancy';

// 类型定义导出 - 避免与config中的类型冲突
export type {
  MessagingModuleOptions,
  MessagingCacheConfig,
  TenantMessagingConfig,
  MonitoringConfig,
  RetryConfig,
  BackoffStrategy,
  RabbitMQConfig,
  RedisConfig,
  KafkaConfig,
} from './lib/types/messaging.types';

// 导出枚举值
export { MessagingAdapterType } from './lib/types/messaging.types';

// 使用示例导出 - 注释掉以避免在导入时执行
// export * from './examples/cache-integration.example';
// export * from './examples/exception-usage.example';
// export * from './examples/config-integration.example';
// export * from './examples/complete-usage.example';
// export * from './examples/performance-benchmark.example';
// export * from './examples/advanced-cache-integration.example';
// export * from './examples/cache-performance-benchmark.example';
