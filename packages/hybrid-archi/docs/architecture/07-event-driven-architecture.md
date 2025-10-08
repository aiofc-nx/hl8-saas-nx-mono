# 事件驱动架构 (Event-Driven Architecture) 设计文档

> **文档版本**: 1.0.0  
> **创建日期**: 2025-01-27  

---

## 📋 目录

- [1. 事件驱动架构概述](#1-事件驱动架构概述)
- [2. 核心概念](#2-核心概念)
- [3. 架构设计](#3-架构设计)
- [4. 实现指南](#4-实现指南)
- [5. 最佳实践](#5-最佳实践)

---

## 1. 事件驱动架构概述

### 1.1 定义

事件驱动架构 (Event-Driven Architecture, EDA) 是一种软件架构模式，系统的各个组件通过产生、检测和响应事件来进行通信。

### 1.2 核心思想

```
同步调用方式（传统）:
Service A ──直接调用──▶ Service B ──直接调用──▶ Service C
    │                      │                      │
    └──────等待响应────────┴──────等待响应────────┘
    (紧耦合，同步阻塞)

事件驱动方式:
Service A ──发布事件──▶ Event Bus
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
          Service B   Service C   Service D
          (异步订阅，松耦合)
```

### 1.3 优势

- ✅ **解耦**：服务间松耦合，独立演化
- ✅ **异步**：异步处理，提升性能
- ✅ **可扩展**：易于添加新的事件消费者
- ✅ **弹性**：服务故障不影响事件发布
- ✅ **事件溯源**：与 Event Sourcing 天然结合

### 1.4 挑战

- ⚠️ **最终一致性**：需要接受最终一致性
- ⚠️ **调试困难**：异步流程难以追踪
- ⚠️ **事件顺序**：需要保证事件顺序
- ⚠️ **重复处理**：需要幂等性设计

---

## 2. 核心概念

### 2.1 事件总线 (Event Bus)

```typescript
/**
 * 事件总线接口
 */
export interface IEventBus {
  /**
   * 发布单个事件
   */
  publish<TEvent extends BaseDomainEvent>(event: TEvent): Promise<void>;

  /**
   * 批量发布事件
   */
  publishAll<TEvent extends BaseDomainEvent>(events: TEvent[]): Promise<void>;

  /**
   * 注册事件处理器
   */
  registerHandler(eventType: string, handler: IEventHandler): void;

  /**
   * 取消注册事件处理器
   */
  unregisterHandler(eventType: string, handlerId: string): void;
}
```

### 2.2 事件处理器 (Event Handler)

```typescript
/**
 * 事件处理器接口
 */
export interface IEventHandler<TEvent extends BaseDomainEvent = BaseDomainEvent> {
  /**
   * 处理事件
   */
  handle(event: TEvent): Promise<void>;

  /**
   * 获取支持的事件类型
   */
  getSupportedEventType(): string;

  /**
   * 处理失败时的回调
   */
  handleFailure?(event: TEvent, error: Error): Promise<void>;

  /**
   * 获取最大重试次数
   */
  getMaxRetries?(): number;

  /**
   * 获取重试延迟
   */
  getRetryDelay?(): number;
}
```

### 2.3 事件发布订阅模式

```
┌─────────────────────────────────────────────────────────┐
│            Event Publish-Subscribe Pattern              │
└─────────────────────────────────────────────────────────┘

发布者 (Publisher):
┌──────────────┐
│   Service A  │
│ (User Domain)│
└───────┬──────┘
        │ publishes
        ▼
   ┌──────────┐
   │UserCreated│
   │  Event   │
   └────┬─────┘
        │
        ▼
┌────────────────┐
│   Event Bus    │
└────┬─────┬─────┘
     │     │
     │     └──────────────┐
     │                    │
订阅者 (Subscribers):      │
     ▼                    ▼
┌──────────────┐    ┌──────────────┐
│  Service B   │    │  Service C   │
│(Email Domain)│    │(Audit Domain)│
└──────────────┘    └──────────────┘
```

---

## 3. 架构设计

### 3.1 事件总线实现

```typescript
/**
 * 事件总线实现
 */
@Injectable()
export class EventBus implements IEventBus {
  private readonly handlers = new Map<string, IEventHandler[]>();

  async publish<TEvent extends BaseDomainEvent>(event: TEvent): Promise<void> {
    const eventType = event.eventType;
    const handlers = this.handlers.get(eventType) || [];

    // 异步并行执行所有处理器
    await Promise.all(
      handlers.map(handler => this.executeHandler(handler, event))
    );
  }

  async publishAll<TEvent extends BaseDomainEvent>(events: TEvent[]): Promise<void> {
    // 按顺序发布事件，保证事件顺序
    for (const event of events) {
      await this.publish(event);
    }
  }

  registerHandler(eventType: string, handler: IEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  private async executeHandler(
    handler: IEventHandler,
    event: BaseDomainEvent
  ): Promise<void> {
    const maxRetries = handler.getMaxRetries?.() || 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await handler.handle(event);
        return;
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          await handler.handleFailure?.(event, error as Error);
          throw error;
        }
        // 等待后重试
        await this.delay(handler.getRetryDelay?.() || 1000);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 4. 实现指南

### 4.1 定义领域事件

```typescript
/**
 * 订单确认事件
 */
export class OrderConfirmedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string,
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly totalAmount: number,
    public readonly items: OrderItemDto[]
  ) {
    super(aggregateId, aggregateVersion, tenantId);
  }

  get eventType(): string {
    return 'OrderConfirmed';
  }

  override get eventData(): Record<string, unknown> {
    return {
      orderId: this.orderId,
      customerId: this.customerId,
      totalAmount: this.totalAmount,
      items: this.items,
    };
  }
}
```

### 4.2 实现事件处理器

```typescript
/**
 * 订单确认事件处理器 - 发送确认邮件
 */
@EventHandler('OrderConfirmed')
export class OrderConfirmedEmailHandler implements IEventHandler<OrderConfirmedEvent> {
  constructor(
    private readonly emailService: IEmailService
  ) {}

  async handle(event: OrderConfirmedEvent): Promise<void> {
    // 1. 查询客户信息
    const customer = await this.getCustomer(event.customerId);
    
    // 2. 发送确认邮件
    await this.emailService.send({
      to: customer.email,
      subject: '订单确认',
      body: `您的订单 ${event.orderId} 已确认，总金额 ${event.totalAmount}`,
    });
  }

  getSupportedEventType(): string {
    return 'OrderConfirmed';
  }

  getMaxRetries(): number {
    return 5;  // 邮件发送失败重试5次
  }

  getRetryDelay(): number {
    return 2000;  // 2秒后重试
  }

  async handleFailure(event: OrderConfirmedEvent, error: Error): Promise<void> {
    // 记录失败日志
    console.error('Failed to send order confirmation email:', error);
    // 可以将失败事件发送到死信队列
  }

  private async getCustomer(customerId: string): Promise<Customer> {
    // 查询客户信息
    return await this.customerService.findById(customerId);
  }
}

/**
 * 订单确认事件处理器 - 更新库存
 */
@EventHandler('OrderConfirmed')
export class OrderConfirmedInventoryHandler implements IEventHandler<OrderConfirmedEvent> {
  constructor(
    private readonly inventoryService: IInventoryService
  ) {}

  async handle(event: OrderConfirmedEvent): Promise<void> {
    // 减少库存
    for (const item of event.items) {
      await this.inventoryService.reduceStock(item.productId, item.quantity);
    }
  }

  getSupportedEventType(): string {
    return 'OrderConfirmed';
  }
}
```

---

## 5. 最佳实践

### 5.1 事件设计最佳实践

#### ✅ DO - 应该做的

1. **事件不可变**
2. **事件命名使用过去式**
3. **事件包含完整信息**
4. **事件处理幂等性**

#### ❌ DON'T - 不应该做的

1. **不要修改已发布的事件**
2. **不要在事件中包含复杂对象**
3. **不要依赖事件处理顺序（跨聚合）**

---

**文档维护**: HL8 架构团队  
**最后更新**: 2025-01-27
