# HL8 SAAS平台消息队列模块设计方案

## 📋 文档概述

### 设计目标

本文档阐述HL8 SAAS平台消息队列模块的完整设计方案，基于RabbitMQ、Redis Streams、Apache Kafka和nestjs-cls实现高性能、分布式、多租户的消息队列解决方案，为整个SAAS平台提供统一、可靠的消息传递和事件驱动服务。

### 核心特性

- **多消息队列支持**: RabbitMQ + Redis Streams + Apache Kafka
- **事件驱动**: 完整的事件发布/订阅系统
- **异步任务**: 异步任务处理和调度
- **多租户**: 基于nestjs-cls的简化多租户消息隔离
- **类型安全**: 完整的TypeScript类型支持
- **消息持久化**: 消息持久化和恢复机制
- **重试机制**: 智能的消息重试和死信队列
- **监控统计**: 完整的消息队列监控和性能统计

## 🏗️ 架构设计

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                   消息队列模块架构                          │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   接口层    │ │   服务层    │ │   适配层    │ │  传输层  │ │
│  │ (Interface)│ │  (Service)  │ │  (Adapter)  │ │(Transport)│
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              nestjs-cls 上下文层                        │ │
│  │            (Context Management)                        │ │
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

- **MessagingService**: 核心消息队列服务
- **EventService**: 事件发布/订阅服务
- **TaskService**: 异步任务处理服务
- **TenantMessagingService**: 多租户消息服务

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

#### 5. 上下文层 (Context Layer)

- **ClsService**: 基于AsyncLocalStorage的上下文管理
- **租户中间件**: 自动提取和设置租户上下文
- **消息上下文**: 消息上下文传播

## 🔧 核心功能设计

### 1. 基础消息队列功能

#### 消息队列操作接口

```typescript
interface IMessagingService {
  // 发布/订阅操作
  publish<T>(topic: string, message: T, options?: PublishOptions): Promise<void>;
  subscribe<T>(topic: string, handler: MessageHandler<T>): Promise<void>;
  unsubscribe(topic: string, handler?: MessageHandler<any>): Promise<void>;
  
  // 队列操作
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
}
```

#### 事件服务接口

```typescript
interface IEventService {
  // 事件操作
  emit<T>(eventName: string, data: T, options?: EventOptions): Promise<void>;
  on<T>(eventName: string, handler: EventHandler<T>): Promise<void>;
  off(eventName: string, handler?: EventHandler<any>): Promise<void>;
  once<T>(eventName: string, handler: EventHandler<T>): Promise<void>;
  
  // 事件管理
  getEventNames(): string[];
  getEventListeners(eventName: string): EventHandler<any>[];
  removeAllListeners(eventName?: string): Promise<void>;
  
  // 租户事件
  emitTenantEvent<T>(tenantId: string, eventName: string, data: T): Promise<void>;
  onTenantEvent<T>(tenantId: string, eventName: string, handler: EventHandler<T>): Promise<void>;
  offTenantEvent(tenantId: string, eventName: string, handler?: EventHandler<any>): Promise<void>;
}
```

#### 任务服务接口

```typescript
interface ITaskService {
  // 任务操作
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
  // 租户消息操作
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
  // 命名空间策略
  getTenantNamespace(tenantId: string): string;
  getTenantQueueName(tenantId: string, queueName: string): string;
  getTenantTopicName(tenantId: string, topicName: string): string;
  
  // 路由策略
  shouldIsolateTenant(tenantId: string): boolean;
  getTenantRoutingKey(tenantId: string, routingKey: string): string;
  
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

#### RabbitMQ适配器

```typescript
interface IRabbitMQAdapter extends IMessagingAdapter {
  // RabbitMQ特定操作
  createExchange(exchange: string, type: ExchangeType, options?: ExchangeOptions): Promise<void>;
  deleteExchange(exchange: string): Promise<void>;
  bindQueue(queue: string, exchange: string, routingKey: string): Promise<void>;
  unbindQueue(queue: string, exchange: string, routingKey: string): Promise<void>;
  
