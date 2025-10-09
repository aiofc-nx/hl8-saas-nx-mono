# 领域事件 vs 集成事件区分指南

**版本**: 1.0.0  
**更新日期**: 2025-10-09  
**适用范围**: 所有业务模块的事件设计

---

## 📖 目录

- [核心概念](#核心概念)
- [区分原则](#区分原则)
- [命名规范](#命名规范)
- [实现模式](#实现模式)
- [使用场景](#使用场景)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 核心概念

### 领域事件 (Domain Events)

**定义**：反映领域模型内部状态变更的事件，是 DDD 和 CQRS 模式的核心概念。

**特征**：

- 📍 **范围**：单个限界上下文（Bounded Context）内
- 🎯 **目的**：维护领域模型一致性、实现读写模型同步
- ⚡ **处理**：进程内、同步或异步、微秒级延迟
- 🔧 **工具**：EventBus (from `@hl8/hybrid-archi`)
- 📝 **命名**：过去式，如 `UserCreatedEvent`、`TenantActivatedEvent`

**示例**：

```typescript
/**
 * 租户已创建事件（领域事件）
 * 
 * @description 当租户聚合根成功创建租户实体后发布此事件
 * 用于通知同一进程内的其他组件更新读模型、执行后续业务逻辑
 */
export class TenantCreatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    version: number,
    tenantId: EntityId,
    public readonly code: string,
    public readonly name: string,
    public readonly type: TenantType
  ) {
    super(aggregateId, version, tenantId);
  }

  get eventType(): string {
    return 'TenantCreated';
  }
}
```

### 集成事件 (Integration Events)

**定义**：用于跨服务、跨系统通信的事件，实现分布式系统间的松耦合集成。

**特征**：

- 📍 **范围**：跨限界上下文、跨微服务
- 🎯 **目的**：通知其他服务或系统、触发异步任务
- ⚡ **处理**：跨进程、异步、毫秒级延迟
- 🔧 **工具**：@hl8/messaging (RabbitMQ/Kafka/Redis Streams)
- 📝 **命名**：使用点号分隔的命名空间，如 `integration.tenant.created`

**示例**：

```typescript
/**
 * 租户创建集成事件（集成事件）
 * 
 * @description 通知其他微服务（如邮件服务、通知服务）租户已创建
 * 使用 messaging 服务发布到消息队列，实现跨服务通信
 */
interface TenantCreatedIntegrationEvent {
  eventType: 'integration.tenant.created';
  eventId: string;
  occurredAt: string;
  payload: {
    tenantId: string;
    tenantCode: string;
    tenantName: string;
    tenantType: string;
    createdAt: string;
  };
}

// 发布集成事件
await this.messagingService.publish('integration.tenant.created', {
  tenantId: event.aggregateId.toString(),
  tenantCode: event.code,
  tenantName: event.name,
  tenantType: event.type,
  createdAt: event.occurredAt.toISOString(),
});
```

---

## 区分原则

### 决策树

```text
事件需要发布？
  │
  ├─ 是否需要跨服务/系统通信？
  │    │
  │    ├─ 是 → 集成事件 (Integration Event)
  │    │      使用 @hl8/messaging
  │    │      命名: integration.{context}.{action}
  │    │
  │    └─ 否 → 是否是领域模型状态变更？
  │           │
  │           ├─ 是 → 领域事件 (Domain Event)
  │           │      使用 EventBus
  │           │      命名: {Entity}{Action}Event
  │           │
  │           └─ 否 → 应用事件或技术事件
  │                  (通常不需要事件机制)
```

### 判断标准

| 判断维度 | 领域事件 | 集成事件 |
|---------|---------|---------|
| **通信范围** | 进程内 | 跨进程/跨服务 |
| **目标受众** | 同一限界上下文内的组件 | 其他微服务或外部系统 |
| **业务含义** | 领域模型状态变更 | 系统间业务事件通知 |
| **技术要求** | 高性能、严格顺序 | 可靠传递、持久化 |
| **失败影响** | 影响当前事务一致性 | 不影响当前事务，最终一致 |
| **重试机制** | 通常不需要 | 需要，消息队列提供 |

---

## 命名规范

### 领域事件命名

**格式**：`{实体名}{动作}Event`

**规则**：

1. 使用 PascalCase
2. 动作使用过去式
3. 反映具体的业务操作
4. 继承 `BaseDomainEvent`

**示例**：

```typescript
// ✅ 好的命名
UserCreatedEvent
TenantActivatedEvent
OrderPlacedEvent
PaymentCompletedEvent
InventoryReservedEvent

// ❌ 不好的命名
UserEvent          // 太泛化，不明确动作
CreateUserEvent    // 动词不是过去式
UserChangeEvent    // "Change" 太模糊
User_Created       // 使用了下划线
```

### 集成事件命名

**格式**：`integration.{上下文}.{动作}`

**规则**：

1. 使用小写字母
2. 点号分隔命名空间
3. 以 `integration` 开头
4. 动作使用过去式

**示例**：

```typescript
// ✅ 好的命名
'integration.tenant.created'
'integration.user.registered'
'integration.order.placed'
'integration.payment.completed'
'integration.inventory.reserved'

// ❌ 不好的命名
'TenantCreated'              // 看起来像领域事件
'integration.create.tenant'  // 动词不是过去式
'tenant-created'             // 使用了连字符
'integration_tenant_created' // 使用了下划线
```

---

## 实现模式

### 模式 1：纯领域事件

**适用场景**：

- 核心业务模块（如 saas-core）
- 不需要跨服务通信
- 追求高性能和严格一致性

**实现**：

```typescript
// 聚合根发布领域事件
export class TenantAggregate extends TenantAwareAggregateRoot {
  public activate(userId: string): void {
    // 业务逻辑
    this._tenant.activate();
    
    // 发布领域事件
    this.addDomainEvent(new TenantActivatedEvent(
      this.id,
      this.version,
      this.tenantId,
      this._tenant.getPreviousStatus()
    ));
  }
}

// 事件处理器（EventBus）
@EventHandler('TenantActivated')
export class TenantActivatedHandler implements IEventHandler<TenantActivatedEvent> {
  async handle(event: TenantActivatedEvent): Promise<void> {
    // 更新读模型
    await this.updateReadModel(event);
    
    // 触发其他领域逻辑
    await this.notifyRelatedAggregates(event);
  }
}
```

### 模式 2：领域事件 + 集成事件

**适用场景**：

- 需要跨服务通信的业务模块
- 微服务架构
- 需要通知外部系统

**实现**：

```typescript
// 聚合根发布领域事件（不变）
export class TenantAggregate extends TenantAwareAggregateRoot {
  public activate(userId: string): void {
    this._tenant.activate();
    this.addDomainEvent(new TenantActivatedEvent(...));
  }
}

// 事件处理器（桥接 EventBus 和 Messaging）
@EventHandler('TenantActivated')
export class TenantActivatedHandler implements IEventHandler<TenantActivatedEvent> {
  constructor(
    @Optional() private readonly messagingService?: MessagingService,
    @Optional() private readonly taskService?: TaskService
  ) {}

  async handle(event: TenantActivatedEvent): Promise<void> {
    // 1. 处理领域逻辑（EventBus，必须）
    await this.updateReadModel(event);
    await this.notifyRelatedAggregates(event);
    
    // 2. 发布集成事件（Messaging，可选）
    if (this.messagingService) {
      // 通知其他微服务
      await this.messagingService.publish('integration.tenant.activated', {
        tenantId: event.aggregateId.toString(),
        activatedAt: event.occurredAt.toISOString(),
      });
    }
    
    // 3. 发布异步任务（Messaging，可选）
    if (this.taskService) {
      await this.taskService.publish('send-activation-notification', {
        tenantId: event.aggregateId.toString(),
      });
    }
  }
}
```

### 模式 3：独立的集成事件处理器

**适用场景**：

- 集成逻辑复杂
- 需要独立维护和测试
- 多个领域事件映射到同一个集成事件

**实现**：

```typescript
// 领域事件处理器（专注领域逻辑）
@EventHandler('TenantActivated')
export class TenantActivatedDomainHandler implements IEventHandler<TenantActivatedEvent> {
  async handle(event: TenantActivatedEvent): Promise<void> {
    // 只处理领域逻辑
    await this.updateReadModel(event);
    await this.notifyRelatedAggregates(event);
  }
}

// 集成事件处理器（专注集成逻辑）
@EventHandler('TenantActivated')
export class TenantActivatedIntegrationHandler implements IEventHandler<TenantActivatedEvent> {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly taskService: TaskService
  ) {}

  async handle(event: TenantActivatedEvent): Promise<void> {
    // 只处理集成逻辑
    await this.publishIntegrationEvents(event);
    await this.scheduleAsyncTasks(event);
  }

  private async publishIntegrationEvents(event: TenantActivatedEvent): Promise<void> {
    // 发布多个集成事件
    await this.messagingService.publish('integration.tenant.activated', {...});
    await this.messagingService.publish('integration.tenant.status.changed', {...});
  }

  private async scheduleAsyncTasks(event: TenantActivatedEvent): Promise<void> {
    // 调度多个异步任务
    await this.taskService.publish('send-activation-notification', {...});
    await this.taskService.publish('update-analytics', {...});
  }
}
```

---

## 使用场景

### 领域事件使用场景

#### 1. 读写模型同步 (CQRS)

```typescript
// 写模型：聚合根发布事件
export class UserAggregate extends TenantAwareAggregateRoot {
  public updateProfile(name: string, email: string): void {
    this._user.updateProfile(name, email);
    this.addDomainEvent(new UserProfileUpdatedEvent(...));
  }
}

// 读模型：事件处理器更新读模型
@EventHandler('UserProfileUpdated')
export class UserProfileUpdatedHandler implements IEventHandler<UserProfileUpdatedEvent> {
  constructor(private readonly readModelRepository: UserReadModelRepository) {}

  async handle(event: UserProfileUpdatedEvent): Promise<void> {
    await this.readModelRepository.updateUserProfile(
      event.aggregateId.toString(),
      { name: event.name, email: event.email }
    );
  }
}
```

#### 2. 聚合间协调

```typescript
// Order 聚合发布事件
export class OrderAggregate extends BaseAggregateRoot {
  public place(): void {
    this.addDomainEvent(new OrderPlacedEvent(...));
  }
}

// Inventory 聚合监听事件并响应
@EventHandler('OrderPlaced')
export class ReserveInventoryHandler implements IEventHandler<OrderPlacedEvent> {
  constructor(private readonly inventoryService: InventoryService) {}

  async handle(event: OrderPlacedEvent): Promise<void> {
    // 预留库存
    await this.inventoryService.reserveInventory(
      event.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    );
  }
}
```

#### 3. 领域逻辑解耦

```typescript
// 用户注册事件
export class UserRegisteredEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    version: number,
    tenantId: EntityId,
    public readonly username: string,
    public readonly email: string
  ) {
    super(aggregateId, version, tenantId);
  }
}

// 多个处理器处理不同的业务逻辑
@EventHandler('UserRegistered')
export class CreateDefaultRoleHandler implements IEventHandler<UserRegisteredEvent> {
  async handle(event: UserRegisteredEvent): Promise<void> {
    // 为新用户分配默认角色
  }
}

@EventHandler('UserRegistered')
export class CreateUserProfileHandler implements IEventHandler<UserRegisteredEvent> {
  async handle(event: UserRegisteredEvent): Promise<void> {
    // 创建用户档案
  }
}
```

### 集成事件使用场景

#### 1. 微服务间通信

```typescript
// 订单服务：发布集成事件
@EventHandler('OrderPlaced')
export class OrderPlacedIntegrationHandler implements IEventHandler<OrderPlacedEvent> {
  constructor(private readonly messagingService: MessagingService) {}

  async handle(event: OrderPlacedEvent): Promise<void> {
    // 通知支付服务
    await this.messagingService.publish('integration.order.placed', {
      orderId: event.aggregateId.toString(),
      amount: event.totalAmount,
      currency: event.currency,
    });
  }
}

// 支付服务：订阅集成事件
@MessageHandler('integration.order.placed')
export class ProcessPaymentHandler {
  async handle(event: IntegrationEvent): Promise<void> {
    // 处理支付逻辑
    const { orderId, amount, currency } = event.payload;
    await this.paymentService.createPayment(orderId, amount, currency);
  }
}
```

#### 2. 异步任务调度

```typescript
// 发布异步任务
@EventHandler('UserRegistered')
export class UserRegisteredTaskHandler implements IEventHandler<UserRegisteredEvent> {
  constructor(private readonly taskService: TaskService) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    // 发送验证邮件（异步任务）
    await this.taskService.publish('send-verification-email', {
      userId: event.aggregateId.toString(),
      email: event.email,
      verificationToken: await this.generateToken(),
    });

    // 生成欢迎礼包（异步任务）
    await this.taskService.publish('generate-welcome-package', {
      userId: event.aggregateId.toString(),
    });
  }
}

// 任务处理器（可能在另一个服务中）
@TaskHandler('send-verification-email')
export class SendVerificationEmailTaskHandler {
  constructor(private readonly emailService: EmailService) {}

  async handle(task: Task): Promise<void> {
    const { userId, email, verificationToken } = task.payload;
    await this.emailService.sendVerificationEmail(email, verificationToken);
  }
}
```

#### 3. 外部系统集成

```typescript
// 通知外部 CRM 系统
@EventHandler('TenantCreated')
export class SyncTenantToCrmHandler implements IEventHandler<TenantCreatedEvent> {
  constructor(private readonly messagingService: MessagingService) {}

  async handle(event: TenantCreatedEvent): Promise<void> {
    // 发布集成事件到外部系统专用队列
    await this.messagingService.publish('integration.external.crm.tenant.created', {
      tenantId: event.aggregateId.toString(),
      tenantName: event.name,
      tenantCode: event.code,
      createdAt: event.occurredAt.toISOString(),
    });
  }
}
```

---

## 最佳实践

### 1. 事件粒度

**✅ 好的做法**：事件粒度适中，包含足够的业务上下文

```typescript
// ✅ 好的事件：包含关键业务信息
export class OrderPlacedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    version: number,
    tenantId: EntityId,
    public readonly customerId: string,
    public readonly items: OrderItem[],
    public readonly totalAmount: Money,
    public readonly shippingAddress: Address
  ) {
    super(aggregateId, version, tenantId);
  }
}

// ❌ 不好的事件：信息不足
export class OrderPlacedEvent extends BaseDomainEvent {
  constructor(aggregateId: EntityId) {
    super(aggregateId, 1, EntityId.generate());
  }
}
```

### 2. 事件不可变性

**✅ 好的做法**：事件属性使用 `readonly`，发布后不可修改

```typescript
// ✅ 好的事件：使用 readonly
export class UserCreatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    version: number,
    tenantId: EntityId,
    public readonly username: string,  // readonly
    public readonly email: string      // readonly
  ) {
    super(aggregateId, version, tenantId);
  }
}

// ❌ 不好的事件：可修改属性
export class UserCreatedEvent extends BaseDomainEvent {
  public username: string;  // 可修改
  public email: string;     // 可修改
}
```

### 3. 事件版本化

**✅ 好的做法**：当事件结构需要变更时，创建新版本

```typescript
// V1: 原始版本
export class OrderPlacedEventV1 extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    version: number,
    tenantId: EntityId,
    public readonly totalAmount: number  // 简单数字
  ) {
    super(aggregateId, version, tenantId);
  }
}

// V2: 改进版本（添加货币）
export class OrderPlacedEventV2 extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    version: number,
    tenantId: EntityId,
    public readonly totalAmount: Money  // 使用值对象
  ) {
    super(aggregateId, version, tenantId);
  }

  get eventType(): string {
    return 'OrderPlaced:v2';  // 版本号在事件类型中
  }
}
```

### 4. 事件处理器幂等性

**✅ 好的做法**：事件处理器应该是幂等的

```typescript
// ✅ 幂等的事件处理器
@EventHandler('UserCreated')
export class CreateUserReadModelHandler implements IEventHandler<UserCreatedEvent> {
  async handle(event: UserCreatedEvent): Promise<void> {
    const userId = event.aggregateId.toString();
    
    // 检查是否已处理（幂等性）
    const existing = await this.readModelRepository.findById(userId);
    if (existing) {
      return; // 已处理，跳过
    }
    
    // 创建读模型
    await this.readModelRepository.create({
      id: userId,
      username: event.username,
      email: event.email,
    });
  }
}
```

### 5. 集成事件的错误处理

**✅ 好的做法**：集成事件发布失败不影响领域事件处理

```typescript
// ✅ 正确的错误处理
@EventHandler('TenantCreated')
export class TenantCreatedHandler implements IEventHandler<TenantCreatedEvent> {
  constructor(
    @Optional() private readonly messagingService?: MessagingService,
    private readonly logger: PinoLogger
  ) {}

  async handle(event: TenantCreatedEvent): Promise<void> {
    // 1. 领域逻辑（必须成功）
    await this.updateReadModel(event);
    
    // 2. 集成事件（失败不影响领域逻辑）
    if (this.messagingService) {
      try {
        await this.messagingService.publish('integration.tenant.created', {
          tenantId: event.aggregateId.toString(),
        });
      } catch (error) {
        // 记录错误，但不抛出异常
        this.logger.error('Failed to publish integration event', {
          error,
          eventType: event.eventType,
          aggregateId: event.aggregateId.toString(),
        });
        
        // 可以将失败的集成事件加入重试队列
        await this.retryQueue.add(event);
      }
    }
  }
}
```

---

## 常见问题

### Q1：领域事件和集成事件可以共用同一个事件类吗？

**A**: 不建议。领域事件和集成事件有不同的目的和生命周期，应该分别定义。

```typescript
// ❌ 不好的做法：共用事件类
export class UserCreatedEvent {
  // 既用于 EventBus，又用于 messaging
}

// ✅ 好的做法：分别定义
export class UserCreatedEvent extends BaseDomainEvent {
  // 用于 EventBus（领域事件）
}

export interface UserCreatedIntegrationEvent {
  eventType: 'integration.user.created';
  payload: { userId: string; username: string; };
  // 用于 messaging（集成事件）
}
```

### Q2：什么时候应该从领域事件转换为集成事件？

**A**: 在事件处理器中进行转换，而不是在聚合根中。

```typescript
// ✅ 正确：在事件处理器中转换
@EventHandler('UserCreated')  // 领域事件
export class UserCreatedHandler {
  async handle(event: UserCreatedEvent) {
    // 处理领域逻辑
    await this.updateReadModel(event);
    
    // 转换为集成事件发布
    await this.messagingService.publish('integration.user.created', {
      userId: event.aggregateId.toString(),
      username: event.username,
    });
  }
}

// ❌ 错误：在聚合根中直接发布集成事件
export class UserAggregate {
  public create() {
    // 不要在聚合根中直接发布集成事件
    await this.messagingService.publish('integration.user.created', {...});
  }
}
```

### Q3：领域事件一定要持久化到事件存储吗？

**A**: 如果使用事件溯源（Event Sourcing），需要持久化到事件存储。如果不使用事件溯源，可以只在内存中处理。

```typescript
// 事件溯源模式：持久化到事件存储
export class EventSourcedAggregate extends EventSourcedAggregateRoot {
  public doSomething() {
    this.apply(new SomethingHappenedEvent(...));
    // 事件会被持久化到事件存储
  }
}

// 非事件溯源模式：只在内存中处理
export class RegularAggregate extends BaseAggregateRoot {
  public doSomething() {
    this.addDomainEvent(new SomethingHappenedEvent(...));
    // 事件只在内存中，通过 EventBus 分发
  }
}
```

### Q4：集成事件失败了怎么办？

**A**: 集成事件依赖消息队列的重试机制和死信队列。

```typescript
// 配置重试策略
MessagingModule.forRoot({
  retry: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
  deadLetter: {
    enabled: true,
    queueName: 'integration-events-dlq',
  },
});

// 处理死信队列中的事件
@MessageHandler('integration-events-dlq')
export class DeadLetterQueueHandler {
  async handle(event: IntegrationEvent) {
    // 记录失败的集成事件
    this.logger.error('Integration event failed after retries', { event });
    
    // 可以触发告警或手动处理流程
    await this.alertService.sendAlert('Integration event failed', event);
  }
}
```

### Q5：如何确保事件处理的顺序？

**A**:

- **领域事件（EventBus）**：严格保证顺序
- **集成事件（messaging）**：使用相同的路由键（routing key）或分区键（partition key）

```typescript
// EventBus：自动保证顺序
@EventHandler('UserCreated')
@EventHandler('UserActivated')
// 事件按发布顺序严格处理

// Messaging：使用路由键保证顺序
await this.messagingService.publish('integration.user.created', 
  { userId: '123', ... },
  { routingKey: `user:123` }  // 相同 userId 的事件发送到同一队列
);

await this.messagingService.publish('integration.user.activated', 
  { userId: '123', ... },
  { routingKey: `user:123` }  // 保证顺序处理
);
```

---

## 参考文档

- [HL8 SAAS 平台宪章 - EventBus vs Messaging 使用指南](../.specify/memory/constitution.md#eventbus-vs-messaging-使用指南)
- [代码审查检查清单](./code-review-checklist.md)
- [领域层开发指南](./06-DOMAIN_LAYER_DEVELOPMENT_GUIDE.md)
- [应用层开发指南](./07-APPLICATION_LAYER_DEVELOPMENT_GUIDE.md)

---

## 版本历史

- **1.0.0** (2025-10-09): 初始版本，基于宪章 v1.4.1 的事件使用指南
