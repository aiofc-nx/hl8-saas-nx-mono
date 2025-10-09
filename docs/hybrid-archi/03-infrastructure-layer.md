# 基础设施层设计文档

> **文档版本**: 1.0.0  
> **创建日期**: 2025-01-27  

---

## 📋 目录

- [1. 基础设施层概述](#1-基础设施层概述)
- [2. 混合架构下的功能组件要求](#2-混合架构下的功能组件要求)
- [3. 核心组件](#3-核心组件)
- [4. 适配器模式](#4-适配器模式)
- [5. 事件存储](#5-事件存储)
- [6. 实现指南](#6-实现指南)
- [7. 最佳实践](#7-最佳实践)

---

## 1. 基础设施层概述

### 1.1 定义

基础设施层提供技术实现，支持上层架构的运行。它实现领域层定义的接口，连接外部系统和服务。

### 1.2 职责

```
基础设施层职责
├── 1. 实现仓储接口
│   ├── 数据库访问
│   ├── 数据映射
│   ├── 查询优化
│   └── 事务管理
│
├── 2. 实现端口适配器
│   ├── 缓存适配器
│   ├── 消息队列适配器
│   ├── 外部服务适配器
│   └── 文件存储适配器
│
├── 3. 事件基础设施
│   ├── 事件存储实现
│   ├── 快照存储实现
│   ├── 事件序列化
│   └── 事件版本管理
│
└── 4. 技术服务
    ├── 日志服务
    ├── 配置服务
    ├── 监控服务
    └── 性能优化
```

### 1.3 特点

- **技术实现**：包含所有技术细节
- **可替换**：实现可以替换而不影响业务逻辑
- **适配外部**：适配各种外部系统和服务
- **性能优化**：负责性能优化和资源管理

---

## 2. 混合架构下的功能组件要求

### 2.1 概述

在 **Clean Architecture + DDD + CQRS + Event Sourcing + Event-Driven Architecture** 混合架构模式下，基础设施层需要实现领域层和应用层定义的所有接口，并提供对 CQRS、ES、EDA 的完整技术支持。

### 2.2 架构模式对基础设施层的要求

#### 2.2.1 Clean Architecture 要求

```
Clean Architecture 对基础设施层的要求：
├── ✅ 实现领域层接口
│   └── 仓储接口、领域服务接口
│
├── ✅ 实现应用层端口
│   └── 输出端口的具体实现
│
├── ✅ 适配器模式
│   └── 适配外部系统，隔离技术细节
│
└── ✅ 可替换性
    └── 技术实现可以替换而不影响业务逻辑
```

#### 2.2.2 DDD 要求

```
DDD 对基础设施层的要求：
├── ✅ 仓储实现
│   ├── 实现 IRepository 接口
│   ├── 数据模型映射（Mapper）
│   ├── 乐观锁实现
│   └── 事务管理
│
├── ✅ 领域事件基础设施
│   ├── 事件发布机制
│   ├── 事件订阅管理
│   └── 事件持久化
│
└── ✅ 防腐层实现
    └── 适配外部系统，保护领域模型
```

#### 2.2.3 CQRS 要求

```
CQRS 对基础设施层的要求：
├── ✅ 写模型仓储
│   ├── 聚合根持久化
│   ├── 版本控制
│   └── 事务管理
│
├── ✅ 读模型仓储
│   ├── 优化的查询结构
│   ├── 去规范化数据
│   ├── 缓存集成
│   └── 索引优化
│
├── ✅ 读写模型同步
│   ├── 事件投影器基础设施
│   ├── 读模型更新机制
│   └── 最终一致性保证
│
└── ✅ 缓存基础设施
    ├── 查询结果缓存
    ├── 缓存失效策略
    └── 分布式缓存支持
```

#### 2.2.4 Event Sourcing 要求

```
Event Sourcing 对基础设施层的要求：
├── ✅ 事件存储实现
│   ├── EventStore 接口实现
│   ├── 事件表设计（aggregateId, version, eventType, eventData）
│   ├── 事件追加（Append-Only）
│   ├── 版本控制和并发冲突检测
│   └── 事件查询优化（索引、分片）
│
├── ✅ 快照存储实现
│   ├── SnapshotStore 接口实现
│   ├── 快照表设计
│   ├── 快照创建策略
│   ├── 快照清理策略
│   └── 快照+增量事件加载优化
│
├── ✅ 事件序列化
│   ├── 事件序列化器实现
│   ├── 支持 JSON 序列化
│   ├── 支持事件版本管理
│   ├── 事件类型注册表
│   └── 反序列化工厂
│
├── ✅ 事件投影基础设施
│   ├── 投影器执行引擎
│   ├── 投影进度追踪
│   ├── 读模型重建支持
│   └── 投影失败恢复
│
└── ✅ 性能优化
    ├── 事件流分页加载
    ├── 快照阈值管理
    ├── 事件缓存
    └── 并行投影处理
```

#### 2.2.5 Event-Driven Architecture 要求

```
Event-Driven Architecture 对基础设施层的要求：
├── ✅ 消息队列集成
│   ├── 消息队列适配器（RabbitMQ、Kafka等）
│   ├── 事件发布到消息队列
│   ├── 消息消费和处理
│   └── 消息确认机制
│
├── ✅ 事件总线基础设施
│   ├── 内存事件总线（开发/测试）
│   ├── 分布式事件总线（生产）
│   ├── 事件路由
│   └── 事件过滤
│
├── ✅ 死信队列 (DLQ)
│   ├── 失败事件存储
│   ├── 重试机制
│   ├── 失败原因记录
│   └── 手动恢复接口
│
├── ✅ 事件监控
│   ├── 事件发布统计
│   ├── 事件处理延迟监控
│   ├── 失败率统计
│   ├── 性能指标收集
│   └── 监控告警
│
└── ✅ 异步处理基础设施
    ├── 消息确认机制
    ├── 重试策略配置
    ├── 幂等性保证
    └── 顺序保证（同一聚合的事件）
```

### 2.3 基础设施层功能组件完整清单

基于混合架构的要求，基础设施层必须提供以下功能组件：

#### 必需组件 (Must Have)

| 组件 | 用途 | 支持的模式 |
|------|------|-----------|
| **Repository 实现** | 仓储接口实现 | Clean Architecture, DDD |
| **Database Adapter** | 数据库适配器 | Clean Architecture |
| **Mapper** | 数据模型映射器 | DDD |
| **Transaction Manager** | 事务管理器 | DDD |

#### CQRS 特定组件

| 组件 | 用途 | 说明 |
|------|------|------|
| **Write Repository** | 写模型仓储 | 聚合根持久化 |
| **Read Model Repository** | 读模型仓储 | 查询数据访问 |
| **Cache Adapter** | 缓存适配器 | 查询结果缓存 |
| **Projector Executor** | 投影器执行器 | 更新读模型 |

#### Event Sourcing 特定组件

| 组件 | 用途 | 说明 |
|------|------|------|
| **EventStore Implementation** | 事件存储实现 | 持久化事件流 |
| **SnapshotStore Implementation** | 快照存储实现 | 持久化聚合快照 |
| **EventSerializer** | 事件序列化器 | 序列化/反序列化事件 |
| **EventRegistry** | 事件类型注册表 | 事件类型映射 |
| **SnapshotStrategy** | 快照策略 | 快照创建规则 |

#### Event-Driven Architecture 特定组件

| 组件 | 用途 | 说明 |
|------|------|------|
| **MessageQueue Adapter** | 消息队列适配器 | RabbitMQ/Kafka 集成 |
| **DeadLetterQueue** | 死信队列 | 失败事件处理 |
| **EventMonitor** | 事件监控器 | 监控事件处理 |
| **RetryPolicy** | 重试策略 | 失败重试配置 |
| **IdempotencyChecker** | 幂等性检查器 | 防止重复处理 |

---

## 3. 核心组件

### 3.1 仓储实现

#### 仓储接口（领域层定义）

```typescript
// domain/repositories/user-repository.interface.ts
export interface IUserRepository {
  save(user: UserAggregate): Promise<void>;
  findById(id: EntityId): Promise<UserAggregate | null>;
  findByEmail(email: Email): Promise<UserAggregate | null>;
  findAll(criteria?: FindCriteria): Promise<UserAggregate[]>;
  delete(id: EntityId): Promise<void>;
}
```

#### 仓储实现（基础设施层）

```typescript
// infrastructure/repositories/user.repository.ts
import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user-repository.interface';
import { UserAggregate } from '../../domain/aggregates/user.aggregate';
import { DatabaseService } from '@hl8/database';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    private readonly db: DatabaseService,
    private readonly mapper: UserMapper
  ) {}

  async save(user: UserAggregate): Promise<void> {
    // 1. 映射聚合根到数据模型
    const dataModel = this.mapper.toDataModel(user);
    
    // 2. 检查是否已存在
    const existing = await this.db.users.findOne({ id: dataModel.id });
    
    // 3. 插入或更新
    if (existing) {
      await this.db.users.update(
        { id: dataModel.id },
        dataModel,
        { version: user.version - 1 }  // 乐观锁
      );
    } else {
      await this.db.users.insert(dataModel);
    }
  }

  async findById(id: EntityId): Promise<UserAggregate | null> {
    // 1. 查询数据库
    const dataModel = await this.db.users.findOne({ id: id.toString() });
    if (!dataModel) {
      return null;
    }
    
    // 2. 映射为聚合根
    return this.mapper.toDomain(dataModel);
  }

  async findByEmail(email: Email): Promise<UserAggregate | null> {
    const dataModel = await this.db.users.findOne({ email: email.value });
    if (!dataModel) {
      return null;
    }
    return this.mapper.toDomain(dataModel);
  }

  async findAll(criteria?: FindCriteria): Promise<UserAggregate[]> {
    const dataModels = await this.db.users.find(criteria);
    return dataModels.map(dm => this.mapper.toDomain(dm));
  }

  async delete(id: EntityId): Promise<void> {
    await this.db.users.softDelete({ id: id.toString() });
  }
}
```

### 3.2 适配器

#### 缓存适配器

```typescript
/**
 * 缓存适配器接口
 */
export interface ICacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(pattern?: string): Promise<void>;
}

/**
 * Redis 缓存适配器实现
 */
@Injectable()
export class RedisCacheAdapter implements ICacheAdapter {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: RedisClient
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) return null;
    return JSON.parse(value);
  }

  async set<T>(key: string, value: T, ttl = 300): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async clear(pattern?: string): Promise<void> {
    const keys = await this.redis.keys(pattern || '*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

#### 消息队列适配器

```typescript
/**
 * 消息队列适配器接口
 */
export interface IMessageQueueAdapter {
  publish(topic: string, message: unknown): Promise<void>;
  subscribe(topic: string, handler: MessageHandler): Promise<void>;
  unsubscribe(topic: string): Promise<void>;
}

/**
 * RabbitMQ 适配器实现
 */
@Injectable()
export class RabbitMQAdapter implements IMessageQueueAdapter {
  constructor(
    @Inject('RABBITMQ_CLIENT') private readonly client: RabbitMQClient
  ) {}

  async publish(topic: string, message: unknown): Promise<void> {
    await this.client.publish(topic, Buffer.from(JSON.stringify(message)));
  }

  async subscribe(topic: string, handler: MessageHandler): Promise<void> {
    await this.client.subscribe(topic, async (msg) => {
      const message = JSON.parse(msg.content.toString());
      await handler(message);
    });
  }

  async unsubscribe(topic: string): Promise<void> {
    await this.client.unsubscribe(topic);
  }
}
```

---

## 4. 适配器模式

### 4.1 端口适配器架构

```
┌─────────────────────────────────────────────────────┐
│              Ports & Adapters Pattern                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Application Layer                                  │
│  ┌───────────────────────────────────┐             │
│  │     Use Cases & Services          │             │
│  └────────┬──────────────────┬───────┘             │
│           │                  │                      │
│     ┌─────▼─────┐      ┌────▼──────┐              │
│     │  Output   │      │  Output   │              │
│     │  Port     │      │  Port     │              │
│     │(Interface)│      │(Interface)│              │
│     └─────┬─────┘      └────┬──────┘              │
│           │                  │                      │
│  ═════════╪══════════════════╪═════════════════════ │
│           │ Infrastructure   │                      │
│     ┌─────▼─────┐      ┌────▼──────┐              │
│     │  Adapter  │      │  Adapter  │              │
│     │ (Database)│      │  (Cache)  │              │
│     └───────────┘      └───────────┘              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 4.2 端口定义（应用层）

```typescript
// application/ports/repository.port.ts
export interface IRepositoryPort<T> {
  save(entity: T): Promise<void>;
  findById(id: string): Promise<T | null>;
}

// application/ports/cache.port.ts
export interface ICachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
}

// application/ports/event-publisher.port.ts
export interface IEventPublisherPort {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}
```

### 4.3 适配器实现（基础设施层）

```typescript
// infrastructure/adapters/repository.adapter.ts
@Injectable()
export class RepositoryAdapter<T> implements IRepositoryPort<T> {
  constructor(
    private readonly db: DatabaseService,
    private readonly mapper: IMapper<T, DataModel>
  ) {}

  async save(entity: T): Promise<void> {
    const dataModel = this.mapper.toDataModel(entity);
    await this.db.save(dataModel);
  }

  async findById(id: string): Promise<T | null> {
    const dataModel = await this.db.findById(id);
    if (!dataModel) return null;
    return this.mapper.toDomain(dataModel);
  }
}
```

---

## 5. 事件存储

### 5.1 事件存储接口

```typescript
/**
 * 事件存储接口
 */
export interface IEventStore {
  /**
   * 保存事件
   */
  saveEvents(
    aggregateId: string,
    events: DomainEvent[],
    expectedVersion?: number
  ): Promise<void>;

  /**
   * 获取事件流
   */
  getEvents(
    aggregateId: string,
    fromVersion?: number
  ): Promise<DomainEvent[]>;

  /**
   * 获取所有事件
   */
  getAllEvents(
    fromTimestamp?: Date,
    toTimestamp?: Date
  ): Promise<DomainEvent[]>;
}
```

### 5.2 事件存储实现

```typescript
@Injectable()
export class EventStore implements IEventStore {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventSerializer: IEventSerializer
  ) {}

  async saveEvents(
    aggregateId: string,
    events: DomainEvent[],
    expectedVersion?: number
  ): Promise<void> {
    // 1. 检查版本冲突
    if (expectedVersion !== undefined) {
      const currentVersion = await this.getCurrentVersion(aggregateId);
      if (currentVersion !== expectedVersion) {
        throw new ConcurrencyError('Version conflict detected');
      }
    }

    // 2. 序列化事件
    const eventRecords = events.map((event, index) => ({
      eventId: event.eventId.toString(),
      aggregateId: aggregateId,
      eventType: event.eventType,
      eventData: this.eventSerializer.serialize(event),
      version: (expectedVersion || 0) + index + 1,
      occurredOn: event.occurredOn,
      metadata: event.metadata,
    }));

    // 3. 保存到数据库
    await this.db.eventStore.insertMany(eventRecords);
  }

  async getEvents(
    aggregateId: string,
    fromVersion = 0
  ): Promise<DomainEvent[]> {
    // 1. 查询事件记录
    const records = await this.db.eventStore.find({
      aggregateId,
      version: { $gt: fromVersion },
    }).sort({ version: 1 });

    // 2. 反序列化事件
    return records.map(record => 
      this.eventSerializer.deserialize(record.eventType, record.eventData)
    );
  }

  async getAllEvents(
    fromTimestamp?: Date,
    toTimestamp?: Date
  ): Promise<DomainEvent[]> {
    const query: any = {};
    if (fromTimestamp) {
      query.occurredOn = { $gte: fromTimestamp };
    }
    if (toTimestamp) {
      query.occurredOn = { ...query.occurredOn, $lte: toTimestamp };
    }

    const records = await this.db.eventStore.find(query).sort({ occurredOn: 1 });
    return records.map(record =>
      this.eventSerializer.deserialize(record.eventType, record.eventData)
    );
  }

  private async getCurrentVersion(aggregateId: string): Promise<number> {
    const lastEvent = await this.db.eventStore.findOne(
      { aggregateId },
      { sort: { version: -1 } }
    );
    return lastEvent?.version || 0;
  }
}
```

### 5.3 快照存储

```typescript
/**
 * 快照存储接口
 */
export interface ISnapshotStore {
  saveSnapshot(snapshot: IAggregateSnapshot): Promise<void>;
  getSnapshot(aggregateId: string): Promise<IAggregateSnapshot | null>;
  deleteSnapshot(aggregateId: string): Promise<void>;
}

/**
 * 快照存储实现
 */
@Injectable()
export class SnapshotStore implements ISnapshotStore {
  constructor(
    private readonly db: DatabaseService
  ) {}

  async saveSnapshot(snapshot: IAggregateSnapshot): Promise<void> {
    await this.db.snapshots.upsert(
      { aggregateId: snapshot.aggregateId },
      {
        aggregateId: snapshot.aggregateId,
        aggregateType: snapshot.aggregateType,
        version: snapshot.version,
        state: snapshot.state,
        createdAt: snapshot.createdAt,
      }
    );
  }

  async getSnapshot(aggregateId: string): Promise<IAggregateSnapshot | null> {
    return await this.db.snapshots.findOne({ aggregateId });
  }

  async deleteSnapshot(aggregateId: string): Promise<void> {
    await this.db.snapshots.delete({ aggregateId });
  }
}
```

---

## 6. 实现指南

### 6.1 仓储实现步骤

```typescript
// 步骤 1: 定义数据模型
interface UserDataModel {
  id: string;
  name: string;
  email: string;
  status: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

// 步骤 2: 创建映射器
class UserMapper {
  toDomain(dataModel: UserDataModel): UserAggregate {
    const email = Email.create(dataModel.email);
    const user = User.create(dataModel.name, email, dataModel.tenantId);
    return UserAggregate.fromUser(user, dataModel.version);
  }

  toDataModel(aggregate: UserAggregate): UserDataModel {
    return {
      id: aggregate.id.toString(),
      name: aggregate.user.name,
      email: aggregate.user.email.value,
      status: aggregate.user.status,
      version: aggregate.version,
      createdAt: aggregate.createdAt,
      updatedAt: aggregate.updatedAt,
      tenantId: aggregate.tenantId,
    };
  }
}

// 步骤 3: 实现仓储
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    private readonly db: DatabaseService,
    private readonly mapper: UserMapper
  ) {}

  async save(user: UserAggregate): Promise<void> {
    const dataModel = this.mapper.toDataModel(user);
    await this.db.users.save(dataModel);
  }

  async findById(id: EntityId): Promise<UserAggregate | null> {
    const dataModel = await this.db.users.findOne({ id: id.toString() });
    if (!dataModel) return null;
    return this.mapper.toDomain(dataModel);
  }
}
```

### 6.2 事件存储实现步骤

```typescript
// 步骤 1: 定义事件记录模型
interface EventRecord {
  eventId: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  eventData: string;  // JSON 序列化
  version: number;
  occurredOn: Date;
  metadata?: Record<string, unknown>;
}

// 步骤 2: 实现事件序列化器
class EventSerializer implements IEventSerializer {
  serialize(event: DomainEvent): string {
    return JSON.stringify({
      eventType: event.eventType,
      eventData: event.eventData,
      aggregateId: event.aggregateId.toString(),
      version: event.version,
      occurredOn: event.occurredOn,
    });
  }

  deserialize(eventType: string, data: string): DomainEvent {
    const parsed = JSON.parse(data);
    const EventClass = this.getEventClass(eventType);
    return new EventClass(parsed);
  }

  private getEventClass(eventType: string): any {
    // 事件类型映射
    const eventClassMap = {
      'UserCreated': UserCreatedEvent,
      'UserEmailUpdated': UserEmailUpdatedEvent,
      // ...
    };
    return eventClassMap[eventType];
  }
}

// 步骤 3: 实现事件存储
@Injectable()
export class EventStore implements IEventStore {
  async saveEvents(
    aggregateId: string,
    events: DomainEvent[],
    expectedVersion?: number
  ): Promise<void> {
    // 检查版本冲突
    // 序列化并保存事件
    // 更新聚合版本
  }

  async getEvents(
    aggregateId: string,
    fromVersion = 0
  ): Promise<DomainEvent[]> {
    // 查询事件记录
    // 反序列化为事件对象
    // 按版本排序返回
  }
}
```

---

## 7. 最佳实践

### 7.1 仓储实现最佳实践

#### ✅ DO - 应该做的

1. **使用映射器分离关注点**

   ```typescript
   // ✅ 好的做法
   class UserRepository {
     constructor(
       private readonly db: DatabaseService,
       private readonly mapper: UserMapper  // 专门的映射器
     ) {}
   }
   ```

2. **实现乐观锁**

   ```typescript
   async save(aggregate: AggregateRoot): Promise<void> {
     const expectedVersion = aggregate.version - 1;
     const result = await this.db.update(
       { id: aggregate.id, version: expectedVersion },
       { ...data, version: aggregate.version }
     );
     
     if (result.modifiedCount === 0) {
       throw new ConcurrencyError('Version conflict');
     }
   }
   ```

3. **使用工作单元模式**

   ```typescript
   class UnitOfWork {
     private aggregates = new Map<string, AggregateRoot>();
     
     register(aggregate: AggregateRoot): void {
       this.aggregates.set(aggregate.id.toString(), aggregate);
     }
     
     async commit(): Promise<void> {
       for (const aggregate of this.aggregates.values()) {
         await this.repository.save(aggregate);
       }
       this.aggregates.clear();
     }
   }
   ```

#### ❌ DON'T - 不应该做的

1. **不要在仓储中包含业务逻辑**

   ```typescript
   // ❌ 不要这样
   async save(user: User): Promise<void> {
     if (user.age < 18) {  // 业务逻辑应该在领域层
       throw new Error('User must be 18+');
     }
     await this.db.save(user);
   }
   ```

2. **不要暴露数据模型**

   ```typescript
   // ❌ 不要这样
   async findById(id: string): Promise<UserDataModel> {
     return await this.db.users.findOne({ id });  // 暴露了数据模型
   }
   
   // ✅ 应该这样
   async findById(id: EntityId): Promise<UserAggregate | null> {
     const dataModel = await this.db.users.findOne({ id: id.toString() });
     return dataModel ? this.mapper.toDomain(dataModel) : null;
   }
   ```

### 7.2 适配器实现最佳实践

#### ✅ DO - 应该做的

1. **实现重试机制**

   ```typescript
   class ResilientAdapter implements IExternalServiceAdapter {
     async call(params: Params): Promise<Result> {
       return await this.retry(
         () => this.externalService.call(params),
         { maxRetries: 3, delay: 1000 }
       );
     }
   }
   ```

2. **添加监控和日志**

   ```typescript
   class MonitoredAdapter implements IAdapter {
     async execute(params: Params): Promise<Result> {
       const start = Date.now();
       try {
         const result = await this.delegate.execute(params);
         this.metrics.recordSuccess(Date.now() - start);
         return result;
       } catch (error) {
         this.metrics.recordFailure(Date.now() - start);
         throw error;
       }
     }
   }
   ```

3. **使用连接池**

   ```typescript
   class DatabaseAdapter {
     private pool: ConnectionPool;
     
     async query(sql: string): Promise<Result> {
       const connection = await this.pool.acquire();
       try {
         return await connection.query(sql);
       } finally {
         await this.pool.release(connection);
       }
     }
   }
   ```

---

## 📚 相关文档

- [架构概述](00-overview.md)
- [领域层设计](01-domain-layer.md)
- [接口层设计](04-interface-layer.md)
- [事件溯源设计](06-event-sourcing.md)

---

**文档维护**: HL8 架构团队  
**最后更新**: 2025-01-27
