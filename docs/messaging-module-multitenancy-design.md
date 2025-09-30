# HL8 SAAS平台消息队列模块设计方案 (集成@hl8/multi-tenancy)

## 📋 文档概述

### 设计目标

本文档阐述HL8 SAAS平台消息队列模块的完整设计方案，基于RabbitMQ、Redis Streams、Apache Kafka和@hl8/multi-tenancy实现高性能、分布式、企业级多租户的消息队列解决方案，为整个SAAS平台提供统一、可靠、安全的消息传递和事件驱动服务。

### 核心特性

- **多消息队列支持**: RabbitMQ + Redis Streams + Apache Kafka
- **事件驱动**: 完整的事件发布/订阅系统
- **异步任务**: 异步任务处理和调度
- **企业级多租户**: 集成@hl8/multi-tenancy的专业多租户支持
- **类型安全**: 完整的TypeScript类型支持
- **消息持久化**: 消息持久化和恢复机制
- **重试机制**: 智能的消息重试和死信队列
- **监控统计**: 完整的消息队列监控和性能统计
- **安全隔离**: 严格的租户数据隔离和安全机制

## 🎯 为什么使用@hl8/multi-tenancy

### 主要优势

1. **企业级多租户**: 专业的多租户基础设施，支持复杂的租户管理需求
2. **高级隔离策略**: 支持多种租户隔离策略（key-prefix、namespace、database等）
3. **安全机制**: 内置的安全检查和访问控制机制
4. **审计日志**: 完整的租户操作审计和日志记录
5. **上下文管理**: 基于AsyncLocalStorage的高性能上下文管理
6. **NestJS集成**: 与NestJS依赖注入系统完美集成
7. **类型安全**: 提供完整的TypeScript类型支持

### 对比传统方案

**传统方案** (复杂且易错):

```typescript
// 需要手动传递租户ID
async publishMessage(tenantId: string, topic: string, message: any) {
  const tenantTopic = `tenant:${tenantId}:${topic}`;
  return this.messagingService.publish(tenantTopic, message);
}

// 调用时需要传递租户ID
await messagingService.publishMessage('tenant-123', 'user.created', userData);
```

**使用@hl8/multi-tenancy** (简洁且安全):

```typescript
// 自动获取当前租户上下文
async publishMessage(topic: string, message: any) {
  const tenantId = this.tenantContextService.getTenant();
  const tenantTopic = await this.tenantIsolationService.getTenantKey(topic, tenantId);
  return this.messagingService.publish(tenantTopic, message);
}

// 调用时无需传递租户ID
await messagingService.publishMessage('user.created', userData);
```

## 🏗️ 架构设计

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                   消息队列模块架构 (集成@hl8/multi-tenancy)    │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   接口层    │ │   服务层    │ │   适配层    │ │  传输层  │ │
│  │ (Interface)│ │  (Service)  │ │  (Adapter)  │ │(Transport)│
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           @hl8/multi-tenancy 多租户基础设施              │ │
│  │      (TenantContextService + TenantIsolationService)   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │  RabbitMQ   │ │ Redis Stream│ │ Apache Kafka│ │ 监控统计 │ │
│  │   消息队列  │ │   消息流    │ │   消息流    │ │ Monitor │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 核心组件

#### 1. 接口层 (Interface Layer)

- **消息装饰器**: @EventHandler, @TaskHandler, @MessageHandler
- **类型定义**: 完整的TypeScript类型支持
- **配置接口**: 模块配置和选项定义

#### 2. 服务层 (Service Layer)

- **MessagingService**: 集成multi-tenancy的核心消息队列服务
- **EventService**: 事件发布/订阅服务
- **TaskService**: 异步任务处理服务
- **TenantContextService**: 租户上下文管理服务
- **TenantIsolationService**: 租户隔离服务

#### 3. 适配层 (Adapter Layer)

- **RabbitMQ适配器**: RabbitMQ消息队列适配器
- **Redis适配器**: Redis Streams适配器
- **Kafka适配器**: Apache Kafka适配器
- **内存适配器**: 内存消息队列适配器

#### 4. 传输层 (Transport Layer)

