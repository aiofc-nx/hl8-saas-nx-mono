# 应用层设计文档

> **文档版本**: 1.0.0  
> **创建日期**: 2025-01-27  

---

## 📋 目录

- [1. 应用层概述](#1-应用层概述)
- [2. 混合架构下的功能组件要求](#2-混合架构下的功能组件要求)
- [3. 核心组件](#3-核心组件)
- [4. CQRS 系统](#4-cqrs-系统)
- [5. 用例系统](#5-用例系统)
- [6. 实现指南](#6-实现指南)
- [7. 最佳实践](#7-最佳实践)

---

## 1. 应用层概述

### 1.1 定义

应用层是连接接口层和领域层的桥梁，负责协调领域对象完成具体的业务用例。它不包含业务逻辑，而是编排领域对象来实现业务目标。

### 1.2 职责

```
应用层职责
├── 1. 用例编排
│   ├── 协调领域对象
│   ├── 管理事务边界
│   ├── 发布领域事件
│   └── 返回结果给接口层
│
├── 2. CQRS 实现
│   ├── 命令处理（写操作）
│   ├── 查询处理（读操作）
│   ├── 事件处理（异步）
│   └── Saga 编排（分布式事务）
│
├── 3. 端口定义
│   ├── 定义输出端口接口
│   ├── 声明基础设施需求
│   └── 保持技术无关性
│
└── 4. 应用服务
    ├── 提供应用级服务
    ├── 缓存管理
    └── 权限验证
```

### 1.3 特点

- **编排而非实现**：协调领域对象，不实现业务逻辑
- **技术无关**：不依赖具体的技术实现
- **用例驱动**：每个用例代表一个完整的业务操作
- **事务管理**：管理事务边界和一致性

---

## 2. 混合架构下的功能组件要求

### 2.1 概述

在 **Clean Architecture + DDD + CQRS + Event Sourcing + Event-Driven Architecture** 混合架构模式下，应用层不仅要提供用例编排能力，还需要完整实现 CQRS、支持 ES，并与 EDA 深度集成。

### 2.2 架构模式对应用层的要求

#### 2.2.1 Clean Architecture 要求

```
Clean Architecture 对应用层的要求：
├── ✅ 用例驱动 (Use Case Driven)
│   └── 每个用例代表一个完整的业务操作
│
├── ✅ 依赖倒置 (DIP)
│   └── 只依赖领域层接口，不依赖基础设施实现
│
├── ✅ 端口定义
│   └── 定义输出端口接口（输入端口即用例）
│
└── ✅ 编排而非实现
    └── 协调领域对象，不包含业务逻辑
```

#### 2.2.2 DDD 要求

```
DDD 对应用层的要求：
├── ✅ 应用服务 (Application Services)
│   └── 编排领域对象完成业务用例
│
├── ✅ 事务管理
│   └── 管理聚合根的事务边界
│
├── ✅ 领域事件发布
│   └── 协调领域事件的发布和订阅
│
└── ✅ 防腐层 (Anti-Corruption Layer)
    └── 适配外部系统，保护领域模型
```

#### 2.2.3 CQRS 要求

```
CQRS 对应用层的要求：
├── ✅ 命令处理系统
│   ├── CommandBus - 命令总线
│   ├── ICommandHandler - 命令处理器接口
│   ├── CommandHandler 装饰器
│   └── 命令验证和路由
│
├── ✅ 查询处理系统
│   ├── QueryBus - 查询总线
│   ├── IQueryHandler - 查询处理器接口
│   ├── QueryHandler 装饰器
│   ├── 查询缓存管理
│   └── 查询结果封装
│
├── ✅ 事件处理系统
│   ├── EventBus - 事件总线
│   ├── IEventHandler - 事件处理器接口
│   ├── EventHandler 装饰器
│   └── 事件订阅管理
│
├── ✅ 读写模型协调
│   ├── 命令端操作聚合根
│   ├── 查询端访问读模型
│   └── 事件投影器更新读模型
│
└── ✅ 统一 CQRS 总线
    └── CQRSBus - 整合三个总线的统一接口
```

#### 2.2.4 Event Sourcing 要求

```
Event Sourcing 对应用层的要求：
├── ✅ 事件存储接口
│   ├── saveEvents() - 保存事件流
│   ├── getEvents() - 获取事件流
│   ├── saveSnapshot() - 保存快照
│   └── getSnapshot() - 获取快照
│
├── ✅ 命令处理器支持 ES
│   ├── 从事件存储加载聚合根
│   ├── 执行业务逻辑（聚合根方法）
│   ├── 保存新事件到事件存储
│   └── 标记事件为已提交
│
├── ✅ 事件版本管理
│   ├── 版本冲突检测（乐观锁）
│   ├── 事件版本递增
│   └── 并发控制
│
└── ✅ 快照策略
    ├── 定期创建快照
    ├── 快照阈值管理（如100个事件）
    └── 快照+增量事件恢复
```

#### 2.2.5 Event-Driven Architecture 要求

```
Event-Driven Architecture 对应用层的要求：
├── ✅ 事件发布机制
│   ├── 单事件发布 publish()
│   ├── 批量事件发布 publishAll()
│   └── 异步发布支持
│
├── ✅ 事件订阅管理
│   ├── 注册事件处理器
│   ├── 取消事件订阅
│   ├── 处理器优先级排序
│   └── 动态订阅支持
│
├── ✅ 事件投影器 (Projectors)
│   ├── 监听领域事件
│   ├── 更新读模型
│   ├── 支持事件重放
│   └── 读模型重建
│
├── ✅ 异步处理
│   ├── 事件异步发布
│   ├── 事件处理器异步执行
│   └── 错误隔离（不影响主流程）
│
├── ✅ 错误处理和重试
│   ├── 事件处理失败重试
│   ├── 死信队列（DLQ）
│   ├── 错误日志记录
│   └── 失败事件恢复
│
└── ✅ 事件监控
    ├── 事件发布统计
    ├── 事件处理延迟监控
    ├── 失败率统计
    └── 性能指标收集
```

### 2.3 应用层功能组件完整清单

基于混合架构的要求，应用层必须提供以下功能组件：

#### 必需组件 (Must Have)

| 组件 | 用途 | 支持的模式 |
|------|------|-----------|
| **IUseCase** | 用例接口 | Clean Architecture |
| **CommandBus** | 命令总线 | CQRS, ES, EDA |
| **QueryBus** | 查询总线 | CQRS |
| **EventBus** | 事件总线 | CQRS, ES, EDA |
| **CQRSBus** | 统一CQRS总线 | CQRS |
| **UseCaseRegistry** | 用例注册表 | Clean Architecture |

#### CQRS 特定组件

| 组件 | 用途 | 说明 |
|------|------|------|
| **ICommandHandler** | 命令处理器接口 | 处理写操作 |
| **IQueryHandler** | 查询处理器接口 | 处理读操作 |
| **IEventHandler** | 事件处理器接口 | 处理异步事件 |
| **@CommandHandler** | 命令处理器装饰器 | 自动注册命令处理器 |
| **@QueryHandler** | 查询处理器装饰器 | 自动注册查询处理器 |
| **@EventHandler** | 事件处理器装饰器 | 自动注册事件处理器 |
| **BaseCommand** | 命令基类 | 命令对象基类 |
| **BaseQuery** | 查询基类 | 查询对象基类 |
| **IQueryResult** | 查询结果接口 | 封装查询结果 |

#### Event Sourcing 特定组件

| 组件 | 用途 | 说明 |
|------|------|------|
| **IEventStore** | 事件存储接口 | 事件持久化契约 |
| **IEventStoreRepository** | 事件存储仓储 | 事件存储实现 |
| **ISnapshotStore** | 快照存储接口 | 快照持久化契约 |
| **IAggregateSnapshot** | 聚合快照接口 | 快照数据结构 |
| **EventSerializer** | 事件序列化器 | 事件序列化/反序列化 |

#### Event-Driven Architecture 特定组件

| 组件 | 用途 | 说明 |
|------|------|------|
| **EventProjector** | 事件投影器 | 更新读模型 |
| **ProjectorManager** | 投影器管理器 | 管理所有投影器 |
| **@EventProjector** | 投影器装饰器 | 自动注册投影器 |
| **DeadLetterQueue** | 死信队列 | 处理失败事件 |
| **EventMonitor** | 事件监控器 | 监控事件处理 |
| **EventMiddleware** | 事件中间件 | 事件处理链 |

#### Saga 特定组件

| 组件 | 用途 | 说明 |
|------|------|------|
| **ISaga** | Saga 接口 | 分布式事务编排 |
| **SagaManager** | Saga 管理器 | 管理 Saga 生命周期 |
| **ISagaStep** | Saga 步骤接口 | 定义 Saga 步骤 |
| **SagaExecutionContext** | Saga 执行上下文 | Saga 运行时上下文 |

### 2.4 应用层组件架构图

```
┌─────────────────────────────────────────────────────────────┐
│              应用层功能组件架构                               │
└─────────────────────────────────────────────────────────────┘

                    CQRSBus (统一接口)
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   CommandBus       QueryBus         EventBus
   (命令总线)       (查询总线)        (事件总线)
        │                │                │
        ▼                ▼                ▼
  CommandHandler   QueryHandler     EventHandler
  (写操作处理)      (读操作处理)     (事件处理)
        │                │                │
        ▼                ▼                ▼
  AggregateRoot     ReadModel       Projector
  (领域层)          (读模型)         (更新读模型)

┌─────────────────────────────────────────────────────────────┐
│  Event Sourcing 支持                                         │
├─────────────────────────────────────────────────────────────┤
│  EventStore  │  SnapshotStore  │  EventSerializer           │
│      ↓       │       ↓         │         ↓                  │
│  保存事件流   │   保存快照       │   序列化/反序列化          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Event-Driven Architecture 支持                              │
├─────────────────────────────────────────────────────────────┤
│  Projector  │  SagaManager  │  DeadLetterQueue  │Monitor   │
│      ↓      │       ↓       │        ↓          │    ↓     │
│  投影事件    │  编排事务      │   失败处理         │  监控    │
└─────────────────────────────────────────────────────────────┘
```

### 2.5 功能组件实现检查清单

在开发应用层时，确保实现以下功能组件：

#### ✅ Clean Architecture 基础组件

- [ ] 定义用例接口 `IUseCase<TRequest, TResponse>`
- [ ] 实现用例类
- [ ] 定义输出端口接口
- [ ] 用例只依赖领域层接口
- [ ] 用例注册到 UseCaseRegistry

#### ✅ CQRS 核心组件

- [ ] 实现 CommandBus
- [ ] 实现 QueryBus
- [ ] 实现 EventBus
- [ ] 实现 CQRSBus（统一接口）
- [ ] 创建命令处理器（实现 ICommandHandler）
- [ ] 创建查询处理器（实现 IQueryHandler）
- [ ] 创建事件处理器（实现 IEventHandler）
- [ ] 使用装饰器自动注册处理器

#### ✅ Event Sourcing 支持组件

- [ ] 定义 IEventStore 接口
- [ ] 定义 ISnapshotStore 接口
- [ ] 命令处理器从事件存储加载聚合根
- [ ] 命令处理器保存事件到事件存储
- [ ] 实现事件序列化器
- [ ] 实现快照策略（如每100个事件）
- [ ] 处理版本冲突（乐观锁）

#### ✅ Event-Driven Architecture 支持组件

- [ ] 实现事件投影器（EventProjector）
- [ ] 实现投影器管理器（ProjectorManager）
- [ ] 实现死信队列（DeadLetterQueue）
- [ ] 实现事件监控器（EventMonitor）
- [ ] 支持事件重试机制
- [ ] 支持事件幂等性处理
- [ ] 事件处理失败回调

#### ✅ Saga 支持组件

- [ ] 实现 Saga 基类
- [ ] 实现 SagaManager
- [ ] 定义 Saga 步骤接口
- [ ] 支持补偿操作
- [ ] 支持 Saga 超时处理

### 2.6 实际代码示例

#### 完整的命令处理器（支持 CQRS + ES）

```typescript
/**
 * 更新用户邮箱命令处理器 - 支持 CQRS + ES
 */
@CommandHandler('UpdateUserEmail')
export class UpdateUserEmailCommandHandler 
  implements ICommandHandler<UpdateUserEmailCommand> {
  
  constructor(
    // Clean Architecture: 依赖接口，不依赖实现
    private readonly userRepository: IUserRepository,
    private readonly eventStore: IEventStore,
    private readonly eventBus: EventBus,
    private readonly snapshotStore: ISnapshotStore
  ) {}

  async execute(command: UpdateUserEmailCommand): Promise<void> {
    // ==================== CQRS: 命令验证 ====================
    this.validateCommand(command);
    
    // ==================== ES: 加载聚合根 ====================
    const aggregate = await this.loadAggregateWithES(command.userId);
    
    // ==================== DDD: 执行业务逻辑（在聚合根内）====================
    const newEmail = Email.create(command.newEmail);
    aggregate.updateEmail(newEmail);
    
    // ==================== ES: 保存事件 ====================
    await this.saveEventsWithES(aggregate);
    
    // ==================== EDA: 发布事件 ====================
    await this.publishEvents(aggregate);
    
    // ==================== ES: 快照策略 ====================
    await this.createSnapshotIfNeeded(aggregate);
  }

  /**
   * ES: 从事件存储加载聚合根
   */
  private async loadAggregateWithES(userId: string): Promise<UserAggregate> {
    // 1. 尝试获取快照
    const snapshot = await this.snapshotStore.getSnapshot(userId);
    
    if (snapshot) {
      // 2a. 从快照恢复 + 应用增量事件
      const eventsSinceSnapshot = await this.eventStore.getEvents(
        userId,
        snapshot.version
      );
      return UserAggregate.fromSnapshot(snapshot, eventsSinceSnapshot);
    } else {
      // 2b. 从完整事件流重建
      const events = await this.eventStore.getEvents(userId);
      return UserAggregate.fromEvents(events);
    }
  }

  /**
   * ES: 保存事件到事件存储
   */
  private async saveEventsWithES(aggregate: UserAggregate): Promise<void> {
    const newEvents = aggregate.getUncommittedEvents();
    
    if (newEvents.length > 0) {
      await this.eventStore.saveEvents(
        aggregate.id.toString(),
        newEvents,
        aggregate.version - newEvents.length  // 预期版本（乐观锁）
      );
    }
  }

  /**
   * EDA: 发布事件到事件总线
   */
  private async publishEvents(aggregate: UserAggregate): Promise<void> {
    const events = aggregate.getUncommittedEvents();
    
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    
    // 清除未提交事件（基类方法）
    aggregate.clearUncommittedEvents();
  }

  /**
   * ES: 快照策略 - 每100个事件创建快照
   */
  private async createSnapshotIfNeeded(aggregate: UserAggregate): Promise<void> {
    if (aggregate.version % 100 === 0) {
      const snapshot = aggregate.toSnapshot();
      await this.snapshotStore.saveSnapshot(snapshot);
    }
  }

  validateCommand(command: UpdateUserEmailCommand): void {
    if (!command.userId) throw new Error('User ID is required');
    if (!command.newEmail) throw new Error('Email is required');
  }

  async canHandle(command: UpdateUserEmailCommand): Promise<boolean> {
    return true;
  }

  getSupportedCommandType(): string {
    return 'UpdateUserEmail';
  }
}
```

#### 完整的事件投影器（支持 EDA）

```typescript
/**
 * 用户邮箱更新投影器 - 更新读模型
 */
@EventProjector('UserEmailUpdated')
export class UserEmailUpdatedProjector 
  extends BaseEventProjector<UserEmailUpdatedEvent> {
  
  constructor(
    private readonly userReadModel: IUserReadModel,
    private readonly cacheService: CacheService
  ) {
    super();
  }

  /**
   * EDA: 处理事件，更新读模型
   */
  async project(event: UserEmailUpdatedEvent): Promise<void> {
    // 1. 更新读模型
    await this.userReadModel.update(event.aggregateId.toString(), {
      email: event.newEmail,
      updatedAt: event.occurredOn,
      version: event.version,
    });
    
    // 2. 清除相关缓存
    await this.cacheService.delete(`user:${event.aggregateId}`);
    
    // 3. 记录投影日志
    this.logger?.info('User email projected to read model', {
      userId: event.aggregateId.toString(),
      newEmail: event.newEmail,
      version: event.version,
    });
  }

  getProjectorName(): string {
    return 'UserEmailUpdatedProjector';
  }

  getSupportedEventType(): string {
    return 'UserEmailUpdated';
  }

  /**
   * EDA: 幂等性检查
   */
  async isAlreadyProjected(event: UserEmailUpdatedEvent): Promise<boolean> {
    const user = await this.userReadModel.findById(event.aggregateId.toString());
    return user ? user.version >= event.version : false;
  }
}
```

#### 完整的 Saga 实现（支持分布式事务）

```typescript
/**
 * 订单处理 Saga - 编排多个聚合根的操作
 */
export class OrderProcessSaga extends CoreSaga {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus
  ) {
    super('OrderProcessSaga', true, true, 60000, 3, 1000);
  }

  protected defineSteps(): ISagaStep[] {
    return [
      {
        stepId: 'create-order',
        stepName: 'Create Order',
        stepType: SagaStepType.COMMAND,
        order: 1,
        execute: async (ctx) => {
          await this.commandBus.execute(
            new CreateOrderCommand(ctx.data.customerId, ctx.data.items, ...)
          );
        },
        compensate: async (ctx) => {
          await this.commandBus.execute(
            new CancelOrderCommand(ctx.data.orderId, ...)
          );
        }
      },
      {
        stepId: 'reserve-inventory',
        stepName: 'Reserve Inventory',
        stepType: SagaStepType.COMMAND,
        order: 2,
        execute: async (ctx) => {
          await this.commandBus.execute(
            new ReserveInventoryCommand(ctx.data.orderId, ctx.data.items, ...)
          );
        },
        compensate: async (ctx) => {
          await this.commandBus.execute(
            new ReleaseInventoryCommand(ctx.data.orderId, ...)
          );
        }
      },
      {
        stepId: 'process-payment',
        stepName: 'Process Payment',
        stepType: SagaStepType.COMMAND,
        order: 3,
        execute: async (ctx) => {
          await this.commandBus.execute(
            new ProcessPaymentCommand(ctx.data.orderId, ctx.data.amount, ...)
          );
        },
        compensate: async (ctx) => {
          await this.commandBus.execute(
            new RefundPaymentCommand(ctx.data.orderId, ...)
          );
        }
      }
    ];
  }
}
```

### 2.7 应用层组件在混合架构中的作用

```
┌─────────────────────────────────────────────────────────────┐
│         应用层组件在混合架构中的作用                           │
└─────────────────────────────────────────────────────────────┘

UseCases (用例)
├── 支持 Clean Architecture
│   ├── 表达业务用例
│   ├── 编排领域对象
│   └── 依赖倒置
│
└── 支持 DDD
    └── 应用服务协调领域对象

CommandBus / QueryBus / EventBus (CQRS总线)
├── 支持 CQRS
│   ├── 命令查询分离
│   ├── 路由和中间件
│   └── 读写模型协调
│
├── 支持 Event Sourcing
│   ├── 命令处理器加载事件流
│   ├── 命令处理器保存事件
│   └── 版本控制和并发管理
│
└── 支持 Event-Driven Architecture
    ├── 异步事件发布
    ├── 事件订阅管理
    └── 事件投影更新读模型

EventProjector (事件投影器)
├── 支持 CQRS
│   └── 更新读模型（查询端）
│
├── 支持 Event Sourcing
│   └── 监听事件流
│
└── 支持 Event-Driven Architecture
    ├── 订阅领域事件
    ├── 异步更新读模型
    └── 幂等性处理

SagaManager (Saga管理器)
├── 支持 CQRS
│   └── 编排多个命令
│
├── 支持 Event Sourcing
│   └── Saga 状态通过事件记录
│
└── 支持 Event-Driven Architecture
    ├── 事件驱动的流程编排
    ├── 补偿操作
    └── 最终一致性保证
```

### 2.8 聚合根事件管理方法在应用层的使用

应用层在协调聚合根时，需要正确使用事件管理方法。这些方法分为两类：

#### 基类提供的方法（直接使用）✅

这些方法由 `BaseAggregateRoot` 基类提供，应用层可以直接调用：

```typescript
// ✅ 基类提供的方法
class CreateUserCommandHandler {
  async execute(command: CreateUserCommand): Promise<void> {
    // 1. 创建聚合根（内部调用 addDomainEvent）
    const user = UserAggregate.create(command.name, command.email);
    
    // 2. 获取未提交的事件（基类方法）
    const events = user.getUncommittedEvents();
    
    // 3. 检查是否有未提交事件（基类方法）
    if (user.hasUncommittedEvents()) {
      // 4. 发布事件
      await this.eventBus.publishAll(events);
      
      // 5. 清除未提交事件（基类方法）
      user.clearUncommittedEvents();
      // 或使用别名: user.clearEvents();
    }
  }
}
```

**基类提供的完整方法列表**：

- `addDomainEvent(event)` - 添加领域事件
- `getUncommittedEvents()` - 获取未提交事件（推荐）
- `get uncommittedEvents` - 获取未提交事件（getter）
- `clearUncommittedEvents()` - 清除未提交事件（推荐）
- `clearEvents()` - 清除未提交事件（别名）
- `hasUncommittedEvents()` - 检查是否有未提交事件
- `getEventsOfType(type)` - 获取特定类型事件

#### 业务聚合根实现的方法（ES 推荐）📝

以下 Event Sourcing 方法由业务聚合根实现，应用层调用这些方法来支持事件溯源：

```typescript
// 📝 业务聚合根实现的 ES 方法
class UpdateUserEmailCommandHandler {
  async execute(command: UpdateUserEmailCommand): Promise<void> {
    // 1. 从事件存储加载聚合根（业务方法）
    const events = await this.eventStore.getEvents(command.userId);
    const user = UserAggregate.fromEvents(events);  // 📝 业务实现
    
    // 2. 执行业务逻辑
    const newEmail = Email.create(command.newEmail);
    user.updateEmail(newEmail);
    
    // 3. 保存新事件到事件存储
    const newEvents = user.getUncommittedEvents();  // ✅ 基类方法
    await this.eventStore.saveEvents(command.userId, newEvents);
    
    // 4. 发布事件
    await this.eventBus.publishAll(newEvents);
    
    // 5. 清除未提交事件
    user.clearUncommittedEvents();  // ✅ 基类方法
    
    // 6. 创建快照（如果需要，业务方法）
    if (user.version % 100 === 0) {
      const snapshot = user.toSnapshot();  // 📝 业务实现
      await this.snapshotStore.saveSnapshot(snapshot);
    }
  }
}
```

**业务聚合根实现的 ES 方法**：

- `static fromEvents(events)` - 📝 从事件流重建聚合
- `private apply(event)` - 📝 应用单个事件到聚合
- `toSnapshot()` - 📝 创建聚合快照
- `static fromSnapshot(snapshot, events)` - 📝 从快照恢复聚合

#### 方法使用模式总结

```typescript
// ✅ 推荐模式：清晰区分基类方法和业务方法
class CommandHandler {
  async execute(command: Command): Promise<void> {
    // 1. 加载聚合（ES：业务方法 fromEvents）
    const events = await this.eventStore.getEvents(id);
    const aggregate = Aggregate.fromEvents(events);  // 📝 业务实现
    
    // 2. 执行业务逻辑（聚合根方法）
    aggregate.doSomething();
    
    // 3. 保存事件（基类方法 getUncommittedEvents）
    const newEvents = aggregate.getUncommittedEvents();  // ✅ 基类
    await this.eventStore.saveEvents(id, newEvents);
    
    // 4. 发布事件（基类方法）
    await this.eventBus.publishAll(newEvents);
    
    // 5. 清除事件（基类方法）
    aggregate.clearUncommittedEvents();  // ✅ 基类
    
    // 6. 快照（ES：业务方法 toSnapshot）
    if (aggregate.version % 100 === 0) {
      const snapshot = aggregate.toSnapshot();  // 📝 业务实现
      await this.snapshotStore.saveSnapshot(snapshot);
    }
  }
}
```

#### 注意事项

1. **方法名称**：
   - ✅ 推荐使用 `clearUncommittedEvents()` 清除事件
   - ✅ 也可以使用 `clearEvents()` 别名
   - ⚠️ 文档中的 `markEventsAsCommitted()` 是概念性描述，实际使用上述方法

2. **ES 方法实现**：
   - 如果业务聚合根需要事件溯源，实现 `fromEvents()`, `apply()`, `toSnapshot()`, `fromSnapshot()`
   - 如果不需要事件溯源，只使用基类的事件管理方法即可

3. **事件发布顺序**：
   - 先保存事件到事件存储（持久化）
   - 再发布事件到事件总线（通知）
   - 最后清除未提交事件（清理）

---

## 3. 核心组件

### 3.1 用例 (Use Cases)

#### 定义

用例表达系统能够执行的具体业务操作，是业务需求的直接体现。

#### 用例接口

```typescript
/**
 * 用例接口
 */
export interface IUseCase<TRequest, TResponse> {
  /**
   * 执行用例
   */
  execute(request: TRequest): Promise<TResponse>;
  
  /**
   * 获取用例名称
   */
  getUseCaseName(): string;
  
  /**
   * 获取用例描述
   */
  getUseCaseDescription(): string;
  
  /**
   * 获取所需权限（可选）
   */
  getRequiredPermissions?(): string[];
}
```

#### 用例实现示例

```typescript
export class CreateUserUseCase implements IUseCase<CreateUserRequest, CreateUserResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
    // 1. 验证输入
    this.validateRequest(request);
    
    // 2. 创建聚合根（业务逻辑在领域层）
    const email = Email.create(request.email);
    const user = UserAggregate.create(request.name, email, request.tenantId);
    
    // 3. 保存聚合根
    await this.userRepository.save(user);
    
    // 4. 发布领域事件
    const events = user.getUncommittedEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    // 清除未提交事件（基类方法）
    user.clearUncommittedEvents();
    
    // 5. 返回结果
    return new CreateUserResponse(user.id.toString());
  }

  getUseCaseName(): string {
    return 'CreateUser';
  }

  getUseCaseDescription(): string {
    return '创建新用户';
  }

  getRequiredPermissions(): string[] {
    return ['user:create'];
  }

  private validateRequest(request: CreateUserRequest): void {
    if (!request.name) throw new Error('Name is required');
    if (!request.email) throw new Error('Email is required');
  }
}
```

### 3.2 CQRS 系统

应用层实现完整的 CQRS 模式，详见 [CQRS 模式设计文档](05-cqrs-pattern.md)

#### 核心组件

```typescript
// 命令系统
export class CommandBus {
  execute<TCommand>(command: TCommand): Promise<void>;
}

export interface ICommandHandler<TCommand> {
  execute(command: TCommand): Promise<void>;
}

// 查询系统
export class QueryBus {
  execute<TQuery, TResult>(query: TQuery): Promise<TResult>;
}

export interface IQueryHandler<TQuery, TResult> {
  execute(query: TQuery): Promise<TResult>;
}

// 事件系统
export class EventBus {
  publish<TEvent>(event: TEvent): Promise<void>;
  publishAll<TEvent>(events: TEvent[]): Promise<void>;
}

export interface IEventHandler<TEvent> {
  handle(event: TEvent): Promise<void>;
}
```

### 3.3 Saga 系统

#### Saga 接口

```typescript
/**
 * Saga 接口 - 分布式事务编排
 */
export interface ISaga {
  sagaType: string;
  execute(context: ISagaExecutionContext): Observable<ISagaExecutionContext>;
  compensate(context: ISagaExecutionContext): Observable<ISagaExecutionContext>;
  getStatus(): SagaStatus;
}
```

#### Saga 实现示例

```typescript
export class OrderProcessSaga extends CoreSaga {
  protected defineSteps(): ISagaStep[] {
    return [
      {
        stepId: 'create-order',
        stepName: 'Create Order',
        stepType: SagaStepType.COMMAND,
        order: 1,
        execute: async (ctx) => {
          await this.commandBus.execute(new CreateOrderCommand(...));
        },
        compensate: async (ctx) => {
          await this.commandBus.execute(new CancelOrderCommand(...));
        }
      },
      {
        stepId: 'reserve-inventory',
        stepName: 'Reserve Inventory',
        stepType: SagaStepType.COMMAND,
        order: 2,
        execute: async (ctx) => {
          await this.commandBus.execute(new ReserveInventoryCommand(...));
        },
        compensate: async (ctx) => {
          await this.commandBus.execute(new ReleaseInventoryCommand(...));
        }
      },
      {
        stepId: 'process-payment',
        stepName: 'Process Payment',
        stepType: SagaStepType.COMMAND,
        order: 3,
        execute: async (ctx) => {
          await this.commandBus.execute(new ProcessPaymentCommand(...));
        },
        compensate: async (ctx) => {
          await this.commandBus.execute(new RefundPaymentCommand(...));
        }
      }
    ];
  }
}
```

### 3.4 应用服务

#### 缓存服务

```typescript
/**
 * 应用层缓存服务
 */
export class CacheService {
  async get<T>(key: string): Promise<T | null>;
  async set<T>(key: string, value: T, ttl?: number): Promise<void>;
  async delete(key: string): Promise<void>;
  async clear(): Promise<void>;
}
```

#### 权限服务

```typescript
/**
 * 应用层权限服务
 */
export class PermissionService {
  async checkPermission(userId: string, permission: string): Promise<boolean>;
  async hasRole(userId: string, role: string): Promise<boolean>;
  async getUserPermissions(userId: string): Promise<string[]>;
}
```

---

## 4. CQRS 系统

### 4.1 命令系统详解

#### 命令的生命周期

```
1. 创建命令
   ↓
2. 验证命令
   ↓
3. 执行命令处理器
   ↓
4. 操作聚合根（领域层）
   ↓
5. 发布领域事件
   ↓
6. 保存到事件存储
   ↓
7. 更新读模型（通过事件投影器）
```

#### 命令处理器实现

```typescript
@CommandHandler('UpdateUserEmail')
export class UpdateUserEmailCommandHandler 
  implements ICommandHandler<UpdateUserEmailCommand> {
  
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventStore: IEventStore,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: UpdateUserEmailCommand): Promise<void> {
    // 1. 验证命令
    this.validateCommand(command);
    
    // 2. 从事件存储加载聚合根（事件溯源）
    const events = await this.eventStore.getEvents(command.userId);
    const user = UserAggregate.fromEvents(events);
    
    // 3. 执行业务逻辑（在聚合根内）
    const newEmail = Email.create(command.newEmail);
    user.updateEmail(newEmail);
    
    // 4. 保存新事件到事件存储
    const newEvents = user.getUncommittedEvents();
    await this.eventStore.saveEvents(command.userId, newEvents);
    
    // 5. 发布事件到事件总线
    for (const event of newEvents) {
      await this.eventBus.publish(event);
    }
    
    // 6. 清除未提交事件（基类方法）
    user.clearUncommittedEvents();
  }

  validateCommand(command: UpdateUserEmailCommand): void {
    if (!command.userId) throw new Error('User ID is required');
    if (!command.newEmail) throw new Error('Email is required');
  }

  async canHandle(command: UpdateUserEmailCommand): Promise<boolean> {
    return true;
  }

  getSupportedCommandType(): string {
    return 'UpdateUserEmail';
  }
}
```

### 4.2 查询系统详解

#### 查询的生命周期

```
1. 创建查询
   ↓
2. 验证查询
   ↓
3. 检查缓存
   ↓
4. 执行查询处理器（如果未命中缓存）
   ↓
5. 从读模型获取数据
   ↓
6. 缓存查询结果
   ↓
7. 返回查询结果
```

#### 查询处理器实现

```typescript
@QueryHandler('GetUserById')
export class GetUserByIdQueryHandler 
  implements IQueryHandler<GetUserByIdQuery, UserQueryResult> {
  
  constructor(
    private readonly userReadModel: IUserReadModel,
    private readonly cacheService: CacheService
  ) {}

  async execute(query: GetUserByIdQuery): Promise<UserQueryResult> {
    // 1. 生成缓存键
    const cacheKey = this.generateCacheKey(query);
    
    // 2. 检查缓存
    const cached = await this.cacheService.get<UserDto>(cacheKey);
    if (cached) {
      return new UserQueryResult(cached);
    }
    
    // 3. 从读模型查询
    const user = await this.userReadModel.findById(query.userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // 4. 缓存结果
    await this.cacheService.set(cacheKey, user, this.getCacheExpiration());
    
    // 5. 返回结果
    return new UserQueryResult(user);
  }

  generateCacheKey(query: GetUserByIdQuery): string {
    return `user:${query.userId}`;
  }

  getCacheExpiration(): number {
    return 300; // 5 分钟
  }

  getSupportedQueryType(): string {
    return 'GetUserById';
  }
}
```

### 4.3 事件投影器

#### 定义

事件投影器负责监听领域事件，并更新读模型。

#### 实现示例

```typescript
@EventProjector('UserCreated')
export class UserCreatedProjector extends BaseEventProjector<UserCreatedEvent> {
  constructor(
    private readonly userReadModel: IUserReadModel
  ) {
    super();
  }

  async project(event: UserCreatedEvent): Promise<void> {
    // 更新读模型
    await this.userReadModel.create({
      id: event.userId,
      name: event.userName,
      email: event.userEmail,
      status: 'active',
      createdAt: event.occurredOn,
    });
  }

  getProjectorName(): string {
    return 'UserCreatedProjector';
  }

  getSupportedEventType(): string {
    return 'UserCreated';
  }
}

@EventProjector('UserEmailUpdated')
export class UserEmailUpdatedProjector extends BaseEventProjector<UserEmailUpdatedEvent> {
  constructor(
    private readonly userReadModel: IUserReadModel
  ) {
    super();
  }

  async project(event: UserEmailUpdatedEvent): Promise<void> {
    // 更新读模型的邮箱字段
    await this.userReadModel.update(event.aggregateId.toString(), {
      email: event.newEmail,
      updatedAt: event.occurredOn,
    });
  }

  getProjectorName(): string {
    return 'UserEmailUpdatedProjector';
  }

  getSupportedEventType(): string {
    return 'UserEmailUpdated';
  }
}
```

---

## 5. 用例系统

### 5.1 用例设计原则

#### 原则 1: 单一职责

每个用例只做一件事：

```typescript
// ✅ 好的做法
export class CreateUserUseCase implements IUseCase<CreateUserRequest, CreateUserResponse> {
  // 只负责创建用户
}

export class UpdateUserEmailUseCase implements IUseCase<UpdateUserEmailRequest, void> {
  // 只负责更新邮箱
}

// ❌ 不好的做法
export class UserManagementUseCase implements IUseCase<UserRequest, UserResponse> {
  // 负责创建、更新、删除等多个操作
}
```

#### 原则 2: 编排而非实现

用例编排领域对象，不实现业务逻辑：

```typescript
// ✅ 好的做法
export class CreateOrderUseCase {
  async execute(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    // 1. 创建聚合根（业务逻辑在聚合根内）
    const order = OrderAggregate.create(request.customerId, request.items);
    
    // 2. 保存
    await this.orderRepository.save(order);
    
    // 3. 发布事件
    await this.publishEvents(order);
    
    return new CreateOrderResponse(order.id);
  }
}

// ❌ 不好的做法
export class CreateOrderUseCase {
  async execute(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    // 业务逻辑在用例层（违反充血模型）
    if (request.items.length === 0) {
      throw new Error('Order must have items');
    }
    
    const totalAmount = request.items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
    
    const order = new Order();
    order.customerId = request.customerId;
    order.items = request.items;
    order.totalAmount = totalAmount;
    
    await this.orderRepository.save(order);
  }
}
```

#### 原则 3: 只依赖领域层接口

```typescript
// ✅ 好的做法
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,  // 领域层接口
    private readonly eventBus: IEventBus               // 应用层接口
  ) {}
}

// ❌ 不好的做法
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: PostgresUserRepository,  // 具体实现
    private readonly emailService: NodemailerEmailService    // 具体实现
  ) {}
}
```

### 5.2 用例注册和发现

#### 用例注册表

```typescript
export class UseCaseRegistry implements IUseCaseRegistry {
  private readonly useCases = new Map<string, IUseCase<any, any>>();

  register<TRequest, TResponse>(
    useCaseName: string,
    useCase: IUseCase<TRequest, TResponse>
  ): void {
    this.useCases.set(useCaseName, useCase);
  }

  get<TRequest, TResponse>(
    useCaseName: string
  ): IUseCase<TRequest, TResponse> | undefined {
    return this.useCases.get(useCaseName);
  }

  has(useCaseName: string): boolean {
    return this.useCases.has(useCaseName);
  }

  getRegisteredUseCases(): string[] {
    return Array.from(this.useCases.keys());
  }
}
```

#### 用例装饰器

```typescript
@UseCase('CreateUser')
export class CreateUserUseCase implements IUseCase<CreateUserRequest, CreateUserResponse> {
  // 自动注册到用例注册表
}
```

---

## 6. 实现指南

### 6.1 用例实现模板

```typescript
import { IUseCase } from '@hl8/hybrid-archi';

/**
 * 用例请求对象
 */
export class UseCaseRequest {
  constructor(
    public readonly param1: string,
    public readonly param2: number
  ) {}
}

/**
 * 用例响应对象
 */
export class UseCaseResponse {
  constructor(
    public readonly result: string
  ) {}
}

/**
 * 用例实现
 */
export class UseCaseNameUseCase 
  implements IUseCase<UseCaseRequest, UseCaseResponse> {
  
  constructor(
    private readonly repository: IRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(request: UseCaseRequest): Promise<UseCaseResponse> {
    // 1. 验证输入
    this.validateRequest(request);
    
    // 2. 执行业务逻辑（在领域层）
    const aggregate = AggregateRoot.create(...);
    aggregate.performBusinessAction(...);
    
    // 3. 持久化
    await this.repository.save(aggregate);
    
    // 4. 发布事件
    await this.publishEvents(aggregate);
    
    // 5. 返回结果
    return new UseCaseResponse(aggregate.id.toString());
  }

  private validateRequest(request: UseCaseRequest): void {
    if (!request.param1) {
      throw new Error('Param1 is required');
    }
  }

  private async publishEvents(aggregate: AggregateRoot): Promise<void> {
    const events = aggregate.getUncommittedEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    // 清除未提交事件（基类方法）
    aggregate.clearUncommittedEvents();
  }

  getUseCaseName(): string {
    return 'UseCaseName';
  }

  getUseCaseDescription(): string {
    return '用例描述';
  }
}
```

### 6.2 命令处理器实现模板

```typescript
import { CommandHandler, ICommandHandler } from '@hl8/hybrid-archi';

@CommandHandler('CommandType')
export class CommandTypeHandler implements ICommandHandler<CommandType> {
  constructor(
    private readonly repository: IRepository,
    private readonly eventStore: IEventStore
  ) {}

  async execute(command: CommandType): Promise<void> {
    // 1. 验证
    this.validateCommand(command);
    
    // 2. 加载聚合根
    const aggregate = await this.loadAggregate(command);
    
    // 3. 执行业务逻辑
    aggregate.performAction(command.params);
    
    // 4. 保存
    await this.saveAggregate(aggregate);
  }

  validateCommand(command: CommandType): void {
    // 验证逻辑
  }

  async canHandle(command: CommandType): Promise<boolean> {
    return true;
  }

  getSupportedCommandType(): string {
    return 'CommandType';
  }

  private async loadAggregate(command: CommandType): Promise<AggregateRoot> {
    const events = await this.eventStore.getEvents(command.aggregateId);
    return AggregateRoot.fromEvents(events);
  }

  private async saveAggregate(aggregate: AggregateRoot): Promise<void> {
    const events = aggregate.getUncommittedEvents();
    await this.eventStore.saveEvents(aggregate.id.toString(), events);
    // 清除未提交事件（基类方法）
    aggregate.clearUncommittedEvents();
  }
}
```

### 6.3 查询处理器实现模板

```typescript
import { QueryHandler, IQueryHandler } from '@hl8/hybrid-archi';

@QueryHandler('QueryType')
export class QueryTypeHandler 
  implements IQueryHandler<QueryType, QueryResult> {
  
  constructor(
    private readonly readModel: IReadModel,
    private readonly cacheService: CacheService
  ) {}

  async execute(query: QueryType): Promise<QueryResult> {
    // 1. 验证
    this.validateQuery(query);
    
    // 2. 检查缓存
    const cacheKey = this.generateCacheKey(query);
    const cached = await this.cacheService.get<ResultData>(cacheKey);
    if (cached) {
      return new QueryResult(cached);
    }
    
    // 3. 查询读模型
    const data = await this.readModel.query(query.params);
    
    // 4. 缓存结果
    await this.cacheService.set(cacheKey, data, this.getCacheExpiration());
    
    // 5. 返回结果
    return new QueryResult(data);
  }

  validateQuery(query: QueryType): void {
    // 验证逻辑
  }

  async canHandle(query: QueryType): Promise<boolean> {
    return true;
  }

  getSupportedQueryType(): string {
    return 'QueryType';
  }

  generateCacheKey(query: QueryType): string {
    return `key:${query.param1}:${query.param2}`;
  }

  getCacheExpiration(): number {
    return 300; // 5 分钟
  }
}
```

---

## 7. 最佳实践

### 7.1 用例设计最佳实践

#### ✅ DO - 应该做的

1. **保持用例简单**

   ```typescript
   // ✅ 简单直接
   class CreateUserUseCase {
     async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
       const user = UserAggregate.create(request.name, request.email);
       await this.repository.save(user);
       await this.publishEvents(user);
       return new CreateUserResponse(user.id);
     }
   }
   ```

2. **使用领域语言**

   ```typescript
   // ✅ 使用领域术语
   class ApproveOrderUseCase { }
   class CancelSubscriptionUseCase { }
   
   // ❌ 使用技术术语
   class UpdateOrderStatusUseCase { }
   class DeleteSubscriptionRecordUseCase { }
   ```

3. **一个用例一个事务**

   ```typescript
   class CreateUserUseCase {
     async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
       // 一个事务内完成所有操作
       await this.transactionManager.execute(async () => {
         const user = UserAggregate.create(...);
         await this.repository.save(user);
         await this.publishEvents(user);
       });
     }
   }
   ```

#### ❌ DON'T - 不应该做的

1. **不要在用例中包含业务逻辑**

   ```typescript
   // ❌ 业务逻辑应该在领域层
   class CreateUserUseCase {
     async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
       // 业务验证应该在聚合根内
       if (request.age < 18) {
         throw new Error('User must be 18 or older');
       }
     }
   }
   ```

2. **不要直接操作数据库**

   ```typescript
   // ❌ 应该通过仓储
   class CreateUserUseCase {
     async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
       await this.db.query('INSERT INTO users ...');  // 不要这样
     }
   }
   ```

3. **不要在用例间直接调用**

   ```typescript
   // ❌ 不要直接调用其他用例
   class ComplexUseCase {
     constructor(
       private readonly otherUseCase: OtherUseCase  // 不要这样
     ) {}
   }
   
   // ✅ 使用事件通信
   class ComplexUseCase {
     async execute(request: Request): Promise<Response> {
       // 发布事件，让其他用例响应
       await this.eventBus.publish(new SomethingHappenedEvent(...));
     }
   }
   ```

### 7.2 CQRS 最佳实践

#### ✅ DO - 应该做的

1. **命令和查询完全分离**

   ```typescript
   // ✅ 命令：只写，无返回
   class UpdateUserCommand extends BaseCommand {}
   
   // ✅ 查询：只读，有返回
   class GetUserQuery extends BaseQuery {}
   ```

2. **使用事件实现最终一致性**

   ```typescript
   // ✅ 命令端发布事件
   class CreateOrderCommandHandler {
     async execute(command: CreateOrderCommand): Promise<void> {
       const order = OrderAggregate.create(...);
       await this.repository.save(order);
       await this.eventBus.publish(new OrderCreatedEvent(...));
     }
   }
   
   // ✅ 查询端监听事件更新读模型
   class OrderCreatedProjector {
     async project(event: OrderCreatedEvent): Promise<void> {
       await this.readModel.create(...);
     }
   }
   ```

3. **查询使用专门的读模型**

   ```typescript
   // ✅ 专门的读模型
   interface IOrderReadModel {
     findById(id: string): Promise<OrderDto>;
     searchOrders(criteria: SearchCriteria): Promise<OrderDto[]>;
     getOrderStatistics(): Promise<OrderStatistics>;
   }
   ```

#### ❌ DON'T - 不应该做的

1. **不要让命令返回数据**

   ```typescript
   // ❌ 命令不应该返回业务数据
   async execute(command: CreateUserCommand): Promise<UserDto> {
     // 不要返回 UserDto
   }
   ```

2. **不要让查询修改状态**

   ```typescript
   // ❌ 查询不应该有副作用
   async execute(query: GetUsersQuery): Promise<UsersResult> {
     const users = await this.readModel.getUsers();
     users.forEach(u => u.lastViewed = new Date());  // 修改了状态！
   }
   ```

3. **不要在命令和查询中共享模型**

   ```typescript
   // ❌ 写模型和读模型应该分离
   // 不要让命令和查询都操作同一个数据模型
   ```

---

## 📚 相关文档

- [架构概述](00-overview.md)
- [领域层设计](01-domain-layer.md)
- [CQRS 模式设计](05-cqrs-pattern.md)
- [事件溯源设计](06-event-sourcing.md)

---

**文档维护**: HL8 架构团队  
**最后更新**: 2025-01-27
