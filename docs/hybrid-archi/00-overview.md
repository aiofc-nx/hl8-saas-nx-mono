# hybrid-archi 架构概述

> **文档版本**: 1.0.0  
> **创建日期**: 2025-01-27  
> **文档类型**: 架构设计文档  

---

## 📋 目录

- [1. 模块定位](#1-模块定位)
- [2. 架构愿景](#2-架构愿景)
- [3. 混合架构模式](#3-混合架构模式)
- [4. 架构分层](#4-架构分层)
- [5. 核心组件](#5-核心组件)
- [6. 设计原则](#6-设计原则)
- [7. 技术栈](#7-技术栈)
- [8. 架构图](#8-架构图)

---

## 1. 模块定位

### 1.1 核心定位

> 🎯 **hybrid-archi 是整个 HL8 SAAS 平台的架构基石**

`hybrid-archi` 是 HL8 SAAS 平台的**核心架构基础模块**，为整个平台提供统一的架构设计模式和完整的通用功能组件。

### 1.2 核心目标

#### 目标 1: 统一架构模式

为所有业务模块提供统一的混合架构设计模式，确保：

- ✅ 架构一致性：所有模块使用相同的架构风格
- ✅ 开发效率：统一模式降低学习曲线
- ✅ 代码质量：统一规范提升代码质量
- ✅ 可维护性：一致的结构便于维护

#### 目标 2: 提供通用功能组件

提供混合架构开发所需的完整通用功能组件：

- ✅ **领域层组件**：BaseEntity、BaseAggregateRoot、BaseValueObject、BaseDomainEvent
- ✅ **应用层组件**：CommandBus、QueryBus、EventBus、IUseCase
- ✅ **基础设施组件**：仓储适配器、事件存储、端口适配器
- ✅ **接口层组件**：BaseController、守卫、装饰器、中间件

#### 目标 3: 作为业务模块基础

所有业务模块必须基于 hybrid-archi 开发：

- ✅ 业务模块直接继承和使用 hybrid-archi 的基础组件
- ✅ 业务模块遵循 hybrid-archi 定义的架构模式
- ✅ 业务模块复用 hybrid-archi 的通用功能
- ✅ 业务模块不偏离 hybrid-archi 的架构设计

### 1.3 模块职责

```
hybrid-archi 职责范围
├── 1. 定义架构模式
│   ├── Clean Architecture 分层
│   ├── DDD 充血模型
│   ├── CQRS 命令查询分离
│   ├── Event Sourcing 事件溯源
│   └── Event-Driven Architecture 事件驱动
│
├── 2. 提供基础组件
│   ├── 领域层：实体、聚合根、值对象、事件
│   ├── 应用层：用例、CQRS总线、服务
│   ├── 基础设施层：适配器、工厂、事件存储
│   └── 接口层：控制器、守卫、装饰器
│
├── 3. 集成基础设施
│   ├── 多租户（@hl8/multi-tenancy）
│   ├── 缓存（@hl8/cache）
│   ├── 日志（@hl8/logger）
│   ├── 配置（@hl8/config）
│   ├── 数据库（@hl8/database）
│   ├── 消息（@hl8/messaging）
│   ├── Web框架（@hl8/fastify-pro）
│   └── 通用工具（@hl8/common、@hl8/utils）
│
└── 4. 定义开发规范
    ├── 代码规范
    ├── 测试规范
    ├── 注释规范
    └── 架构规范
```

---

## 2. 架构愿景

### 2.1 愿景声明

> **构建一个高质量、高可维护、高可扩展的企业级 SAAS 平台架构基础**

### 2.2 架构目标

#### 目标 1: 高内聚、低耦合

- 清晰的分层架构
- 明确的依赖方向
- 接口隔离原则
- 依赖倒置原则

#### 目标 2: 业务驱动

- 充血模型设计
- 领域驱动设计
- 业务规则封装
- 业务语言表达

#### 目标 3: 可测试性

- 依赖注入
- 接口抽象
- Mock 友好
- 测试隔离

#### 目标 4: 可扩展性

- 插件化设计
- 事件驱动
- 异步处理
- 水平扩展

#### 目标 5: 高性能

- CQRS 读写分离
- 事件异步处理
- 缓存策略
- 连接池管理

---

## 3. 混合架构模式

### 3.1 五大架构模式融合

hybrid-archi 采用混合架构模式，有机融合五种强大的架构模式：

```
┌─────────────────────────────────────────────────────────────────┐
│                       Hybrid Architecture                        │
│                          混合架构模式                             │
└─────────────────────────────────────────────────────────────────┘
         │
         ├─── Clean Architecture (整洁架构)
         │    │
         │    ├─ 提供：清晰的分层架构和依赖方向
         │    ├─ 核心：依赖倒置原则 (DIP)
         │    └─ 价值：业务逻辑独立于技术细节
         │
         ├─── Domain-Driven Design (领域驱动设计)
         │    │
         │    ├─ 提供：充血模型和领域建模
         │    ├─ 核心：实体、聚合根、值对象
         │    └─ 价值：业务复杂度管理
         │
         ├─── CQRS (命令查询职责分离)
         │    │
         │    ├─ 提供：读写分离
         │    ├─ 核心：CommandBus、QueryBus
         │    └─ 价值：性能和可扩展性
         │
         ├─── Event Sourcing (事件溯源)
         │    │
         │    ├─ 提供：事件存储和状态重建
         │    ├─ 核心：EventStore、Snapshot
         │    └─ 价值：审计追踪和时间旅行
         │
         └─── Event-Driven Architecture (事件驱动架构)
              │
              ├─ 提供：异步通信和解耦
              ├─ 核心：EventBus、EventHandler
              └─ 价值：系统解耦和弹性
```

### 3.2 架构模式协作

```
┌─────────────────────────────────────────────────────────┐
│  Clean Architecture: 定义分层和依赖方向                   │
└────────────────┬────────────────────────────────────────┘
                 │
    ┌────────────▼────────────┐
    │  DDD: 定义领域模型      │
    │  - 实体                 │
    │  - 聚合根               │
    │  - 值对象               │
    │  - 领域事件             │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │  CQRS: 分离读写职责     │
    │  - 命令端（写）         │
    │  - 查询端（读）         │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │  ES: 事件溯源           │
    │  - 事件存储             │
    │  - 状态重建             │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │  EDA: 事件驱动          │
    │  - 异步处理             │
    │  - 系统解耦             │
    └─────────────────────────┘
```

---

## 4. 架构分层

### 4.1 四层架构

```
┌───────────────────────────────────────────────────────────┐
│  Interface Layer (接口层)                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  - REST Controllers                                       │
│  - GraphQL Resolvers                                      │
│  - WebSocket Gateways                                     │
│  - CLI Commands                                           │
│  - Guards & Middleware                                    │
│                                                           │
│  职责：处理外部请求，转换为应用层命令/查询                    │
└────────────────────┬──────────────────────────────────────┘
                     │ depends on ↓
┌────────────────────▼──────────────────────────────────────┐
│  Application Layer (应用层)                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  - Use Cases (用例)                                        │
│  - Command Handlers (命令处理器)                           │
│  - Query Handlers (查询处理器)                             │
│  - Event Handlers (事件处理器)                             │
│  - Sagas (分布式事务编排)                                   │
│  - Application Services (应用服务)                         │
│                                                           │
│  职责：协调领域对象完成业务用例                              │
└────────────────────┬──────────────────────────────────────┘
                     │ depends on ↓
┌────────────────────▼──────────────────────────────────────┐
│  Domain Layer (领域层) - 核心业务逻辑                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  - Entities (实体)                                         │
│  - Aggregate Roots (聚合根)                                │
│  - Value Objects (值对象)                                  │
│  - Domain Events (领域事件)                                │
│  - Domain Services (领域服务)                              │
│  - Repository Interfaces (仓储接口)                        │
│  - Business Rules (业务规则)                               │
│                                                           │
│  职责：包含核心业务逻辑，独立于技术实现                       │
└────────────────────┬──────────────────────────────────────┘
                     │ implements ↑
┌────────────────────▼──────────────────────────────────────┐
│  Infrastructure Layer (基础设施层)                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  - Repository Implementations (仓储实现)                   │
│  - Database Adapters (数据库适配器)                        │
│  - Cache Adapters (缓存适配器)                             │
│  - Message Queue Adapters (消息队列适配器)                 │
│  - Event Store (事件存储)                                  │
│  - External Service Clients (外部服务客户端)               │
│                                                           │
│  职责：实现技术细节，适配外部系统                            │
└───────────────────────────────────────────────────────────┘
```

### 4.2 依赖规则

```
核心依赖原则：
┌──────────────────────────────────────────────────┐
│  依赖倒置原则 (Dependency Inversion Principle)    │
├──────────────────────────────────────────────────┤
│  1. 高层模块不依赖低层模块，两者都依赖抽象          │
│  2. 抽象不依赖具体，具体依赖抽象                   │
│  3. 依赖方向：外层→内层                           │
│  4. 稳定性方向：具体→抽象                         │
└──────────────────────────────────────────────────┘

依赖方向：
  Interface → Application → Domain ← Infrastructure
     (外层)      (外层)      (核心)      (外层)
```

**严格禁止**：

- ❌ Domain 层依赖 Application 层
- ❌ Domain 层依赖 Infrastructure 层
- ❌ Application 层依赖 Infrastructure 层的具体实现
- ❌ 任何内层依赖外层

---

## 5. 核心组件

### 5.1 领域层核心组件

#### BaseEntity - 基础实体

```typescript
/**
 * 基础实体
 * 
 * 特点：
 * - 具有唯一标识符
 * - 生命周期管理
 * - 审计信息（创建、更新、删除时间等）
 * - 多租户支持
 */
export abstract class BaseEntity {
  protected constructor(
    private readonly _id: EntityId,
    private readonly _auditInfo: IAuditInfo
  ) {}
  
  // 相等性基于 ID
  equals(other: BaseEntity): boolean;
  
  // 审计信息
  get createdAt(): Date;
  get updatedAt(): Date;
  get deletedAt(): Date | null;
}
```

#### BaseAggregateRoot - 基础聚合根

```typescript
/**
 * 基础聚合根
 * 
 * 特点：
 * - 管理一致性边界
 * - 发布领域事件
 * - 版本控制（乐观锁）
 * - 支持事件溯源
 */
export abstract class BaseAggregateRoot extends BaseEntity {
  private _domainEvents: BaseDomainEvent[] = [];
  private _version: number = 0;
  
  // 事件管理
  addDomainEvent(event: BaseDomainEvent): void;
  getUncommittedEvents(): readonly BaseDomainEvent[];
  markEventsAsCommitted(): void;
  
  // 版本控制
  get version(): number;
  incrementVersion(): void;
}
```

#### BaseValueObject - 基础值对象

```typescript
/**
 * 基础值对象
 * 
 * 特点：
 * - 不可变
 * - 相等性基于值
 * - 无标识符
 * - 封装验证逻辑
 */
export abstract class BaseValueObject {
  equals(other: BaseValueObject): boolean;
  validate(): void;
  toJSON(): Record<string, unknown>;
}
```

### 5.2 应用层核心组件

#### CQRS 总线

```typescript
// 命令总线 - 处理写操作
export class CommandBus {
  execute<TCommand>(command: TCommand): Promise<void>;
  registerHandler(type: string, handler: ICommandHandler): void;
}

// 查询总线 - 处理读操作
export class QueryBus {
  execute<TQuery, TResult>(query: TQuery): Promise<TResult>;
  registerHandler(type: string, handler: IQueryHandler): void;
}

// 事件总线 - 处理事件
export class EventBus {
  publish<TEvent>(event: TEvent): Promise<void>;
  publishAll(events: TEvent[]): Promise<void>;
  registerHandler(type: string, handler: IEventHandler): void;
}

// CQRS 总线 - 统一接口
export class CQRSBus {
  executeCommand(command: ICommand): Promise<void>;
  executeQuery<TResult>(query: IQuery): Promise<TResult>;
  publishEvent(event: IDomainEvent): Promise<void>;
}
```

#### 用例接口

```typescript
export interface IUseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>;
  getUseCaseName(): string;
  getUseCaseDescription(): string;
}
```

### 5.3 基础设施层核心组件

#### 仓储接口

```typescript
export interface IRepository<T extends BaseAggregateRoot> {
  save(aggregate: T): Promise<void>;
  findById(id: EntityId): Promise<T | null>;
  findAll(): Promise<T[]>;
  delete(id: EntityId): Promise<void>;
}
```

#### 事件存储

```typescript
export interface IEventStore {
  saveEvents(aggregateId: string, events: DomainEvent[]): Promise<void>;
  getEvents(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]>;
  saveSnapshot(snapshot: IAggregateSnapshot): Promise<void>;
  getSnapshot(aggregateId: string): Promise<IAggregateSnapshot | null>;
}
```

---

## 6. 设计原则

### 6.1 SOLID 原则

#### S - 单一职责原则 (SRP)

每个类只有一个改变的理由：

```typescript
// ✅ 好的做法：单一职责
class UserValidator {
  validate(user: User): void { /* 只负责验证 */ }
}

class UserRepository {
  save(user: User): Promise<void> { /* 只负责持久化 */ }
}

// ❌ 不好的做法：多重职责
class UserService {
  validate(user: User): void { /* 验证 */ }
  save(user: User): Promise<void> { /* 持久化 */ }
  sendEmail(user: User): Promise<void> { /* 发邮件 */ }
}
```

#### O - 开闭原则 (OCP)

对扩展开放，对修改关闭：

```typescript
// ✅ 好的做法：通过继承扩展
abstract class BaseNotificationService {
  abstract send(message: string): Promise<void>;
}

class EmailNotificationService extends BaseNotificationService {
  async send(message: string): Promise<void> {
    // 发送邮件
  }
}

class SmsNotificationService extends BaseNotificationService {
  async send(message: string): Promise<void> {
    // 发送短信
  }
}
```

#### L - 里氏替换原则 (LSP)

子类可以替换父类：

```typescript
// ✅ 好的做法：子类行为一致
class BaseEntity {
  equals(other: BaseEntity): boolean {
    return this.id.equals(other.id);
  }
}

class User extends BaseEntity {
  // 保持相同的行为契约
  equals(other: User): boolean {
    return super.equals(other);
  }
}
```

#### I - 接口隔离原则 (ISP)

客户端不应依赖它不需要的接口：

```typescript
// ✅ 好的做法：小而专注的接口
interface IReadRepository<T> {
  findById(id: EntityId): Promise<T | null>;
  findAll(): Promise<T[]>;
}

interface IWriteRepository<T> {
  save(aggregate: T): Promise<void>;
  delete(id: EntityId): Promise<void>;
}

// 组合接口
interface IRepository<T> extends IReadRepository<T>, IWriteRepository<T> {}
```

#### D - 依赖倒置原则 (DIP)

依赖抽象，不依赖具体：

```typescript
// ✅ 好的做法：依赖接口
class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository  // 接口
  ) {}
}

// ❌ 不好的做法：依赖具体类
class CreateUserUseCase {
  constructor(
    private readonly userRepository: PostgresUserRepository  // 具体类
  ) {}
}
```

### 6.2 DDD 原则

#### 充血模型 (Rich Domain Model)

业务逻辑在领域对象内：

```typescript
// ✅ 好的做法：充血模型
class Order extends BaseEntity {
  cancel(): void {
    if (this.status !== OrderStatus.Pending) {
      throw new Error('Only pending orders can be cancelled');
    }
    this.status = OrderStatus.Cancelled;
    this.addDomainEvent(new OrderCancelledEvent(this.id));
  }
}

// ❌ 不好的做法：贫血模型
class Order {
  status: OrderStatus;
  // 没有业务方法
}

class OrderService {
  cancel(order: Order): void {
    // 业务逻辑在服务层
    if (order.status !== OrderStatus.Pending) {
      throw new Error('Only pending orders can be cancelled');
    }
    order.status = OrderStatus.Cancelled;
  }
}
```

#### 聚合设计原则

```
1. 小聚合原则
   - 聚合应该尽可能小
   - 只包含真正需要强一致性的对象
   - 减少并发冲突

2. 通过 ID 引用
   - 聚合间通过 ID 引用
   - 不直接持有其他聚合的引用
   - 避免级联加载

3. 最终一致性
   - 跨聚合操作使用事件
   - 接受最终一致性
   - 使用 Saga 处理复杂流程
```

---

## 7. 技术栈

### 7.1 核心技术

| 技术 | 版本 | 用途 |
|------|------|------|
| TypeScript | 5.0+ | 类型安全的开发语言 |
| NestJS | 11.1+ | 依赖注入和模块化框架 |
| RxJS | 7.8+ | 响应式编程 |
| class-validator | 0.14+ | 数据验证 |
| class-transformer | 0.5+ | 对象转换 |

### 7.2 集成模块

| 模块 | 用途 |
|------|------|
| @hl8/multi-tenancy | 多租户架构支持 |
| @hl8/cache | 缓存管理 |
| @hl8/logger | 日志记录 |
| @hl8/config | 配置管理 |
| @hl8/database | 数据库访问 |
| @hl8/messaging | 消息队列 |
| @hl8/fastify-pro | Web 框架 |
| @hl8/common | 通用工具 |

---

## 8. 架构图

### 8.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    External Clients                          │
│            (Web, Mobile, API, CLI, WebSocket)                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Interface Layer                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   REST   │  │ GraphQL  │  │WebSocket │  │   CLI    │   │
│  │Controller│  │ Resolver │  │ Gateway  │  │ Command  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Guards & Middleware & Decorators                    │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────┘
                 │ Commands/Queries/Events
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  Application Layer                           │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│
│  │   Use Cases    │  │  Command/Query │  │  Event/Saga    ││
│  │                │  │    Handlers    │  │    Handlers    ││
│  └────────────────┘  └────────────────┘  └────────────────┘│
│  ┌──────────────────────────────────────────────────────┐   │
│  │           CommandBus / QueryBus / EventBus           │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────┘
                 │ Domain Interfaces
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                     Domain Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Entities │  │Aggregates│  │  Value   │  │  Domain  │   │
│  │          │  │   Roots  │  │ Objects  │  │  Events  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │  Domain  │  │Repository│  │ Business │                  │
│  │ Services │  │Interface │  │  Rules   │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└────────────────┬────────────────────────────────────────────┘
                 │ Implementations
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                Infrastructure Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Repository│  │ Database │  │  Cache   │  │  Event   │   │
│  │   Impl   │  │ Adapter  │  │ Adapter  │  │  Store   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Message  │  │External  │  │ Mappers  │                  │
│  │  Queue   │  │ Services │  │          │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 CQRS 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      CQRS Pattern                            │
└─────────────────────────────────────────────────────────────┘

命令端 (Write Side)           查询端 (Read Side)
┌─────────────────┐            ┌─────────────────┐
│    Commands     │            │     Queries     │
└────────┬────────┘            └────────┬────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐            ┌─────────────────┐
│  CommandHandler │            │  QueryHandler   │
└────────┬────────┘            └────────┬────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐            ┌─────────────────┐
│  Aggregate Root │            │   Read Model    │
└────────┬────────┘            └────────┬────────┘
         │                              │
         │ Domain Events                │
         └──────────┬───────────────────┘
                    │
                    ▼
           ┌─────────────────┐
           │   EventBus      │
           └────────┬────────┘
                    │
                    ▼
           ┌─────────────────┐
           │ EventHandlers   │
           │   Projectors    │
           └─────────────────┘
```

### 8.3 事件溯源架构图

```
┌─────────────────────────────────────────────────────────────┐
│                  Event Sourcing Pattern                      │
└─────────────────────────────────────────────────────────────┘

Commands                  Events                State
┌──────────┐            ┌──────────┐          ┌──────────┐
│ Create   │───────────▶│ Created  │─────────▶│ Version 1│
│  User    │            │  Event   │          │          │
└──────────┘            └──────────┘          └────┬─────┘
                                                   │
┌──────────┐            ┌──────────┐               │
│ Update   │───────────▶│ Updated  │──────────────▶│
│  Email   │            │  Event   │          ┌────▼─────┐
└──────────┘            └──────────┘          │ Version 2│
                                              │          │
┌──────────┐            ┌──────────┐          └────┬─────┘
│Deactivate│───────────▶│Deactivate│               │
│  User    │            │   Event  │──────────────▶│
└──────────┘            └──────────┘          ┌────▼─────┐
                                              │ Version 3│
                                              └──────────┘

Event Store (事件存储)
┌─────────────────────────────────────────┐
│  Aggregate: User-123                    │
│  ├─ V1: UserCreatedEvent                │
│  ├─ V2: UserEmailUpdatedEvent           │
│  └─ V3: UserDeactivatedEvent            │
└─────────────────────────────────────────┘

State Reconstruction (状态重建)
Event Stream ──▶ Apply Events ──▶ Current State
```

---

## 📚 相关文档

### 架构设计文档

- [01-domain-layer.md](01-domain-layer.md) - 领域层设计
- [02-application-layer.md](02-application-layer.md) - 应用层设计
- [03-infrastructure-layer.md](03-infrastructure-layer.md) - 基础设施层设计
- [04-interface-layer.md](04-interface-layer.md) - 接口层设计
- [05-cqrs-pattern.md](05-cqrs-pattern.md) - CQRS 模式设计
- [06-event-sourcing.md](06-event-sourcing.md) - 事件溯源设计
- [07-multi-tenancy.md](07-multi-tenancy.md) - 多租户架构设计

### 使用指南

- [Getting Started](../guides/getting-started.md) - 快速开始
- [Entity Design](../guides/entity-design.md) - 实体设计指南
- [Aggregate Design](../guides/aggregate-design.md) - 聚合根设计指南
- [CQRS Guide](../guides/cqrs-guide.md) - CQRS 使用指南
- [Testing Guide](../guides/testing.md) - 测试指南

---

**文档维护**: HL8 架构团队  
**最后更新**: 2025-01-27  
**版本**: 1.0.0