  // 消息确认
  ackMessage(message: Message): Promise<void>;
  nackMessage(message: Message, requeue?: boolean): Promise<void>;
  rejectMessage(message: Message, requeue?: boolean): Promise<void>;
}
```

#### Redis适配器

```typescript
interface IRedisAdapter extends IMessagingAdapter {
  // Redis Streams操作
  addToStream(stream: string, fields: Record<string, string>, id?: string): Promise<string>;
  readFromStream(stream: string, options?: StreamReadOptions): Promise<StreamMessage[]>;
  createConsumerGroup(stream: string, group: string): Promise<void>;
  readFromConsumerGroup(stream: string, group: string, consumer: string, options?: ConsumerGroupReadOptions): Promise<ConsumerGroupMessage[]>;
  
  // 消息确认
  ackStreamMessage(stream: string, group: string, id: string): Promise<void>;
  pendingStreamMessages(stream: string, group: string): Promise<PendingMessage[]>;
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
  getRetryQueueName(originalQueue: string, attempt: number): string;
  
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
  
  // 租户监控
  getTenantStats(tenantId: string): Promise<TenantMessagingStats>;
  getAllTenantStats(): Promise<Map<string, TenantMessagingStats>>;
  
  // 健康检查
  healthCheck(): Promise<HealthStatus>;
  adapterHealthCheck(adapterType: MessagingAdapterType): Promise<HealthStatus>;
}
```

#### 统计信息

```typescript
interface MessagingStats {
  // 连接统计
  totalConnections: number;
  activeConnections: number;
  failedConnections: number;
  adapterStats: Map<MessagingAdapterType, AdapterStats>;
  
  // 消息统计
  totalMessages: number;
  publishedMessages: number;
  consumedMessages: number;
  failedMessages: number;
  retriedMessages: number;
  
  // 队列统计
  totalQueues: number;
  activeQueues: number;
  queueStats: Map<string, QueueStats>;
  
  // 租户统计
  totalTenants: number;
  activeTenants: number;
  tenantStats: Map<string, TenantMessagingStats>;
  
  // 性能统计
  averageLatency: number;
  throughput: number;
  errorRate: number;
}
```

## 📦 模块结构

### 目录结构

```
packages/messaging/
├── src/
│   ├── index.ts                    # 主入口文件
│   ├── lib/
│   │   ├── messaging.module.ts     # NestJS模块
│   │   ├── messaging.service.ts    # 消息队列服务
│   │   ├── event.service.ts        # 事件服务
│   │   ├── task.service.ts         # 任务服务
│   │   ├── tenant-messaging.service.ts # 多租户消息服务
│   │   ├── types/
│   │   │   ├── messaging.types.ts  # 消息队列类型定义
│   │   │   ├── event.types.ts      # 事件类型定义
│   │   │   ├── task.types.ts       # 任务类型定义
│   │   │   ├── adapter.types.ts    # 适配器类型定义
│   │   │   └── tenant.types.ts     # 租户类型定义
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
│   │   ├── middleware/
│   │   │   ├── messaging.middleware.ts
│   │   │   └── tenant-messaging.middleware.ts
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

#### 1. messaging.module.ts

```typescript
import { ClsModule } from 'nestjs-cls';

@Module({})
export class MessagingModule {
  static forRoot(options: MessagingModuleOptions): DynamicModule {
    return {
      module: MessagingModule,
      imports: [
        ClsModule.forRoot({
          middleware: { mount: true },
          global: true,
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
        TenantMessagingService,
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
        TenantMessagingService,
        MessagingMonitor,
      ],
    };
  }
}
```

#### 2. messaging.service.ts