- **RabbitMQ**: 企业级消息队列
- **Redis Streams**: 轻量级消息流
- **Apache Kafka**: 高吞吐量消息流
- **监控系统**: 消息队列监控和统计

#### 5. 多租户层 (Multi-Tenancy Layer)

- **TenantContextService**: 基于AsyncLocalStorage的上下文管理
- **TenantIsolationService**: 租户隔离和键生成服务
- **MultiLevelIsolationService**: 多级隔离策略服务

## 🔧 核心功能设计

### 1. 基础消息队列功能 (集成@hl8/multi-tenancy)

#### 消息队列操作接口

```typescript
interface IMessagingService {
  // 发布/订阅操作 - 自动处理租户上下文
  publish<T>(topic: string, message: T, options?: PublishOptions): Promise<void>;
  subscribe<T>(topic: string, handler: MessageHandler<T>): Promise<void>;
  unsubscribe(topic: string, handler?: MessageHandler<any>): Promise<void>;
  
  // 队列操作 - 自动处理租户上下文
  sendToQueue<T>(queue: string, message: T, options?: SendOptions): Promise<void>;
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
```

#### 事件服务接口

```typescript
interface IEventService {
  // 事件操作 - 自动处理租户上下文
  emit<T>(eventName: string, data: T, options?: EventOptions): Promise<void>;
  on<T>(eventName: string, handler: EventHandler<T>): Promise<void>;
  off(eventName: string, handler?: EventHandler<any>): Promise<void>;
  once<T>(eventName: string, handler: EventHandler<T>): Promise<void>;
  
  // 事件管理
  getEventNames(): string[];
  getEventListeners(eventName: string): EventHandler<any>[];
  removeAllListeners(eventName?: string): Promise<void>;
  
  // 租户事件 - 使用multi-tenancy服务
  emitTenantEvent<T>(tenantId: string, eventName: string, data: T): Promise<void>;
  onTenantEvent<T>(tenantId: string, eventName: string, handler: EventHandler<T>): Promise<void>;
  offTenantEvent(tenantId: string, eventName: string, handler?: EventHandler<any>): Promise<void>;
}
```

#### 任务服务接口

```typescript
interface ITaskService {
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
  scheduleTask<T>(taskName: string, data: T, schedule: ScheduleOptions): Promise<void>;
  cancelScheduledTask(taskId: string): Promise<void>;
  getScheduledTasks(): Promise<ScheduledTask[]>;
}
```

### 2. 多租户支持

#### 租户消息隔离

```typescript
interface ITenantMessagingService extends IMessagingService {
  // 租户消息操作 - 使用multi-tenancy服务
  publishTenantMessage<T>(tenantId: string, topic: string, message: T): Promise<void>;
  subscribeTenantMessage<T>(tenantId: string, topic: string, handler: MessageHandler<T>): Promise<void>;
  unsubscribeTenantMessage(tenantId: string, topic: string, handler?: MessageHandler<any>): Promise<void>;
  
  // 租户队列操作
  sendToTenantQueue<T>(tenantId: string, queue: string, message: T): Promise<void>;
  consumeTenantQueue<T>(tenantId: string, queue: string, handler: MessageHandler<T>): Promise<void>;
  
  // 租户管理
  createTenantQueues(tenantId: string): Promise<void>;
  deleteTenantQueues(tenantId: string): Promise<void>;
  getTenantQueues(tenantId: string): Promise<string[]>;
  clearTenantMessages(tenantId: string): Promise<void>;
  
  // 租户统计
  getTenantStats(tenantId: string): Promise<TenantMessagingStats>;
}
```

#### 租户隔离策略

```typescript
interface ITenantIsolationStrategy {
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
  updateTenantConfig(tenantId: string, config: TenantMessagingConfig): Promise<void>;
}
```

### 3. 消息适配器

#### 适配器接口

```typescript
interface IMessagingAdapter {
  // 连接管理
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // 消息操作
  publish<T>(topic: string, message: T, options?: PublishOptions): Promise<void>;
  subscribe<T>(topic: string, handler: MessageHandler<T>): Promise<void>;
  sendToQueue<T>(queue: string, message: T, options?: SendOptions): Promise<void>;
  consume<T>(queue: string, handler: MessageHandler<T>): Promise<void>;
  
  // 队列管理
  createQueue(queue: string, options?: QueueOptions): Promise<void>;
  deleteQueue(queue: string): Promise<void>;
  getQueueInfo(queue: string): Promise<QueueInfo>;
  
  // 适配器信息
  getAdapterType(): MessagingAdapterType;
  getAdapterInfo(): AdapterInfo;
}
```

