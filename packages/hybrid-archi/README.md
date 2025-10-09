# @hl8/hybrid-archi

> **混合架构核心模块** - HL8 SAAS 平台的架构基石

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://github.com/your-org/hl8-saas-nx-mono)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

---

## 📖 目录

- [简介](#简介)
- [核心价值](#核心价值)
- [架构概述](#架构概述)
- [快速开始](#快速开始)
- [核心概念](#核心概念)
- [使用指南](#使用指南)
- [最佳实践](#最佳实践)
- [示例代码](#示例代码)
- [API 文档](#api-文档)
- [常见问题](#常见问题)
- [贡献指南](#贡献指南)

---

## 📘 简介

`hybrid-archi` 是 HL8 SAAS 平台的**核心架构基础模块**，为整个平台提供统一的混合架构设计模式和完整的通用功能组件。

### 核心定位

> 🎯 **hybrid-archi 是整个 SAAS 平台的架构基石**

- **统一架构模式**：为所有业务模块提供统一的混合架构设计模式
- **通用功能组件**：提供混合架构开发所需的完整通用功能组件
- **业务模块基础**：所有业务模块必须基于 hybrid-archi 开发
- **架构一致性保障**：确保整个平台的架构一致性和可维护性

### 技术特点

- ✅ **完整的混合架构实现**：Clean Architecture + DDD + CQRS + Event Sourcing + Event-Driven Architecture
- ✅ **类型安全**：TypeScript 严格模式，完整的类型系统
- ✅ **多租户支持**：内置多租户架构支持
- ✅ **充血模型**：遵循 DDD 充血模型设计原则
- ✅ **事件驱动**：完整的领域事件和事件溯源支持
- ✅ **可测试性**：完善的测试体系和工具支持

---

## 🌟 核心价值

### 1. 统一架构模式

hybrid-archi 提供了统一的混合架构设计模式，确保所有业务模块使用相同的架构风格：

```typescript
// 所有业务模块都基于相同的基础组件
import { 
  BaseEntity,           // 基础实体
  BaseAggregateRoot,    // 基础聚合根
  BaseValueObject,      // 基础值对象
  BaseDomainEvent,      // 基础领域事件
  CommandBus,           // 命令总线
  QueryBus,             // 查询总线
  EventBus              // 事件总线
} from '@hl8/hybrid-archi';
```

### 2. 通用功能组件

提供混合架构开发所需的完整通用功能组件：

- **领域层组件**：BaseEntity、BaseAggregateRoot、BaseValueObject、BaseDomainEvent
- **应用层组件**：CQRS 总线、用例接口、命令查询分离
- **基础设施组件**：仓储适配器、事件存储、端口适配器
- **接口层组件**：控制器基类、守卫、装饰器、中间件

### 3. 开发规范定义

定义了完整的开发规范，保证代码质量：

- ✅ 充血模型开发规范
- ✅ 实体与聚合根分离规范
- ✅ CQRS 开发规范
- ✅ 事件溯源开发规范
- ✅ 多租户开发规范

---

## 🏗️ 架构概述

### 混合架构模式

hybrid-archi 采用混合架构模式，融合了五种强大的架构模式：

```
┌─────────────────────────────────────────────────────────────┐
│                    Hybrid Architecture                       │
├─────────────────────────────────────────────────────────────┤
│  Clean Architecture   │  提供清晰的分层架构和依赖方向        │
│  DDD                  │  提供充血模型和领域建模              │
│  CQRS                 │  分离命令和查询职责                  │
│  Event Sourcing       │  提供事件溯源能力                    │
│  Event-Driven Arch    │  提供事件驱动架构                    │
└─────────────────────────────────────────────────────────────┘
```

### 架构分层

```
packages/hybrid-archi/src/
├── interface/          # 接口层（UI 层）
│   ├── controllers/    # REST 控制器
│   ├── graphql/        # GraphQL 解析器
│   ├── websocket/      # WebSocket 网关
│   ├── cli/            # CLI 命令
│   ├── guards/         # 守卫（认证、授权）
│   ├── decorators/     # 装饰器
│   └── middleware/     # 中间件
│
├── application/        # 应用层
│   ├── use-cases/      # 用例（业务用例）
│   ├── cqrs/           # CQRS（命令、查询、事件、Saga）
│   │   ├── commands/   # 命令系统
│   │   ├── queries/    # 查询系统
│   │   ├── events/     # 事件系统
│   │   ├── sagas/      # Saga 系统
│   │   └── bus/        # 总线（CommandBus、QueryBus、EventBus）
│   ├── ports/          # 输出端口
│   └── services/       # 应用服务
│
├── domain/             # 领域层（核心业务逻辑）
│   ├── entities/       # 实体
│   ├── aggregates/     # 聚合根
│   ├── value-objects/  # 值对象
│   ├── events/         # 领域事件
│   ├── services/       # 领域服务
│   ├── repositories/   # 仓储接口
│   ├── rules/          # 业务规则
│   └── specifications/ # 规约模式
│
└── infrastructure/     # 基础设施层
    ├── adapters/       # 适配器（实现端口）
    │   ├── repositories/  # 仓储实现
    │   ├── cache/         # 缓存适配器
    │   ├── database/      # 数据库适配器
    │   ├── event-store/   # 事件存储适配器
    │   └── message-queue/ # 消息队列适配器
    ├── event-sourcing/ # 事件溯源
    ├── event-driven/   # 事件驱动
    └── factories/      # 工厂
```

### 依赖方向

```
┌───────────────────────────────────────────────────────┐
│  Interface Layer (接口层)                              │
│  - REST Controllers, GraphQL Resolvers, WebSocket     │
└────────────────────┬──────────────────────────────────┘
                     │ depends on ↓
┌────────────────────▼──────────────────────────────────┐
│  Application Layer (应用层)                            │
│  - Use Cases, CQRS, Application Services              │
└────────────────────┬──────────────────────────────────┘
                     │ depends on ↓
┌────────────────────▼──────────────────────────────────┐
│  Domain Layer (领域层)                                 │
│  - Entities, Aggregates, Value Objects, Events        │
└────────────────────┬──────────────────────────────────┘
                     │ implements ↑
┌────────────────────▼──────────────────────────────────┐
│  Infrastructure Layer (基础设施层)                     │
│  - Adapters, Repositories, Event Store, Factories     │
└───────────────────────────────────────────────────────┘
```

**核心原则**：

- ✅ 依赖倒置：内层不依赖外层，外层依赖内层
- ✅ 接口定义：领域层定义接口，基础设施层实现接口
- ✅ 业务隔离：业务逻辑完全在领域层，不依赖技术实现

---

## 🚀 快速开始

### 安装

```bash
# 本模块是 workspace 内部模块，通过 pnpm workspace 引用
# 在业务模块的 package.json 中添加依赖
{
  "dependencies": {
    "@hl8/hybrid-archi": "workspace:*"
  }
}
```

### 基本使用

#### 1. 创建值对象

```typescript
import { BaseValueObject } from '@hl8/hybrid-archi';

/**
 * 邮箱值对象
 */
export class Email extends BaseValueObject {
  private constructor(private readonly _value: string) {
    super();
    this.validate();
  }

  static create(value: string): Email {
    return new Email(value);
  }

  get value(): string {
    return this._value;
  }

  protected validate(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this._value)) {
      throw new Error('Invalid email format');
    }
  }

  equals(other: Email | null | undefined): boolean {
    if (!super.equals(other)) return false;
    return this._value === (other as Email)._value;
  }
}
```

#### 2. 创建实体

```typescript
import { BaseEntity, EntityId } from '@hl8/hybrid-archi';
import { Email } from '../value-objects/email.vo';

/**
 * 用户实体
 */
export class User extends BaseEntity {
  private constructor(
    id: EntityId,
    private _name: string,
    private _email: Email,
    auditInfo: IPartialAuditInfo
  ) {
    super(id, auditInfo);
  }

  static create(name: string, email: Email): User {
    const user = new User(
      EntityId.generate(),
      name,
      email,
      { createdBy: 'system' }
    );
    return user;
  }

  // 充血模型：业务逻辑在实体内
  updateEmail(newEmail: Email): void {
    if (this._email.equals(newEmail)) {
      return;
    }
    this._email = newEmail;
    this.updateTimestamp();
  }

  // Getter 方法
  get name(): string {
    return this._name;
  }

  get email(): Email {
    return this._email;
  }
}
```

#### 3. 创建聚合根

```typescript
import { 
  BaseAggregateRoot, 
  EntityId,
  BaseDomainEvent 
} from '@hl8/hybrid-archi';
import { User } from '../entities/user.entity';

/**
 * 用户聚合根
 */
export class UserAggregate extends BaseAggregateRoot {
  private constructor(
    id: EntityId,
    private _user: User,
    auditInfo: IPartialAuditInfo
  ) {
    super(id, auditInfo);
  }

  static create(name: string, email: Email): UserAggregate {
    const user = User.create(name, email);
    const aggregate = new UserAggregate(
      user.id,
      user,
      { createdBy: 'system', tenantId: 'tenant-123' }
    );
    
    // 发布领域事件
    aggregate.addDomainEvent(
      new UserCreatedEvent(aggregate.id, 1, aggregate.tenantId, name, email.value)
    );
    
    return aggregate;
  }

  // 聚合根方法：协调内部实体操作
  updateUserEmail(newEmail: Email): void {
    this._user.updateEmail(newEmail);
    this.addDomainEvent(
      new UserEmailUpdatedEvent(this.id, this.version, this.tenantId, newEmail.value)
    );
  }

  get user(): User {
    return this._user;
  }
}
```

#### 4. 实现用例（CQRS）

```typescript
import { IUseCase, CommandBus, QueryBus } from '@hl8/hybrid-archi';

/**
 * 创建用户命令
 */
export class CreateUserCommand extends BaseCommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    tenantId: string,
    userId: string
  ) {
    super(tenantId, userId);
  }

  get commandType(): string {
    return 'CreateUser';
  }
}

/**
 * 创建用户用例
 */
export class CreateUserUseCase implements IUseCase<CreateUserCommand, UserDto> {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(command: CreateUserCommand): Promise<UserDto> {
    // 1. 创建值对象
    const email = Email.create(command.email);
    
    // 2. 创建聚合根
    const userAggregate = UserAggregate.create(command.name, email);
    
    // 3. 保存到仓储
    await this.userRepository.save(userAggregate);
    
    // 4. 发布领域事件
    const events = userAggregate.getUncommittedEvents();
    for (const event of events) {
      await this.commandBus.publishEvent(event);
    }
    
    // 5. 返回 DTO
    return UserDto.fromAggregate(userAggregate);
  }

  getUseCaseName(): string {
    return 'CreateUser';
  }

  getUseCaseDescription(): string {
    return '创建新用户';
  }
}
```

---

## 📚 核心概念

### 1. 领域层 (Domain Layer)

领域层是架构的核心，包含所有业务逻辑：

#### BaseEntity - 基础实体

```typescript
/**
 * 基础实体类
 * 
 * 特点：
 * - 具有唯一标识符
 * - 生命周期管理
 * - 审计信息
 * - 多租户支持
 */
export abstract class BaseEntity implements IEntity {
  protected constructor(
    private readonly _id: EntityId,
    private readonly _auditInfo: IAuditInfo
  ) {}
  
  // 相等性基于 ID
  equals(other: BaseEntity): boolean {
    return this._id.equals(other._id);
  }
}
```

#### BaseAggregateRoot - 基础聚合根

```typescript
/**
 * 基础聚合根类
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
  
  addDomainEvent(event: BaseDomainEvent): void {
    this._domainEvents.push(event);
  }
  
  getUncommittedEvents(): readonly BaseDomainEvent[] {
    return this._domainEvents;
  }
}
```

#### BaseValueObject - 基础值对象

```typescript
/**
 * 基础值对象类
 * 
 * 特点：
 * - 不可变
 * - 相等性基于值
 * - 无标识符
 * - 封装验证逻辑
 */
export abstract class BaseValueObject {
  equals(other: BaseValueObject): boolean {
    return this.arePropertiesEqual(other);
  }
  
  protected abstract arePropertiesEqual(other: BaseValueObject): boolean;
}
```

### 2. 应用层 (Application Layer)

应用层协调领域对象完成业务用例：

#### CQRS 模式

```typescript
// 命令端（写操作）
export interface ICommand {
  commandType: string;
  commandId: string;
  tenantId: string;
  userId: string;
}

// 查询端（读操作）
export interface IQuery {
  queryType: string;
  queryId: string;
  tenantId: string;
  userId: string;
}

// 命令总线
export class CommandBus {
  async execute<TCommand extends BaseCommand>(command: TCommand): Promise<void>;
}

// 查询总线
export class QueryBus {
  async execute<TQuery extends BaseQuery, TResult>(query: TQuery): Promise<TResult>;
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

### 3. 基础设施层 (Infrastructure Layer)

基础设施层实现技术细节：

#### 仓储模式

```typescript
export interface IRepository<T extends BaseAggregateRoot> {
  save(aggregate: T): Promise<void>;
  findById(id: EntityId): Promise<T | null>;
  delete(id: EntityId): Promise<void>;
}
```

#### 事件存储

```typescript
export interface IEventStore {
  saveEvents(aggregateId: string, events: DomainEvent[]): Promise<void>;
  getEvents(aggregateId: string): Promise<DomainEvent[]>;
}
```

### 4. 接口层 (Interface Layer)

接口层处理外部交互：

#### 控制器

```typescript
@Controller('users')
export class UserController extends BaseController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {
    super();
  }

  @Post()
  @RequirePermissions('user:create')
  async createUser(@Body() dto: CreateUserDto): Promise<UserDto> {
    const command = new CreateUserCommand(
      dto.name,
      dto.email,
      this.getTenantId(),
      this.getUserId()
    );
    return await this.createUserUseCase.execute(command);
  }
}
```

---

## 📖 使用指南

### 实体设计指南

1. **使用充血模型**：业务逻辑在实体内，不在服务层
2. **私有属性**：使用私有属性保护数据
3. **公开方法**：通过方法暴露业务操作
4. **不可变性**：尽可能使用不可变对象

```typescript
export class Order extends BaseEntity {
  // ✅ 好的做法
  private _status: OrderStatus;
  
  cancel(): void {
    if (this._status !== OrderStatus.Pending) {
      throw new Error('Only pending orders can be cancelled');
    }
    this._status = OrderStatus.Cancelled;
  }
  
  // ❌ 不好的做法
  set status(value: OrderStatus) {
    this._status = value;
  }
}
```

### 聚合根设计指南

1. **一致性边界**：聚合根定义一致性边界
2. **小聚合**：保持聚合尽可能小
3. **通过 ID 引用**：聚合间通过 ID 引用，不直接引用对象
4. **发布事件**：状态变更时发布领域事件

```typescript
export class OrderAggregate extends BaseAggregateRoot {
  private _orderItems: OrderItem[] = [];
  
  // ✅ 好的做法：协调内部实体
  addItem(productId: string, quantity: number): void {
    const item = OrderItem.create(productId, quantity);
    this._orderItems.push(item);
    this.addDomainEvent(new OrderItemAddedEvent(...));
  }
  
  // ✅ 好的做法：通过 ID 引用其他聚合
  private _customerId: EntityId;
  
  // ❌ 不好的做法：直接引用其他聚合
  // private _customer: CustomerAggregate;
}
```

### CQRS 使用指南

1. **命令查询分离**：命令修改状态，查询只读取
2. **命令无返回值**：命令只返回成功/失败，不返回数据
3. **查询无副作用**：查询不修改状态
4. **异步事件**：使用事件实现最终一致性

```typescript
// ✅ 命令：修改状态，无返回值
export class UpdateOrderCommand extends BaseCommand {
  execute(): Promise<void> {
    // 修改状态
  }
}

// ✅ 查询：只读取，有返回值
export class GetOrderQuery extends BaseQuery {
  execute(): Promise<OrderDto> {
    // 只读取
  }
}
```

### EventBus vs Messaging 使用指南

> 💡 **重要决策**：何时使用 EventBus，何时使用 @hl8/messaging？

#### 核心原则

- **EventBus**：用于进程内的领域事件处理（CQRS 模式）
- **@hl8/messaging**：用于跨服务的分布式通信（集成事件）

#### 使用决策

| 场景 | 使用 | 原因 |
|------|------|------|
| 聚合根发布领域事件 | EventBus | 微秒级延迟，高性能 |
| CQRS 读写模型同步 | EventBus | 进程内通信，严格顺序 |
| 跨服务/微服务通信 | @hl8/messaging | 松耦合，支持分布式 |
| 异步任务（发邮件） | @hl8/messaging | 持久化，可靠传递 |

#### 示例对比

```typescript
// ✅ 使用 EventBus：领域事件
@EventHandler('TenantCreated')
export class TenantCreatedHandler implements IEventHandler<TenantCreatedEvent> {
  async handle(event: TenantCreatedEvent): Promise<void> {
    // 更新读模型、触发其他领域逻辑
    console.log('租户已创建:', event.aggregateId);
  }
}

// ✅ 使用 @hl8/messaging：集成事件
@EventHandler('TenantCreated')
export class TenantIntegrationHandler implements IEventHandler<TenantCreatedEvent> {
  constructor(
    @Optional() private readonly messagingService?: MessagingService
  ) {}

  async handle(event: TenantCreatedEvent): Promise<void> {
    // 1. 处理领域逻辑（EventBus）
    // ...
    
    // 2. 发布集成事件到消息队列（Messaging）
    if (this.messagingService) {
      await this.messagingService.publish('integration.tenant.created', {
        tenantId: event.aggregateId.toString(),
      });
    }
  }
}
```

#### 详细指南

完整的使用指南和最佳实践，请参考：

📖 **[HL8 SAAS 平台宪章 - 业务模块开发指南](../../.specify/memory/constitution.md#eventbus-vs-messaging-使用指南)**

### 多租户开发指南

1. **租户隔离**：所有聚合根包含租户 ID
2. **自动注入**：框架自动注入租户上下文
3. **数据隔离**：数据库层面隔离租户数据

```typescript
export class User extends BaseEntity {
  constructor(
    id: EntityId,
    private _name: string,
    auditInfo: IPartialAuditInfo  // 包含 tenantId
  ) {
    super(id, auditInfo);
  }
  
  // 租户 ID 自动管理
  get tenantId(): string {
    return this.auditInfo.tenantId;
  }
}
```

---

## ✨ 最佳实践

### 1. 充血模型

**原则**：业务逻辑在领域对象内，不在服务层

```typescript
// ✅ 好的做法
export class Order extends BaseEntity {
  cancel(): void {
    this.ensureCanBeCancelled();
    this._status = OrderStatus.Cancelled;
    this.addDomainEvent(new OrderCancelledEvent(this.id));
  }
  
  private ensureCanBeCancelled(): void {
    if (this._status !== OrderStatus.Pending) {
      throw new Error('Cannot cancel non-pending order');
    }
  }
}

// ❌ 不好的做法
export class OrderService {
  cancel(order: Order): void {
    if (order.status !== OrderStatus.Pending) {
      throw new Error('Cannot cancel non-pending order');
    }
    order.status = OrderStatus.Cancelled;
  }
}
```

### 2. 实体与聚合根分离

**原则**：聚合根管理一致性边界，实体执行具体操作

```typescript
// ✅ 好的做法
export class OrderAggregate extends BaseAggregateRoot {
  // 聚合根：管理一致性边界
  addItem(productId: string, quantity: number, price: Money): void {
    this.ensureOrderNotClosed();
    const item = OrderItem.create(productId, quantity, price);
    this._items.push(item);
    this.updateTotalAmount();
    this.addDomainEvent(new OrderItemAddedEvent(...));
  }
}

export class OrderItem extends BaseEntity {
  // 实体：执行具体操作
  updateQuantity(newQuantity: number): void {
    this._quantity = newQuantity;
  }
}
```

### 3. 值对象不可变性

**原则**：值对象创建后不可修改

```typescript
// ✅ 好的做法
export class Money extends BaseValueObject {
  private constructor(
    private readonly _amount: number,
    private readonly _currency: string
  ) {
    super();
  }
  
  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this._amount + other._amount, this._currency);
  }
}

// ❌ 不好的做法
export class Money extends BaseValueObject {
  private _amount: number;
  
  setAmount(amount: number): void {
    this._amount = amount;
  }
}
```

### 4. 领域事件使用

**原则**：重要的业务变更都应该发布事件

```typescript
export class User extends BaseEntity {
  activate(): void {
    if (this._status === UserStatus.Active) {
      return;
    }
    
    this._status = UserStatus.Active;
    this._activatedAt = new Date();
    
    // ✅ 发布领域事件
    this.addDomainEvent(
      new UserActivatedEvent(this.id, this.version, this.tenantId)
    );
  }
}
```

### 5. 事件溯源模式

**原则**：通过事件流重建聚合状态

```typescript
export class OrderAggregate extends BaseAggregateRoot {
  // 创建时发布事件
  static create(customerId: string, items: OrderItemDto[]): OrderAggregate {
    const order = new OrderAggregate(...);
    order.addDomainEvent(new OrderCreatedEvent(...));
    return order;
  }
  
  // 从事件流重建
  static fromEvents(events: DomainEvent[]): OrderAggregate {
    const order = new OrderAggregate(...);
    events.forEach(event => order.apply(event));
    return order;
  }
  
  // 应用事件到聚合
  private apply(event: DomainEvent): void {
    switch (event.type) {
      case 'OrderCreated':
        this.applyOrderCreated(event as OrderCreatedEvent);
        break;
      // ... 其他事件
    }
  }
}
```

---

## 💡 示例代码

完整示例请查看：

- **基础示例**：`examples/basic/` - 简单的实体、值对象、聚合根示例
- **CQRS 示例**：`examples/cqrs/` - 完整的 CQRS 实现示例
- **事件溯源示例**：`examples/event-sourcing/` - 事件溯源完整示例
- **完整业务示例**：`examples/complete/user-management/` - 用户管理完整业务流程

### 快速示例：用户管理

查看完整的用户管理示例，了解如何使用 hybrid-archi 开发业务模块：

```bash
# 查看示例代码
cd examples/complete/user-management

# 运行示例
nx run user-management:serve
```

---

## 📖 API 文档

### 核心导出

```typescript
// 领域层
export {
  BaseEntity,
  BaseAggregateRoot,
  BaseValueObject,
  BaseDomainEvent,
  IDomainService,
  IRepository
} from '@hl8/hybrid-archi';

// 应用层
export {
  CommandBus,
  QueryBus,
  EventBus,
  CQRSBus,
  IUseCase,
  ICommand,
  IQuery
} from '@hl8/hybrid-archi';

// 接口层
export {
  BaseController,
  RequirePermissions,
  TenantContext,
  CurrentUser,
  JwtAuthGuard
} from '@hl8/hybrid-archi';
```

详细的 API 文档请查看：[API Documentation](docs/api/README.md)

---

## ❓ 常见问题

### Q1: 什么时候使用实体，什么时候使用聚合根？

**A**:

- **实体**：当对象有唯一标识且需要跟踪生命周期时使用实体
- **聚合根**：当需要管理一组相关对象的一致性边界时使用聚合根

```typescript
// 实体：OrderItem 是 Order 聚合的一部分
export class OrderItem extends BaseEntity {
  updateQuantity(quantity: number): void {
    this._quantity = quantity;
  }
}

// 聚合根：Order 管理一致性边界
export class OrderAggregate extends BaseAggregateRoot {
  addItem(item: OrderItem): void {
    this._items.push(item);
    this.updateTotalAmount();
  }
}
```

### Q2: 如何处理跨聚合的事务？

**A**: 使用 Saga 模式或领域事件实现最终一致性：

```typescript
// ✅ 使用 Saga
export class OrderProcessSaga extends BaseSaga {
  async execute(context: ISagaExecutionContext): Promise<void> {
    // 步骤 1: 创建订单
    await this.createOrder(context);
    // 步骤 2: 扣减库存
    await this.reduceInventory(context);
    // 步骤 3: 处理支付
    await this.processPayment(context);
  }
}

// ✅ 使用领域事件
export class InventoryEventHandler {
  @EventHandler('OrderCreated')
  async handle(event: OrderCreatedEvent): Promise<void> {
    await this.inventoryService.reduceStock(event.items);
  }
}
```

### Q3: 如何在多租户环境下使用？

**A**: 框架自动处理租户隔离：

```typescript
// 1. 聚合根自动包含租户 ID
const user = UserAggregate.create('张三', email);
console.log(user.tenantId); // 自动注入

// 2. 仓储自动过滤租户数据
const users = await userRepository.findAll(); // 只返回当前租户的数据

// 3. 守卫自动验证租户
@Controller('users')
@UseGuards(TenantIsolationGuard)
export class UserController {
  // 自动验证租户权限
}
```

### Q4: 如何进行单元测试？

**A**: 使用 Jest 进行单元测试：

```typescript
describe('User', () => {
  it('应该能够激活用户', () => {
    // Arrange
    const user = User.create('张三', Email.create('test@example.com'));
    
    // Act
    user.activate();
    
    // Assert
    expect(user.status).toBe(UserStatus.Active);
    expect(user.domainEvents).toHaveLength(2); // Created + Activated
  });
});
```

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范

- 遵循 TypeScript 严格模式
- 使用 TSDoc 注释所有公共 API
- 编写单元测试覆盖新功能
- 遵循充血模型设计原则

### 提交规范

使用 Conventional Commits 规范：

```
feat: 添加新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

---

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情

---

## 🔗 相关资源

- [项目文档](../../docs/)
- [架构设计文档](../../docs/designs/hybrid-archi/)
- [API 文档](docs/api/)
- [示例代码](examples/)
- [贡献指南](CONTRIBUTING.md)

---

## 📞 联系我们

- **项目负责人**: HL8 架构团队
- **问题反馈**: [GitHub Issues](https://github.com/your-org/hl8-saas-nx-mono/issues)
- **技术支持**: <tech-support@hl8.com>

---

**Happy Coding! 🎉**