```typescript
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class MessagingService implements IMessagingService {
  private adapters: Map<MessagingAdapterType, IMessagingAdapter> = new Map();

  constructor(
    private readonly cls: ClsService,
    private readonly adapterFactory: AdapterFactory,
  ) {}

  async publish<T>(topic: string, message: T, options?: PublishOptions): Promise<void> {
    const adapter = this.getAdapter(options?.adapter);
    await adapter.publish(topic, message, options);
  }

  async subscribe<T>(topic: string, handler: MessageHandler<T>): Promise<void> {
    const adapter = this.getDefaultAdapter();
    await adapter.subscribe(topic, handler);
  }

  async sendToQueue<T>(queue: string, message: T, options?: SendOptions): Promise<void> {
    const adapter = this.getAdapter(options?.adapter);
    await adapter.sendToQueue(queue, message, options);
  }

  async consume<T>(queue: string, handler: MessageHandler<T>): Promise<void> {
    const adapter = this.getDefaultAdapter();
    await adapter.consume(queue, handler);
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
import { ClsService } from 'nestjs-cls';

@Injectable()
export class EventService implements IEventService {
  private eventHandlers: Map<string, EventHandler<any>[]> = new Map();

  constructor(
    private readonly messagingService: MessagingService,
    private readonly cls: ClsService,
  ) {}

  async emit<T>(eventName: string, data: T, options?: EventOptions): Promise<void> {
    const tenantId = this.cls.get('tenantId');
    
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

#### 4. event-handler.decorator.ts

```typescript
import { SetMetadata } from '@nestjs/common';

export const EVENT_HANDLER_METADATA = 'event_handler';