### 4. 重试和死信队列

#### 重试策略

```typescript
interface IRetryStrategy {
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
```

#### 死信队列

```typescript
interface IDeadLetterQueue {
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
```

### 5. 监控和统计

#### 消息队列监控

```typescript
interface IMessagingMonitor {
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
```

## 📦 模块结构

### 目录结构

```
packages/messaging/
├── src/
│   ├── index.ts                    # 主入口文件
│   ├── lib/
│   │   ├── messaging.module.ts     # NestJS模块 (集成@hl8/multi-tenancy)
│   │   ├── messaging.service.ts    # 消息队列服务 (集成@hl8/multi-tenancy)
│   │   ├── event.service.ts        # 事件服务
│   │   ├── task.service.ts         # 任务服务
│   │   ├── types/
│   │   │   ├── messaging.types.ts  # 消息队列类型定义
│   │   │   ├── event.types.ts      # 事件类型定义
│   │   │   ├── task.types.ts       # 任务类型定义
│   │   │   └── adapter.types.ts    # 适配器类型定义
│   │   ├── adapters/
│   │   │   ├── base.adapter.ts     # 基础适配器
│   │   │   ├── rabbitmq.adapter.ts # RabbitMQ适配器
│   │   │   ├── redis.adapter.ts    # Redis适配器
│   │   │   ├── kafka.adapter.ts    # Kafka适配器
│   │   │   └── memory.adapter.ts   # 内存适配器
│   │   ├── decorators/
│   │   │   ├── event-handler.decorator.ts
│   │   │   ├── task-handler.decorator.ts
│   │   │   └── message-handler.decorator.ts
│   │   ├── strategies/
│   │   │   ├── retry.strategy.ts   # 重试策略
│   │   │   ├── routing.strategy.ts # 路由策略
│   │   │   ├── tenant.strategy.ts  # 租户策略
│   │   │   └── dead-letter.strategy.ts # 死信队列策略
│   │   ├── utils/
│   │   │   ├── serializer.util.ts
│   │   │   ├── message-utils.util.ts
│   │   │   └── messaging-utils.util.ts
│   │   └── monitoring/
│   │       ├── messaging-monitor.service.ts
│   │       ├── messaging-stats.service.ts
│   │       └── health-check.service.ts
│   └── __tests__/
│       ├── messaging.service.spec.ts
│       ├── event.service.spec.ts
│       ├── task.service.spec.ts
│       ├── adapters/
│       │   ├── rabbitmq.adapter.spec.ts
│       │   └── redis.adapter.spec.ts
│       └── decorators/
│           ├── event-handler.decorator.spec.ts
│           └── task-handler.decorator.spec.ts
├── package.json
└── README.md
```

### 核心文件说明

#### 1. messaging.module.ts (集成@hl8/multi-tenancy)

```typescript
import { MultiTenancyModule, TenantContextService, TenantIsolationService } from '@hl8/multi-tenancy';

@Module({})
export class MessagingModule {
  static forRoot(options: MessagingModuleOptions): DynamicModule {
    return {
      module: MessagingModule,
      imports: [
        // 集成 multi-tenancy 模块
        MultiTenancyModule.forRoot(options.multiTenancy || {
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
        }),
      ],
      providers: [
        {
          provide: MESSAGING_MODULE_OPTIONS,
          useValue: options,
        },
        MessagingService,
        EventService,
        TaskService,
        RabbitMQAdapter,
        RedisAdapter,
        KafkaAdapter,
        MemoryAdapter,
        MessagingMonitor,
      ],
      exports: [
        MessagingService,
        EventService,
        TaskService,
        TenantContextService,
        TenantIsolationService,
        MessagingMonitor,
      ],
    };
  }
}
```

#### 2. messaging.service.ts (集成@hl8/multi-tenancy)

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { TenantContextService, TenantIsolationService } from '@hl8/multi-tenancy';

