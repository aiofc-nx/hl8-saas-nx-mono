# 事件驱动架构

> **版本**: 1.0.0  
> **更新日期**: 2025-10-01

---

## 核心概念

**Event-Driven Architecture (EDA)**: 通过事件进行系统间通信

### 特点

- **异步处理**: 提升系统响应性能
- **松耦合**: 模块间通过事件通信
- **可扩展**: 支持水平扩展

---

## 事件类型

### 领域事件

```typescript
export class UserActivatedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly activatedAt: Date
  ) {
    super();
  }
}
```

### 集成事件

```typescript
export class OrderPlacedIntegrationEvent {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly total: number
  ) {}
}
```

---

## 事件发布订阅

### 发布事件

```typescript
class Order extends BaseEntity {
  place(): void {
    this.status = OrderStatus.Placed;
    this.addDomainEvent(new OrderPlacedEvent(this.id));
  }
}
```

### 订阅事件

```typescript
@EventHandler(OrderPlacedEvent)
export class SendOrderConfirmationHandler {
  async handle(event: OrderPlacedEvent): Promise<void> {
    await this.emailService.sendOrderConfirmation(event);
  }
}
```

---

**返回**: [架构文档中心](./README.md)