export function EventHandler(eventName: string, options?: EventHandlerOptions) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        const result = await method.apply(this, args);
        return result;
      } catch (error) {
        console.error(`Error in event handler ${eventName}:`, error);
        if (options?.throwOnError) {
          throw error;
        }
      }
    };

    SetMetadata(EVENT_HANDLER_METADATA, {
      eventName,
      options,
      target: target.constructor.name,
      method: propertyName,
    })(target, propertyName, descriptor);
  };
}
```

#### 5. rabbitmq.adapter.ts

```typescript
import { Injectable } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQAdapter implements IRabbitMQAdapter {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  constructor(private readonly config: RabbitMQConfig) {}

  async connect(): Promise<void> {
    this.connection = await amqp.connect(this.config.url);
    this.channel = await this.connection.createChannel();
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }

  isConnected(): boolean {
    return !!(this.connection && this.channel);
  }

  async publish<T>(topic: string, message: T, options?: PublishOptions): Promise<void> {
    const exchange = options?.exchange || this.config.exchange;
    const routingKey = options?.routingKey || topic;
    
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    
    const messageBuffer = Buffer.from(JSON.stringify(message));
    const publishOptions: amqp.Options.Publish = {
      persistent: options?.persistent !== false,
      messageId: options?.messageId,
      correlationId: options?.correlationId,
      replyTo: options?.replyTo,
    };

    await this.channel.publish(exchange, routingKey, messageBuffer, publishOptions);
  }

  async subscribe<T>(topic: string, handler: MessageHandler<T>): Promise<void> {
    const exchange = this.config.exchange;
    const queue = `${this.config.queuePrefix}${topic}`;
    
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(queue, exchange, topic);

    await this.channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const message = JSON.parse(msg.content.toString());
          await handler(message);
          this.channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          this.channel.nack(msg, false, false);
        }
      }
    });
  }

  getAdapterType(): MessagingAdapterType {
    return MessagingAdapterType.RABBITMQ;
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
  
  // 多租户配置
  tenant?: TenantMessagingConfig;
  
  // 重试配置
  retry?: RetryConfig;
  
  // 监控配置
  monitoring?: MonitoringConfig;
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
    private readonly cls: ClsService,
  ) {}

  async createUser(userData: UserData): Promise<User> {
    const user = await this.userRepository.create(userData);
    
    // 发布事件
    await this.eventService.emit('user.created', {
      userId: user.id,
      tenantId: user.tenantId,
      userData: user
    });
    
    // 添加异步任务
    await this.taskService.addTask('send-welcome-email', {
      userId: user.id,
      email: user.email
    });
    
    return user;
  }

  // 事件处理器
  @EventHandler('user.created')
  async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    console.log('User created:', event.userId);
    // 处理用户创建后的逻辑
  }

  // 任务处理器
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
    private readonly tenantMessagingService: TenantMessagingService,
    private readonly cls: ClsService,
  ) {}

  async createTenant(tenantData: TenantData): Promise<Tenant> {
    const tenant = await this.tenantRepository.create(tenantData);
    
    // 创建租户消息队列
    await this.tenantMessagingService.createTenantQueues(tenant.id);
    
    // 发布租户创建事件
    await this.tenantMessagingService.publishTenantMessage(
      tenant.id,
      'tenant.created',
      { tenantId: tenant.id, tenantData: tenant }
    );
    
    return tenant;
  }

  async deleteTenant(tenantId: string): Promise<void> {
    // 清除租户消息
    await this.tenantMessagingService.clearTenantMessages(tenantId);
    
    // 删除租户队列
    await this.tenantMessagingService.deleteTenantQueues(tenantId);
    
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
    private readonly cls: ClsService,
  ) {}

  async sendNotification(notification: Notification): Promise<void> {
    const tenantId = this.cls.get('tenantId');
    
    if (tenantId) {
      // 租户消息
      await this.messagingService.sendToQueue(
        `tenant.${tenantId}.notifications`,
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

### 4. 中间件配置

```typescript
// app.module.ts
@Module({
  imports: [MessagingModule.forRoot(options)],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware, MessagingMiddleware)
      .forRoutes('*');
  }
}
```

## 📊 性能优化

### 1. 连接池优化

- **连接复用**: 高效的连接池管理
- **租户连接**: 租户级别的连接管理
- **连接监控**: 实时连接状态监控

### 2. 消息处理优化

- **批量处理**: 批量消息处理优化
- **消息压缩**: 消息内容压缩
- **序列化优化**: 高效的序列化算法

### 3. 路由优化

- **智能路由**: 基于消息内容的路由
- **负载均衡**: 消息负载均衡分发
- **优先级队列**: 消息优先级处理

## 🔒 安全考虑

### 1. 消息安全

- **消息加密**: 敏感消息加密传输
- **访问控制**: 基于角色的消息访问控制
- **审计日志**: 完整的消息操作审计

### 2. 租户隔离

- **消息隔离**: 租户消息完全隔离
- **队列隔离**: 租户队列独立管理
- **权限控制**: 租户级别的权限验证

## 📈 监控和运维

### 1. 性能监控

- **消息统计**: 消息发送和接收统计
- **队列监控**: 队列长度和处理速度
- **租户监控**: 租户级别的消息统计

### 2. 健康检查

- **连接状态**: 消息队列连接健康状态
- **适配器状态**: 各适配器的运行状态
- **租户状态**: 租户消息队列状态

## 🚀 实施计划

### 第一阶段：基础功能

- 消息队列适配器集成
- 基础消息发布/订阅
- 事件服务实现

### 第二阶段：多租户支持

- 租户消息隔离
- 租户队列管理
- 租户事件处理

### 第三阶段：高级功能

- 异步任务处理
- 重试和死信队列
- 消息监控统计

### 第四阶段：生产就绪

- 性能优化
- 安全加固
- 运维工具

## 📝 总结

HL8 SAAS平台消息队列模块采用现代化的设计理念，基于RabbitMQ、Redis Streams、Apache Kafka和nestjs-cls实现高性能、分布式、多租户的消息队列解决方案。

该设计方案的核心优势：

- **多消息队列支持**: RabbitMQ + Redis Streams + Apache Kafka
- **事件驱动**: 完整的事件发布/订阅系统
- **异步任务**: 异步任务处理和调度
- **多租户**: 基于nestjs-cls的简化多租户消息隔离
- **类型安全**: 完整的TypeScript类型支持
- **消息持久化**: 消息持久化和恢复机制
- **重试机制**: 智能的消息重试和死信队列
- **监控统计**: 完整的消息队列监控和性能统计

这个方案为SAAS平台的消息传递需求提供了完整的解决方案，支持企业级应用的高可用、高性能、高安全性要求。