@Injectable()
export class MessagingService implements IMessagingService {
  private adapters: Map<MessagingAdapterType, IMessagingAdapter> = new Map();

  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService,
    private readonly adapterFactory: AdapterFactory,
    @Inject(MESSAGING_MODULE_OPTIONS)
    private readonly options: MessagingModuleOptions
  ) {}

  async publish<T>(topic: string, message: T, options?: PublishOptions): Promise<void> {
    const tenantId = this.tenantContextService.getTenant();
    
    let finalTopic = topic;
    if (tenantId && this.options.enableTenantIsolation !== false) {
      // 使用多租户隔离服务生成租户感知的主题
      finalTopic = await this.tenantIsolationService.getTenantKey(topic, tenantId);
    }
    
    const adapter = this.getAdapter(options?.adapter);
    await adapter.publish(finalTopic, message, options);
  }

  async subscribe<T>(topic: string, handler: MessageHandler<T>): Promise<void> {
    const tenantId = this.tenantContextService.getTenant();
    
    let finalTopic = topic;
    if (tenantId && this.options.enableTenantIsolation !== false) {
      // 使用多租户隔离服务生成租户感知的主题
      finalTopic = await this.tenantIsolationService.getTenantKey(topic, tenantId);
    }
    
    const adapter = this.getDefaultAdapter();
    await adapter.subscribe(finalTopic, handler);
  }

  async sendToQueue<T>(queue: string, message: T, options?: SendOptions): Promise<void> {
    const tenantId = this.tenantContextService.getTenant();
    
    let finalQueue = queue;
    if (tenantId && this.options.enableTenantIsolation !== false) {
      // 使用多租户隔离服务生成租户感知的队列
      finalQueue = await this.tenantIsolationService.getTenantKey(queue, tenantId);
    }
    
    const adapter = this.getAdapter(options?.adapter);
    await adapter.sendToQueue(finalQueue, message, options);
  }

  async consume<T>(queue: string, handler: MessageHandler<T>): Promise<void> {
    const tenantId = this.tenantContextService.getTenant();
    
    let finalQueue = queue;
    if (tenantId && this.options.enableTenantIsolation !== false) {
      // 使用多租户隔离服务生成租户感知的队列
      finalQueue = await this.tenantIsolationService.getTenantKey(queue, tenantId);
    }
    
    const adapter = this.getDefaultAdapter();
    await adapter.consume(finalQueue, handler);
  }

  getCurrentTenant(): string | null {
    return this.tenantContextService.getTenant();
  }

  hasTenantContext(): boolean {
    return this.tenantContextService.getTenant() !== null;
  }

  private getAdapter(type?: MessagingAdapterType): IMessagingAdapter {
    const adapterType = type || this.getDefaultAdapterType();
    const adapter = this.adapters.get(adapterType);
    if (!adapter) {
      throw new Error(`Adapter ${adapterType} not found`);
    }
    return adapter;
  }

  private getDefaultAdapterType(): MessagingAdapterType {
    return MessagingAdapterType.RABBITMQ;
  }
}
```

#### 3. event.service.ts

```typescript
import { Injectable } from '@nestjs/common';
import { TenantContextService, TenantIsolationService } from '@hl8/multi-tenancy';

@Injectable()
export class EventService implements IEventService {
  private eventHandlers: Map<string, EventHandler<any>[]> = new Map();

  constructor(
    private readonly messagingService: MessagingService,
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService,
  ) {}

  async emit<T>(eventName: string, data: T, options?: EventOptions): Promise<void> {
    const tenantId = this.tenantContextService.getTenant();
    
    if (tenantId) {
      // 租户事件
      await this.emitTenantEvent(tenantId, eventName, data);
    } else {
      // 全局事件
      const topic = `event.${eventName}`;
      await this.messagingService.publish(topic, data, options);
    }
  }

  async on<T>(eventName: string, handler: EventHandler<T>): Promise<void> {
    const handlers = this.eventHandlers.get(eventName) || [];
    handlers.push(handler);
    this.eventHandlers.set(eventName, handlers);

    const topic = `event.${eventName}`;
    await this.messagingService.subscribe(topic, async (message) => {
      try {
        await handler(message);
      } catch (error) {
        console.error(`Error handling event ${eventName}:`, error);
      }
    });
  }

