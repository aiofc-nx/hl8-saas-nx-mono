# 领域层设计文档

> **文档版本**: 1.0.0  
> **创建日期**: 2025-01-27  

---

## 📋 目录

- [1. 领域层概述](#1-领域层概述)
- [2. 混合架构下的功能组件要求](#2-混合架构下的功能组件要求)
- [3. 核心组件](#3-核心组件)
- [4. 设计原则](#4-设计原则)
- [5. 实现指南](#5-实现指南)
- [6. 最佳实践](#6-最佳实践)

---

## 1. 领域层概述

### 1.1 定义

领域层是混合架构的**核心**，包含所有业务逻辑和业务规则。它独立于技术实现，专注于业务问题的解决。

### 1.2 职责

- ✅ 定义领域模型（实体、聚合根、值对象）
- ✅ 封装业务逻辑和业务规则
- ✅ 发布领域事件
- ✅ 定义仓储接口
- ✅ 定义领域服务接口

### 1.3 特点

- **技术无关**：不依赖任何技术框架
- **业务驱动**：完全基于业务需求
- **高内聚**：业务逻辑高度内聚
- **可测试**：易于进行单元测试

---

## 2. 混合架构下的功能组件要求

### 2.1 概述

在 **Clean Architecture + DDD + CQRS + Event Sourcing + Event-Driven Architecture** 混合架构模式下，领域层不仅要提供传统 DDD 的组件，还需要支持 CQRS、ES、EDA 的特殊要求。

### 2.2 架构模式对领域层的要求

#### 2.2.1 Clean Architecture 要求

```
Clean Architecture 对领域层的要求：
├── ✅ 独立于框架
├── ✅ 独立于数据库
├── ✅ 独立于UI
├── ✅ 只定义接口，不依赖具体实现
└── ✅ 业务逻辑完全在领域层
```

#### 2.2.2 DDD 要求

```
DDD 对领域层的要求：
├── ✅ 实体 (Entities)
│   └── 具有唯一标识、生命周期管理
│
├── ✅ 聚合根 (Aggregate Roots)
│   └── 管理一致性边界、协调内部实体
│
├── ✅ 值对象 (Value Objects)
│   └── 不可变、相等性基于值、封装验证
│
├── ✅ 领域事件 (Domain Events)
│   └── 表示业务变化的事实
│
├── ✅ 领域服务 (Domain Services)
│   └── 跨实体的复杂业务逻辑
│
├── ✅ 仓储接口 (Repository Interfaces)
│   └── 定义数据访问契约
│
└── ✅ 业务规则 (Business Rules)
    └── 封装业务约束和验证
```

#### 2.2.3 CQRS 要求

```
CQRS 对领域层的要求：
├── ✅ 命令对象 (Commands)
│   └── 封装写操作的输入参数
│
├── ✅ 查询对象 (Queries)
│   └── 封装读操作的输入参数
│
├── ✅ 读写模型分离
│   ├── 写模型：聚合根（强一致性）
│   └── 读模型：投影（最终一致性）
│
└── ✅ 领域事件支持
    └── 连接命令端和查询端
```

#### 2.2.4 Event Sourcing 要求

```
Event Sourcing 对领域层的要求：
├── ✅ 事件不可变性
│   └── 事件一旦发布，不可修改
│
├── ✅ 完整的事件流
│   └── 所有状态变更都通过事件记录
│
├── ✅ 状态重建能力
│   └── 聚合根能从事件流重建状态
│   └── 提供 fromEvents() 方法
│   └── 提供 apply() 方法处理事件
│
├── ✅ 事件版本管理
│   └── 支持事件版本控制
│   └── 支持事件演化
│
├── ✅ 快照支持
│   └── 提供 toSnapshot() 方法
│   └── 提供 fromSnapshot() 方法
│
└── ✅ 事件元数据
    ├── eventId (事件唯一标识)
    ├── aggregateId (聚合根ID)
    ├── aggregateVersion (聚合版本)
    ├── occurredOn (发生时间)
    └── metadata (元数据)
```

#### 2.2.5 Event-Driven Architecture 要求

```
Event-Driven Architecture 对领域层的要求：
├── ✅ 领域事件定义
│   └── 清晰的事件类型和数据结构
│
├── ✅ 事件发布机制
│   └── 聚合根收集未提交事件
│   └── 提供 getUncommittedEvents() 方法
│
├── ✅ 事件包含完整信息
│   └── 事件携带足够信息供订阅者使用
│
├── ✅ 事件命名规范
│   └── 使用过去式动词（UserCreated、OrderConfirmed）
│
└── ✅ 事件幂等性设计
    └── 同一事件多次处理产生相同结果
```

### 2.3 领域层功能组件完整清单

基于混合架构的要求，领域层必须提供以下功能组件：

#### 必需组件 (Must Have)

| 组件 | 用途 | 支持的模式 |
|------|------|-----------|
| **BaseEntity** | 基础实体类 | Clean Architecture, DDD |
| **BaseAggregateRoot** | 基础聚合根类 | DDD, CQRS, ES, EDA |
| **BaseValueObject** | 基础值对象类 | DDD |
| **BaseDomainEvent** | 基础领域事件类 | DDD, CQRS, ES, EDA |
| **IRepository** | 仓储接口 | Clean Architecture, DDD |
| **IDomainService** | 领域服务接口 | DDD |

#### CQRS 特定组件

| 组件 | 用途 | 说明 |
|------|------|------|
| **Command 对象** | 命令定义 | 封装写操作参数 |
| **Query 对象** | 查询定义 | 封装读操作参数 |
| **读模型接口** | 查询数据访问 | 定义查询端数据访问契约 |

#### Event Sourcing 特定组件

| 组件 | 用途 | 说明 |
|------|------|------|
| **事件流管理** | 事件序列管理 | 在聚合根中实现 |
| **状态重建方法** | fromEvents() | 从事件流重建聚合状态 |
| **事件应用方法** | apply() | 应用单个事件到聚合 |
| **快照方法** | toSnapshot() / fromSnapshot() | 性能优化 |
| **版本控制** | version 属性 | 乐观锁和事件版本 |

#### Event-Driven Architecture 特定组件

| 组件 | 用途 | 说明 |
|------|------|------|
| **事件收集器** | getUncommittedEvents() | 收集未提交的事件 |
| **事件提交标记** | markEventsAsCommitted() | 标记事件已提交 |
| **事件元数据** | eventId, aggregateId, version | 事件追踪和管理 |
| **事件数据封装** | eventData 属性 | 完整的事件数据 |

### 2.4 领域层组件关系图

```
┌─────────────────────────────────────────────────────────────┐
│                   领域层功能组件关系                          │
└─────────────────────────────────────────────────────────────┘

                    BaseAggregateRoot
                    (核心组件)
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   BaseEntity      BaseDomainEvent    BaseValueObject
   (实体基类)       (领域事件)         (值对象)
        │                 │                 
        │                 │                 
支持 DDD 充血模型   支持 ES + EDA      支持 DDD 不可变性
        │                 │
        │                 │
        ▼                 ▼
   业务逻辑封装      事件流管理
   生命周期管理      状态重建
   审计信息          版本控制
                    快照机制

┌─────────────────────────────────────────────────────────────┐
│  CQRS 支持组件                                               │
├─────────────────────────────────────────────────────────────┤
│  Commands (写)  │  Queries (读)  │  Events (异步)           │
│  ↓              │  ↓             │  ↓                      │
│  CommandHandler │  QueryHandler  │  EventHandler           │
│  ↓              │  ↓             │  ↓                      │
│  AggregateRoot  │  ReadModel     │  Projector              │
└─────────────────────────────────────────────────────────────┘
```

### 2.5 功能组件实现检查清单

在开发领域层时，确保实现以下功能组件：

#### ✅ DDD 基础组件

- [ ] 实体类继承 `BaseEntity`
- [ ] 聚合根类继承 `BaseAggregateRoot`
- [ ] 值对象类继承 `BaseValueObject`
- [ ] 领域事件类继承 `BaseDomainEvent`
- [ ] 定义仓储接口 `IXxxRepository`
- [ ] 定义领域服务接口 `IXxxDomainService`

#### ✅ CQRS 支持组件

- [ ] 定义命令对象（继承 `BaseCommand`）
- [ ] 定义查询对象（继承 `BaseQuery`）
- [ ] 聚合根支持命令处理
- [ ] 定义读模型接口

#### ✅ Event Sourcing 支持组件

- [ ] 聚合根实现 `fromEvents(events: DomainEvent[])`
- [ ] 聚合根实现 `apply(event: DomainEvent)`
- [ ] 聚合根实现 `toSnapshot()`
- [ ] 聚合根实现 `fromSnapshot(snapshot, events)`
- [ ] 聚合根维护版本号 `version`
- [ ] 所有状态变更都发布事件

#### ✅ Event-Driven Architecture 支持组件

- [ ] 聚合根实现 `addDomainEvent(event)`
- [ ] 聚合根实现 `getUncommittedEvents()`
- [ ] 聚合根实现 `markEventsAsCommitted()`
- [ ] 事件包含完整的业务数据
- [ ] 事件命名使用过去式
- [ ] 事件设计支持幂等性处理

### 2.6 实际代码示例

#### 完整的聚合根实现（支持所有模式）

```typescript
/**
 * 用户聚合根 - 支持 DDD + CQRS + ES + EDA
 */
export class UserAggregate extends BaseAggregateRoot {
  // ==================== DDD 组件 ====================
  private _user: User;  // 内部实体
  
  // ==================== ES 组件 ====================
  private _version: number = 0;  // 版本控制
  private _uncommittedEvents: BaseDomainEvent[] = [];  // 未提交事件
  
  // ==================== 构造函数 ====================
  private constructor(
    id: EntityId,
    user: User,
    auditInfo: IPartialAuditInfo
  ) {
    super(id, auditInfo);
    this._user = user;
  }

  // ==================== DDD: 工厂方法 ====================
  static create(name: string, email: Email, tenantId: string): UserAggregate {
    const user = User.create(name, email, tenantId);
    const aggregate = new UserAggregate(
      user.id,
      user,
      { createdBy: 'system', tenantId }
    );
    
    // EDA: 发布领域事件
    aggregate.addDomainEvent(
      new UserCreatedEvent(
        aggregate.id,
        aggregate.version,
        tenantId,
        user.id.toString(),
        user.name,
        user.email.value
      )
    );
    
    return aggregate;
  }

  // ==================== CQRS: 命令处理 ====================
  updateEmail(newEmail: Email): void {
    // DDD: 业务逻辑在聚合根内
    this._user.updateEmail(newEmail);
    
    // EDA: 发布领域事件
    this.addDomainEvent(
      new UserEmailUpdatedEvent(
        this.id,
        this.version,
        this.tenantId,
        newEmail.value
      )
    );
    
    // ES: 版本递增
    this.incrementVersion();
  }

  // ==================== ES: 从事件流重建状态 ====================
  static fromEvents(events: DomainEvent[]): UserAggregate {
    if (events.length === 0) {
      throw new Error('Cannot rebuild from empty event stream');
    }

    // 获取第一个事件（创建事件）
    const firstEvent = events[0] as UserCreatedEvent;
    const email = Email.create(firstEvent.userEmail);
    const user = User.create(firstEvent.userName, email, firstEvent.tenantId);
    
    const aggregate = new UserAggregate(
      EntityId.fromString(firstEvent.aggregateId.toString()),
      user,
      { createdBy: 'system', tenantId: firstEvent.tenantId }
    );
    
    // 应用所有事件
    events.forEach(event => aggregate.apply(event));
    
    return aggregate;
  }

  // ==================== ES: 应用事件 ====================
  private apply(event: DomainEvent): void {
    switch (event.eventType) {
      case 'UserCreated':
        // 创建事件已在构造时处理
        break;
      case 'UserEmailUpdated':
        this.applyUserEmailUpdated(event as UserEmailUpdatedEvent);
        break;
      case 'UserActivated':
        this.applyUserActivated(event as UserActivatedEvent);
        break;
      default:
        throw new Error(`Unknown event type: ${event.eventType}`);
    }
    
    // ES: 更新版本
    this._version = event.version;
  }

  private applyUserEmailUpdated(event: UserEmailUpdatedEvent): void {
    const newEmail = Email.create(event.newEmail);
    this._user.updateEmail(newEmail);
  }

  private applyUserActivated(event: UserActivatedEvent): void {
    this._user.activate();
  }

  // ==================== ES: 快照支持 ====================
  toSnapshot(): IAggregateSnapshot {
    return {
      aggregateId: this.id.toString(),
      aggregateType: 'User',
      version: this.version,
      state: {
        name: this._user.name,
        email: this._user.email.value,
        status: this._user.status,
        tenantId: this.tenantId,
      },
      createdAt: new Date(),
    };
  }

  static fromSnapshot(
    snapshot: IAggregateSnapshot,
    eventsSinceSnapshot: DomainEvent[]
  ): UserAggregate {
    // 1. 从快照恢复
    const state = snapshot.state;
    const email = Email.create(state.email as string);
    const user = User.create(state.name as string, email, state.tenantId as string);
    
    const aggregate = new UserAggregate(
      EntityId.fromString(snapshot.aggregateId),
      user,
      { createdBy: 'system', tenantId: state.tenantId as string }
    );
    
    aggregate._version = snapshot.version;
    
    // 2. 应用快照后的事件
    eventsSinceSnapshot.forEach(event => aggregate.apply(event));
    
    return aggregate;
  }

  // ==================== EDA: 事件管理 ====================
  getUncommittedEvents(): readonly BaseDomainEvent[] {
    return [...this._uncommittedEvents];
  }

  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  // ==================== Getters ====================
  get user(): User {
    return this._user;
  }

  get version(): number {
    return this._version;
  }
}
```

### 2.7 功能组件依赖关系

```
┌─────────────────────────────────────────────────────────────┐
│           领域层组件在混合架构中的作用                         │
└─────────────────────────────────────────────────────────────┘

BaseAggregateRoot (核心组件)
├── 支持 DDD
│   ├── 管理一致性边界
│   ├── 协调内部实体
│   └── 封装业务规则
│
├── 支持 CQRS
│   ├── 处理命令（写操作）
│   ├── 发布事件（连接读写）
│   └── 版本控制（并发控制）
│
├── 支持 Event Sourcing
│   ├── fromEvents() - 状态重建
│   ├── apply() - 事件应用
│   ├── toSnapshot() - 快照创建
│   ├── fromSnapshot() - 快照恢复
│   └── version - 版本管理
│
└── 支持 Event-Driven Architecture
    ├── addDomainEvent() - 添加事件
    ├── getUncommittedEvents() - 获取事件
    ├── markEventsAsCommitted() - 标记已提交
    └── 事件包含完整业务数据
```

---

## 3. 核心组件

### 3.1 BaseEntity - 基础实体

#### 定义

实体是具有唯一标识符和生命周期的领域对象。

#### 特性

```typescript
export abstract class BaseEntity {
  // 唯一标识符
  private readonly _id: EntityId;
  
  // 审计信息
  private readonly _auditInfo: IAuditInfo;
  
  // 相等性基于 ID
  equals(other: BaseEntity): boolean {
    return this._id.equals(other._id);
  }
}
```

#### 使用场景

- 需要跟踪对象生命周期
- 对象有唯一标识
- 对象状态会变化
- 需要审计追踪

#### 示例

```typescript
export class Product extends BaseEntity {
  private constructor(
    id: EntityId,
    private _name: string,
    private _price: Money,
    private _status: ProductStatus,
    auditInfo: IPartialAuditInfo
  ) {
    super(id, auditInfo);
  }
  
  // 业务方法
  updatePrice(newPrice: Money): void {
    this.ensureActive();
    this._price = newPrice;
    this.updateTimestamp();
  }
  
  deactivate(): void {
    this._status = ProductStatus.Inactive;
  }
}
```

### 3.2 BaseAggregateRoot - 基础聚合根

#### 定义

聚合根是聚合的入口点，负责维护聚合内部的一致性边界。

#### 特性

BaseAggregateRoot 继承自 BaseEntity，并添加了领域事件管理和事件溯源支持。

#### 事件管理方法实现策略

BaseAggregateRoot 的方法分为两类：**基类提供的方法**和**推荐业务实现的方法**。

##### 基类提供的方法（开箱即用）✅

基类提供了完整的事件管理能力，业务聚合根可以直接使用：

```typescript
export abstract class BaseAggregateRoot extends BaseEntity {
  // ✅ 核心事件管理方法（基类已实现）
  addDomainEvent(event: BaseDomainEvent): void;
  get domainEvents(): readonly BaseDomainEvent[];
  get uncommittedEvents(): readonly BaseDomainEvent[];
  getUncommittedEvents(): BaseDomainEvent[];
  clearDomainEvents(): void;
  clearUncommittedEvents(): void;
  clearEvents(): void;
  
  // ✅ 事件查询方法（基类已实现）
  hasUncommittedEvents(): boolean;
  hasDomainEvents(): boolean;
  getEventsOfType(eventType: string): BaseDomainEvent[];
  getUncommittedEventsOfType(eventType: string): BaseDomainEvent[];
  
  // ✅ 版本控制（基类已实现）
  get version(): number;
  incrementVersion(): void;
  
  // ✅ 语义化别名方法（基类已实现）
  markEventsAsCommitted(): void;  // clearUncommittedEvents() 的别名
}
```

##### 基类提供的方法详细说明

**核心事件管理方法**：

| 方法 | 说明 | 使用场景 |
|------|------|---------|
| `addDomainEvent(event)` | 添加领域事件到聚合根 | 聚合状态变更时调用 |
| `get domainEvents` | 获取所有领域事件（只读） | 查看聚合产生的所有事件 |
| `get uncommittedEvents` | 获取未提交事件（只读） | 查看待发布的事件 |
| `getUncommittedEvents()` | 获取未提交事件（可变数组） | 发布事件前获取事件列表 |
| `clearDomainEvents()` | 清除所有领域事件 | 重置聚合事件状态 |
| `clearUncommittedEvents()` | 清除未提交事件 | 事件发布后清理 |
| `clearEvents()` | 清除未提交事件（别名） | 同 clearUncommittedEvents() |
| `markEventsAsCommitted()` | 标记事件为已提交（语义化别名） | 事件发布后调用，语义更清晰 |

**事件查询方法**：

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `hasUncommittedEvents()` | 检查是否有未提交事件 | boolean |
| `hasDomainEvents()` | 检查是否有领域事件 | boolean |
| `getEventsOfType(eventType)` | 获取特定类型的领域事件 | BaseDomainEvent[] |
| `getUncommittedEventsOfType(eventType)` | 获取特定类型的未提交事件 | BaseDomainEvent[] |

**版本控制方法**：

| 方法 | 说明 | 使用场景 |
|------|------|---------|
| `get version` | 获取聚合根版本号 | 实现乐观锁 |
| `incrementVersion()` | 递增版本号 | 每次状态变更后调用 |

**方法使用示例**：

```typescript
// 添加事件
aggregate.addDomainEvent(new UserCreatedEvent(...));

// 检查是否有未提交事件
if (aggregate.hasUncommittedEvents()) {
  const events = aggregate.getUncommittedEvents();
  await eventBus.publishAll(events);
  aggregate.markEventsAsCommitted(); // 语义化方法
}

// 获取特定类型事件
const userEvents = aggregate.getEventsOfType('UserCreatedEvent');

// 版本控制
const currentVersion = aggregate.version;
aggregate.incrementVersion(); // 版本号 +1
```

##### 业务聚合根推荐实现的方法 📝

以下方法是 **Event Sourcing 推荐的实现模式**，业务聚合根应根据需要实现：

```typescript
// 📝 推荐实现：从事件流重建聚合根
static fromEvents(events: DomainEvent[]): UserAggregate {
  const aggregate = new UserAggregate(...);
  events.forEach(event => aggregate.apply(event));
  return aggregate;
}

// 📝 推荐实现：应用单个事件到聚合根
private apply(event: DomainEvent): void {
  switch (event.constructor.name) {
    case 'UserCreatedEvent':
      this.handleUserCreated(event as UserCreatedEvent);
      break;
    case 'UserActivatedEvent':
      this.handleUserActivated(event as UserActivatedEvent);
      break;
    // ... 其他事件类型
  }
}

// 📝 推荐实现：创建聚合快照
toSnapshot(): IAggregateSnapshot {
  return {
    aggregateId: this.id.toString(),
    aggregateType: 'User',
    version: this.version,
    state: {
      name: this._name,
      email: this._email,
      status: this._status
    },
    timestamp: new Date()
  };
}

// 📝 推荐实现：从快照恢复聚合根
static fromSnapshot(
  snapshot: IAggregateSnapshot,
  events: DomainEvent[]
): UserAggregate {
  const aggregate = new UserAggregate(
    EntityId.fromString(snapshot.aggregateId),
    snapshot.state.name,
    snapshot.state.email,
    snapshot.state.status
  );
  aggregate.setVersion(snapshot.version);
  
  // 应用快照之后的事件
  events.forEach(event => aggregate.apply(event));
  
  return aggregate;
}
```

##### 为什么不在基类中强制实现 ES 方法？

1. **灵活性** - 不是所有聚合根都需要事件溯源，保持基类简单
2. **差异性** - 每个聚合根的事件应用逻辑（apply）完全不同
3. **快照多样性** - 每个聚合根的快照结构（toSnapshot）各不相同
4. **可选特性** - Event Sourcing 是可选的架构模式，不是强制要求

##### 完整的聚合根事件管理示例

```typescript
export class UserAggregate extends BaseAggregateRoot {
  private constructor(
    id: EntityId,
    private _name: string,
    private _email: Email,
    private _status: UserStatus,
    auditInfo: IPartialAuditInfo
  ) {
    super(id, auditInfo);
  }
  
  // ✅ 使用基类提供的方法
  static create(name: string, email: Email): UserAggregate {
    const user = new UserAggregate(
      EntityId.generate(),
      name,
      email,
      UserStatus.Active,
      { createdBy: 'system' }
    );
    
    // 使用基类的 addDomainEvent 方法
    user.addDomainEvent(new UserCreatedEvent(user.id, name, email));
    
    return user;
  }
  
  // ✅ 使用基类提供的方法
  activate(): void {
    this._status = UserStatus.Active;
    this.addDomainEvent(new UserActivatedEvent(this.id));
  }
  
  // 📝 推荐实现：Event Sourcing 支持
  static fromEvents(events: DomainEvent[]): UserAggregate {
    // 从第一个事件创建聚合
    const createdEvent = events[0] as UserCreatedEvent;
    const user = new UserAggregate(
      createdEvent.aggregateId,
      createdEvent.name,
      createdEvent.email,
      UserStatus.Pending,
      { createdAt: createdEvent.occurredOn }
    );
    
    // 应用后续事件
    events.slice(1).forEach(event => user.apply(event));
    
    return user;
  }
  
  // 📝 推荐实现：应用事件
  private apply(event: DomainEvent): void {
    if (event instanceof UserActivatedEvent) {
      this._status = UserStatus.Active;
    } else if (event instanceof UserDeactivatedEvent) {
      this._status = UserStatus.Inactive;
    }
    // ... 其他事件类型
  }
  
  // 📝 推荐实现：创建快照
  toSnapshot(): IAggregateSnapshot {
    return {
      aggregateId: this.id.toString(),
      aggregateType: 'User',
      version: this.version,
      state: {
        name: this._name,
        email: this._email.value,
        status: this._status
      },
      timestamp: new Date()
    };
  }
}
```

#### 聚合设计原则

##### 1. 小聚合原则

聚合应该尽可能小，只包含真正需要强一致性的对象：

```typescript
// ✅ 好的做法：小聚合
class OrderAggregate extends BaseAggregateRoot {
  private _items: OrderItem[] = [];  // 只管理订单项
  private _totalAmount: Money;
}

// ❌ 不好的做法：大聚合
class OrderAggregate extends BaseAggregateRoot {
  private _items: OrderItem[] = [];
  private _customer: Customer;        // 不应该包含
  private _products: Product[];       // 不应该包含
  private _payments: Payment[];       // 不应该包含
}
```

##### 2. 通过 ID 引用其他聚合

```typescript
// ✅ 好的做法
class OrderAggregate extends BaseAggregateRoot {
  private _customerId: EntityId;  // 通过 ID 引用
}

// ❌ 不好的做法
class OrderAggregate extends BaseAggregateRoot {
  private _customer: CustomerAggregate;  // 直接引用
}
```

##### 3. 使用事件实现最终一致性

```typescript
// 跨聚合操作使用事件
class OrderAggregate extends BaseAggregateRoot {
  confirm(): void {
    this._status = OrderStatus.Confirmed;
    // 发布事件，让库存聚合处理
    this.addDomainEvent(new OrderConfirmedEvent(this.id, this._items));
  }
}

// 库存聚合监听事件
class InventoryEventHandler {
  @EventHandler('OrderConfirmed')
  async handle(event: OrderConfirmedEvent): Promise<void> {
    // 减少库存
    await this.inventoryService.reduceStock(event.items);
  }
}
```

### 3.3 BaseValueObject - 基础值对象

#### 定义

值对象是没有概念标识的不可变对象，相等性基于属性值。

#### 特性

```typescript
export abstract class BaseValueObject {
  // 相等性基于值
  equals(other: BaseValueObject): boolean;
  
  // 不可变性
  clone(): BaseValueObject {
    return this;  // 值对象不可变，直接返回自身
  }
  
  // 验证逻辑
  protected abstract validate(): void;
}
```

#### 设计原则

##### 1. 不可变性

```typescript
// ✅ 好的做法：不可变
class Money extends BaseValueObject {
  private constructor(
    private readonly _amount: number,
    private readonly _currency: string
  ) {
    super();
  }
  
  add(other: Money): Money {
    return new Money(this._amount + other._amount, this._currency);
  }
}

// ❌ 不好的做法：可变
class Money extends BaseValueObject {
  private _amount: number;
  
  setAmount(amount: number): void {
    this._amount = amount;
  }
}
```

##### 2. 自包含验证

```typescript
class Email extends BaseValueObject {
  private constructor(private readonly _value: string) {
    super();
    this.validate();  // 构造时自动验证
  }
  
  protected validate(): void {
    if (!this._value.includes('@')) {
      throw new Error('Invalid email format');
    }
  }
}
```

### 3.4 BaseDomainEvent - 基础领域事件

#### 定义

领域事件表示领域内发生的重要业务变化。

#### 特性

```typescript
export abstract class BaseDomainEvent {
  protected constructor(
    private readonly _aggregateId: EntityId,
    private readonly _aggregateVersion: number,
    private readonly _tenantId: string
  ) {
    this._eventId = EntityId.generate();
    this._occurredOn = new Date();
  }
  
  // 事件元数据
  get eventId(): EntityId;
  get eventType(): string;
  get aggregateId(): EntityId;
  get version(): number;
  get occurredOn(): Date;
}
```

#### 事件设计原则

##### 1. 事件命名

使用过去式动词，表示已经发生的事实：

```typescript
// ✅ 好的命名
class UserCreatedEvent extends BaseDomainEvent {}
class OrderConfirmedEvent extends BaseDomainEvent {}
class PaymentProcessedEvent extends BaseDomainEvent {}

// ❌ 不好的命名
class CreateUserEvent extends BaseDomainEvent {}
class ConfirmOrder extends BaseDomainEvent {}
```

##### 2. 事件不可变

```typescript
class UserCreatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string,
    public readonly userId: string,     // readonly
    public readonly userName: string,   // readonly
    public readonly userEmail: string   // readonly
  ) {
    super(aggregateId, aggregateVersion, tenantId);
  }
}
```

##### 3. 事件包含完整信息

```typescript
// ✅ 好的做法：包含完整信息
class OrderConfirmedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    version: number,
    tenantId: string,
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly items: OrderItemDto[],      // 完整信息
    public readonly totalAmount: MoneyDto,      // 完整信息
    public readonly confirmedBy: string
  ) {
    super(aggregateId, version, tenantId);
  }
}
```

---

## 4. 设计原则

### 4.1 充血模型原则

业务逻辑必须在领域对象内，不在服务层：

```typescript
// ✅ 好的做法：充血模型
class Order extends BaseEntity {
  addItem(product: Product, quantity: number): void {
    // 验证业务规则
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    if (this.status !== OrderStatus.Draft) {
      throw new Error('Can only add items to draft orders');
    }
    
    // 执行业务逻辑
    const item = OrderItem.create(product.id, quantity, product.price);
    this._items.push(item);
    this.updateTotalAmount();
  }
}

// ❌ 不好的做法：贫血模型
class Order {
  items: OrderItem[] = [];
  status: OrderStatus;
}

class OrderService {
  addItem(order: Order, product: Product, quantity: number): void {
    // 业务逻辑在服务层，这是贫血模型！
    if (quantity <= 0) throw new Error('...');
    const item = new OrderItem(...);
    order.items.push(item);
  }
}
```

### 4.2 实体与聚合根分离原则

实体作为聚合根的内部实体，不能直接暴露给外部：

```typescript
// 聚合根：管理一致性边界
export class OrderAggregate extends BaseAggregateRoot {
  private _items: OrderItem[] = [];  // 内部实体
  
  // 通过聚合根方法操作内部实体
  addItem(productId: string, quantity: number, price: Money): void {
    const item = OrderItem.create(productId, quantity, price);
    this._items.push(item);
    this.updateTotalAmount();
    this.addDomainEvent(new OrderItemAddedEvent(...));
  }
  
  // 不直接暴露内部实体
  getItems(): readonly OrderItem[] {
    return [...this._items];  // 返回副本
  }
}

// 实体：执行具体操作
export class OrderItem extends BaseEntity {
  updateQuantity(newQuantity: number): void {
    if (newQuantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    this._quantity = newQuantity;
    this._totalPrice = this._unitPrice.multiply(newQuantity);
  }
}
```

### 4.3 值对象使用原则

优先使用值对象而不是基本类型：

```typescript
// ✅ 好的做法：使用值对象
class Product extends BaseEntity {
  private _price: Money;        // 值对象
  private _name: ProductName;   // 值对象
  
  updatePrice(newPrice: Money): void {
    this._price = newPrice;
  }
}

// ❌ 不好的做法：使用基本类型
class Product extends BaseEntity {
  private _price: number;       // 基本类型
  private _currency: string;    // 分散的属性
}
```

---

## 5. 实现指南

### 5.1 实体实现模板

```typescript
import { BaseEntity, EntityId } from '@hl8/hybrid-archi';

export class EntityName extends BaseEntity {
  // 1. 私有属性
  private constructor(
    id: EntityId,
    private _property: PropertyType,
    private _status: StatusType,
    auditInfo: IPartialAuditInfo
  ) {
    super(id, auditInfo);
    this.validate();
  }
  
  // 2. 工厂方法
  static create(...params): EntityName {
    const entity = new EntityName(...);
    return entity;
  }
  
  // 3. 业务方法
  businessMethod(): void {
    this.ensureBusinessRule();
    // 执行业务逻辑
    this.updateTimestamp();
  }
  
  // 4. 业务规则验证
  private ensureBusinessRule(): void {
    if (!this.isValid()) {
      throw new Error('Business rule violation');
    }
  }
  
  // 5. 数据验证
  private validate(): void {
    if (!this._property) {
      throw new Error('Property is required');
    }
  }
  
  // 6. Getter 方法
  get property(): PropertyType {
    return this._property;
  }
}
```

### 5.2 聚合根实现模板

```typescript
import { BaseAggregateRoot, EntityId } from '@hl8/hybrid-archi';

export class AggregateNameAggregate extends BaseAggregateRoot {
  // 1. 内部实体
  private _entities: Entity[] = [];
  
  // 2. 私有构造函数
  private constructor(
    id: EntityId,
    private _property: PropertyType,
    auditInfo: IPartialAuditInfo
  ) {
    super(id, auditInfo);
  }
  
  // 3. 工厂方法 + 领域事件
  static create(...params): AggregateNameAggregate {
    const aggregate = new AggregateNameAggregate(...);
    aggregate.addDomainEvent(new AggregateCreatedEvent(...));
    return aggregate;
  }
  
  // 4. 业务方法：协调内部实体
  performBusinessAction(...params): void {
    this.ensureBusinessRules();
    
    // 操作内部实体
    this._entities.forEach(entity => {
      entity.doSomething();
    });
    
    // 发布事件
    this.addDomainEvent(new BusinessActionPerformedEvent(...));
  }
  
  // 5. 事件溯源支持
  static fromEvents(events: DomainEvent[]): AggregateNameAggregate {
    const aggregate = new AggregateNameAggregate(...);
    events.forEach(event => aggregate.apply(event));
    return aggregate;
  }
  
  private apply(event: DomainEvent): void {
    switch (event.type) {
      case 'AggregateCreated':
        this.applyAggregateCreated(event);
        break;
      // ... 其他事件
    }
  }
}
```

### 5.3 值对象实现模板

```typescript
import { BaseValueObject } from '@hl8/hybrid-archi';

export class ValueObjectName extends BaseValueObject {
  // 1. 私有只读属性
  private constructor(
    private readonly _value: ValueType
  ) {
    super();
    this.validate();
  }
  
  // 2. 工厂方法
  static create(value: ValueType): ValueObjectName {
    return new ValueObjectName(value);
  }
  
  // 3. Getter
  get value(): ValueType {
    return this._value;
  }
  
  // 4. 验证逻辑
  protected validate(): void {
    if (!this.isValid()) {
      throw new Error('Validation failed');
    }
  }
  
  // 5. 相等性比较
  equals(other: ValueObjectName | null | undefined): boolean {
    if (!super.equals(other)) return false;
    return this._value === (other as ValueObjectName)._value;
  }
  
  // 6. 业务操作（返回新对象）
  transform(): ValueObjectName {
    const newValue = this.calculateNewValue();
    return new ValueObjectName(newValue);
  }
}
```

---

## 6. 最佳实践

### 6.1 实体设计最佳实践

#### ✅ DO - 应该做的

1. **使用充血模型**

   ```typescript
   class User extends BaseEntity {
     activate(): void {  // 业务逻辑在实体内
       this._status = UserStatus.Active;
     }
   }
   ```

2. **使用私有属性**

   ```typescript
   class User extends BaseEntity {
     private _email: Email;  // 私有属性
     
     get email(): Email {    // 公开 getter
       return this._email;
     }
   }
   ```

3. **发布领域事件**

   ```typescript
   class User extends BaseEntity {
     activate(): void {
       this._status = UserStatus.Active;
       this.addDomainEvent(new UserActivatedEvent(this.id));
     }
   }
   ```

#### ❌ DON'T - 不应该做的

1. **不要使用 setter**

   ```typescript
   // ❌ 不要这样
   class User extends BaseEntity {
     set email(value: Email) {
       this._email = value;
     }
   }
   ```

2. **不要在实体中依赖仓储**

   ```typescript
   // ❌ 不要这样
   class User extends BaseEntity {
     constructor(private userRepository: IUserRepository) {}
   }
   ```

3. **不要在实体中包含技术细节**

   ```typescript
   // ❌ 不要这样
   class User extends BaseEntity {
     async saveToDatabase(): Promise<void> {}
   }
   ```

### 6.2 聚合根设计最佳实践

#### ✅ DO - 应该做的

1. **保持小聚合**
2. **通过 ID 引用其他聚合**
3. **使用事件实现跨聚合通信**
4. **管理一致性边界**
5. **支持事件溯源**

#### ❌ DON'T - 不应该做的

1. **不要创建大聚合**
2. **不要直接引用其他聚合**
3. **不要在聚合间进行同步调用**
4. **不要暴露内部实体**
5. **不要绕过聚合根直接操作内部实体**

---

## 📚 相关文档

- [架构概述](00-overview.md)
- [应用层设计](02-application-layer.md)
- [CQRS 模式设计](05-cqrs-pattern.md)
- [事件溯源设计](06-event-sourcing.md)

---

**文档维护**: HL8 架构团队  
**最后更新**: 2025-01-27