  async off(eventName: string, handler?: EventHandler<any>): Promise<void> {
    if (handler) {
      const handlers = this.eventHandlers.get(eventName) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      this.eventHandlers.delete(eventName);
    }
  }

  async emitTenantEvent<T>(tenantId: string, eventName: string, data: T): Promise<void> {
    const topic = `tenant.${tenantId}.event.${eventName}`;
    await this.messagingService.publish(topic, data);
  }

  async onTenantEvent<T>(tenantId: string, eventName: string, handler: EventHandler<T>): Promise<void> {
    const topic = `tenant.${tenantId}.event.${eventName}`;
    await this.messagingService.subscribe(topic, async (message) => {
      try {
        await handler(message);
      } catch (error) {
        console.error(`Error handling tenant event ${eventName}:`, error);
      }
    });
  }
}
```

## 🔧 配置和选项

### 模块配置

```typescript
interface MessagingModuleOptions {
  // 适配器配置
  adapter: MessagingAdapterType;
  
  // RabbitMQ配置
  rabbitmq?: RabbitMQConfig;
  
  // Redis配置
  redis?: RedisConfig;
  
  // Kafka配置
  kafka?: KafkaConfig;
  
  // 多租户配置 - 集成@hl8/multi-tenancy
  multiTenancy?: IMultiTenancyModuleOptions;
  
  // 重试配置
  retry?: RetryConfig;
  
  // 监控配置
  monitoring?: MonitoringConfig;
  
  // 向后兼容配置
  tenant?: TenantMessagingConfig;
  enableTenantIsolation?: boolean;
  keyPrefix?: string;
}

interface RabbitMQConfig {
  url: string;
  exchange: string;
  queuePrefix: string;
  options?: amqp.Options.Connect;
}

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  streamPrefix: string;
  options?: RedisClientOptions;
}

interface KafkaConfig {
  clientId: string;
  brokers: string[];
  topicPrefix: string;
  options?: KafkaConfig;
}

interface TenantMessagingConfig {
  enableIsolation: boolean;
  tenantPrefix: string;
  autoCreateTenantQueues: boolean;
  tenantQueueLimit: number;
}

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoff: 'linear' | 'exponential';
  enableDeadLetterQueue: boolean;
}
```

### 使用示例

```typescript
// 模块配置
@Module({
  imports: [
    MessagingModule.forRoot({
      adapter: MessagingAdapterType.RABBITMQ,
      rabbitmq: {
        url: 'amqp://localhost:5672',
        exchange: 'hl8_saas',
        queuePrefix: 'hl8_',
      },
      redis: {
        host: 'localhost',
        port: 6379,
        db: 1,
        streamPrefix: 'hl8_stream_',
      },
      kafka: {
        clientId: 'hl8-saas',
        brokers: ['localhost:9092'],
        topicPrefix: 'hl8_',
      },
      // 新增：多租户配置（推荐使用）
      multiTenancy: {
        context: {
          enableAutoInjection: true,
          contextTimeout: 30000,
          enableAuditLog: true,
          contextStorage: 'memory',
          allowCrossTenantAccess: false
        },
        isolation: {
          strategy: 'key-prefix',
          keyPrefix: 'hl8:messaging:',
          namespace: 'messaging-namespace',
          enableIsolation: true,
          level: 'strict'
        },
        middleware: {
          enableTenantMiddleware: true,
          tenantHeader: 'X-Tenant-ID',
          tenantQueryParam: 'tenant',
          tenantSubdomain: true,
          validationTimeout: 5000,
          strictValidation: true
        },
        security: {
          enableSecurityCheck: true,
          maxFailedAttempts: 5,
          lockoutDuration: 300000,
          enableAuditLog: true,
          enableIpWhitelist: false
        }
      },
      // 保留用于向后兼容
      tenant: {
        enableIsolation: true,
        tenantPrefix: 'tenant_',
        autoCreateTenantQueues: true,
        tenantQueueLimit: 100,
      },
      retry: {
        maxRetries: 3,
        retryDelay: 1000,
        backoff: 'exponential',
        enableDeadLetterQueue: true,
      },
      monitoring: {
        enableStats: true,
        enableHealthCheck: true,
        statsInterval: 60000,
      },
    })
  ]
})
export class AppModule {}
```

## 🚀 使用示例

### 1. 基础服务使用

```typescript
// user.service.ts
@Injectable()
export class UserService {
  constructor(
    private readonly eventService: EventService,
    private readonly taskService: TaskService,
    private readonly messagingService: MessagingService,
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService,
  ) {}

  async createUser(userData: UserData): Promise<User> {
    const user = await this.userRepository.create(userData);
    
    // 发布事件 - 自动处理租户上下文
    await this.eventService.emit('user.created', {
      userId: user.id,
      tenantId: user.tenantId,
      userData: user
    });
    
    // 添加异步任务 - 自动处理租户上下文
    await this.taskService.addTask('send-welcome-email', {
      userId: user.id,
      email: user.email
    });
    
    return user;
  }

  // 事件处理器 - 自动处理租户上下文
  @EventHandler('user.created')
  async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    console.log('User created:', event.userId);
    // 处理用户创建后的逻辑
  }

  // 任务处理器 - 自动处理租户上下文
  @TaskHandler('send-welcome-email')
  async sendWelcomeEmail(taskData: WelcomeEmailTaskData): Promise<void> {
    await this.emailService.sendWelcomeEmail(taskData.userId, taskData.email);
  }
}
```

### 2. 多租户消息使用

```typescript
// tenant.service.ts
@Injectable()
export class TenantService {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService,
  ) {}

  async createTenant(tenantData: TenantData): Promise<Tenant> {
    const tenant = await this.tenantRepository.create(tenantData);
    
    // 使用租户上下文服务运行租户相关操作
    await this.tenantContextService.runWithTenant(tenant.id, async () => {
      // 发布租户创建事件 - 自动处理租户上下文
      await this.messagingService.publish('tenant.created', {
        tenantId: tenant.id,
        tenantData: tenant
      });
    });
    
    return tenant;
  }

  async deleteTenant(tenantId: string): Promise<void> {
    // 使用租户上下文服务运行租户相关操作
    await this.tenantContextService.runWithTenant(tenantId, async () => {
      // 清除租户消息 - 使用隔离服务
      await this.tenantIsolationService.clearTenantCache(tenantId);
    });
    
    await this.tenantRepository.delete(tenantId);
  }
}
```

### 3. 自定义消息处理器

```typescript
// notification.service.ts
@Injectable()
export class NotificationService {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async sendNotification(notification: Notification): Promise<void> {
    const tenantId = this.tenantContextService.getTenant();
    
    if (tenantId) {
      // 租户消息 - 自动处理租户上下文
      await this.messagingService.sendToQueue(
        'notifications',
        notification
      );
    } else {
      // 全局消息
      await this.messagingService.sendToQueue(
        'global.notifications',
        notification
      );
    }
  }

  @MessageHandler('notifications')
  async handleNotification(notification: Notification): Promise<void> {
    // 处理通知消息
    await this.processNotification(notification);
  }
}
```

## 🔄 迁移指南

### 从旧版本迁移

如果您正在从使用nestjs-cls的旧版本迁移到使用@hl8/multi-tenancy的新版本，请参考以下迁移步骤：

#### 1. 依赖更新

```bash
# 移除旧的依赖
pnpm remove nestjs-cls

# 添加新的依赖
pnpm add @hl8/multi-tenancy
```

#### 2. 配置更新

**旧配置**:

```typescript
MessagingModule.forRoot({
  // ... 其他配置
  tenant: {
    enableIsolation: true,
    tenantPrefix: 'tenant_',
  }
})
```

**新配置**:

```typescript
MessagingModule.forRoot({
  // ... 其他配置
  multiTenancy: {
    context: {
      enableAutoInjection: true,
      contextTimeout: 30000,
      enableAuditLog: true,
    },
    isolation: {
      strategy: 'key-prefix',
      keyPrefix: 'hl8:messaging:',
      enableIsolation: true,
    },
    middleware: {
      enableTenantMiddleware: true,
      tenantHeader: 'X-Tenant-ID',
    }
  }
})
```

#### 3. 服务注入更新

**旧的服务注入**:

```typescript
constructor(
  private readonly messagingService: MessagingService,
  private readonly cls: ClsService,
) {}
```

**新的服务注入**:

```typescript
constructor(
  private readonly messagingService: MessagingService,
  private readonly tenantContextService: TenantContextService,
  private readonly tenantIsolationService: TenantIsolationService,
) {}
```

#### 4. 上下文访问更新

**旧的上下文访问**:

```typescript
const tenantId = this.cls.get('tenantId');
```

**新的上下文访问**:

```typescript
const tenantId = this.tenantContextService.getTenant();
```

#### 5. 向后兼容性

新版本保持了向后兼容性：

- 旧的`tenant`配置仍然有效
- 旧的`enableTenantIsolation`配置仍然有效
- 旧的API调用方式仍然有效

### 最佳实践

1. **逐步迁移**: 建议逐步迁移，先添加新的配置，然后逐步更新服务注入
2. **测试验证**: 在迁移过程中，确保所有测试都能通过
3. **监控观察**: 迁移后密切监控系统性能和行为
4. **文档更新**: 更新相关的API文档和使用说明

## 📊 性能优化

### 1. 多租户优化

- **租户连接池**: 租户级别的连接管理
- **消息隔离**: 高效的租户消息隔离策略
- **批量操作**: 租户级别的批量消息处理

### 2. 上下文管理优化

- **零开销**: AsyncLocalStorage性能优异
- **内存效率**: 上下文自动清理
- **并发安全**: 天然支持并发请求

### 3. 消息处理优化

- **批量处理**: 批量消息处理优化
- **消息压缩**: 消息内容压缩
- **序列化优化**: 高效的序列化算法

## 🔒 安全考虑

### 1. 消息安全

- **消息加密**: 敏感消息加密传输
- **访问控制**: 基于角色的消息访问控制
- **审计日志**: 完整的消息操作审计

### 2. 租户隔离

- **消息隔离**: 租户消息完全隔离
- **队列隔离**: 租户队列独立管理
- **权限控制**: 租户级别的权限验证

### 3. 上下文安全

- **上下文验证**: 确保租户上下文存在
- **上下文清理**: 防止上下文泄露
- **错误处理**: 优雅的上下文错误处理

## 📈 监控和运维

### 1. 多租户监控

- **租户消息统计**: 每个租户的消息使用情况
- **租户性能监控**: 租户级别的性能指标
- **租户健康检查**: 包含租户状态的健康检查

### 2. 消息队列监控

- **消息统计**: 消息发送和接收统计
- **队列监控**: 队列长度和处理速度
- **适配器监控**: 各适配器的运行状态

## 🚀 实施计划

### 第一阶段：基础集成

- 集成@hl8/multi-tenancy
- 实现基础消息队列服务
- 实现租户消息隔离

### 第二阶段：高级功能

- 实现事件服务和任务服务
- 实现消息适配器
- 完善类型定义

### 第三阶段：监控和优化

- 实现监控和统计
- 性能优化
- 安全加固

### 第四阶段：生产就绪

- 完善测试覆盖
- 文档完善
- 运维工具

## 📝 总结

集成@hl8/multi-tenancy的消息队列模块设计方案为HL8 SAAS平台提供了一个企业级、高效、安全的多租户消息队列解决方案。通过专业的多租户基础设施，提供了完整的租户管理、消息隔离、安全机制和审计功能。

该方案的核心优势：

- **企业级多租户**: 专业的多租户基础设施，支持复杂的租户管理需求
- **高级隔离策略**: 支持多种租户隔离策略（key-prefix、namespace、database等）
- **安全机制**: 内置的安全检查和访问控制机制
- **审计日志**: 完整的租户操作审计和日志记录
- **多消息队列支持**: RabbitMQ + Redis Streams + Apache Kafka
- **事件驱动**: 完整的事件发布/订阅系统
- **异步任务**: 异步任务处理和调度
- **类型安全**: 完整的TypeScript类型支持
- **消息持久化**: 消息持久化和恢复机制
- **重试机制**: 智能的消息重试和死信队列
- **监控统计**: 完整的消息队列监控和性能统计

这个方案为SAAS平台的消息传递需求提供了企业级的最佳解决方案，支持企业级应用的高可用、高性能、高安全性要求。
