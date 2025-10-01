# 领域驱动设计（DDD）

> **版本**: 1.0.0  
> **更新日期**: 2025-10-01

---

## 📋 目录

- [1. DDD核心概念](#1-ddd核心概念)
- [2. 充血模型理论](#2-充血模型理论)
- [3. 实体与聚合根](#3-实体与聚合根)
- [4. 值对象](#4-值对象)
- [5. 领域服务](#5-领域服务)
- [6. 服务层职责](#6-服务层职责)

---

## 1. DDD核心概念

### 1.1 核心构建块

- **Entity (实体)**: 具有唯一标识符的对象
- **Value Object (值对象)**: 没有标识符的不可变对象
- **Aggregate Root (聚合根)**: 管理聚合内对象的根实体
- **Domain Service (领域服务)**: 不属于任何实体的业务逻辑
- **Repository (仓储)**: 数据持久化接口
- **Domain Event (领域事件)**: 业务事实的记录

### 1.2 为什么使用 DDD

1. **业务为中心**: 代码反映业务逻辑
2. **统一语言**: 技术和业务使用相同术语
3. **清晰边界**: 明确的领域边界和上下文
4. **易于维护**: 业务逻辑集中，易于理解和修改

---

## 2. 充血模型理论

### 2.1 什么是充血模型

**充血模型（Rich Domain Model）**: 实体不仅包含数据，还包含业务逻辑和行为。

#### 核心特征

1. **业务逻辑在实体内**: 实体是业务规则的载体
2. **封装内部状态**: 私有属性，公开行为
3. **自我验证**: 实体保证自身始终有效
4. **行为驱动**: 通过方法改变状态，而非直接修改属性

### 2.2 充血模型 vs 贫血模型

#### 贫血模型（Anemic Domain Model）

```typescript
// ❌ 贫血模型：实体只是数据容器
class Order {
  id: string;
  status: string;
  items: OrderItem[];
  
  getStatus(): string {
    return this.status;
  }
  
  setStatus(status: string): void {
    this.status = status;
  }
}

// 业务逻辑在服务层
class OrderService {
  placeOrder(order: Order): void {
    // ❌ 业务规则在服务层
    if (order.items.length === 0) {
      throw new Error('Order must have items');
    }
    if (order.status !== 'draft') {
      throw new Error('Only draft orders can be placed');
    }
    order.setStatus('placed');
  }
}
```

**问题**:

- ❌ 业务逻辑分散在服务层
- ❌ 实体退化为数据容器
- ❌ 业务规则难以复用
- ❌ 容易产生非法状态

#### 充血模型（Rich Domain Model）

```typescript
// ✅ 充血模型：实体包含业务逻辑
class Order extends BaseEntity {
  private id: OrderId;
  private status: OrderStatus;
  private items: OrderItem[];
  
  place(): void {
    // ✅ 业务规则在实体内
    this.ensureIsDraft();
    this.ensureHasItems();
    
    this.status = OrderStatus.Placed;
    this.addDomainEvent(new OrderPlacedEvent(this.id));
  }
  
  private ensureIsDraft(): void {
    if (this.status !== OrderStatus.Draft) {
      throw new OrderNotDraftException(this.id);
    }
  }
  
  private ensureHasItems(): void {
    if (this.items.length === 0) {
      throw new OrderHasNoItemsException(this.id);
    }
  }
}

// 服务层只负责协调
class OrderService {
  async placeOrder(orderId: string): Promise<void> {
    const order = await this.repository.findById(orderId);
    order.place(); // 调用实体方法
    await this.repository.save(order);
    await this.eventBus.publishAll(order.getDomainEvents());
  }
}
```

**优势**:

- ✅ 业务逻辑集中在实体
- ✅ 实体保护自己的不变性
- ✅ 业务规则可复用
- ✅ 代码更接近业务语言

### 2.3 为什么本项目使用充血模型

1. **复杂业务规则**: SAAS平台有复杂的租户、权限、订阅等业务逻辑
2. **高可维护性**: 业务逻辑集中，易于理解和修改
3. **可测试性**: 实体可以独立测试，无需依赖基础设施
4. **团队协作**: 清晰的职责划分，减少冲突

---

## 3. 实体与聚合根

### 3.1 实体（Entity）

实体具有：

- 唯一标识符（ID）
- 生命周期
- 业务逻辑

```typescript
export class User extends BaseEntity {
  private readonly id: UserId;  // 不可变标识符
  private email: Email;
  private status: UserStatus;
  
  // 业务方法
  activate(): void {
    this.ensureIsPending();
    this.status = UserStatus.Active;
    this.addDomainEvent(new UserActivatedEvent(this.id));
  }
}
```

### 3.2 聚合（Aggregate）

聚合是一组相关对象的集合，有以下特点：

- **一致性边界**: 聚合内保证强一致性
- **事务边界**: 一个事务只修改一个聚合
- **访问入口**: 通过聚合根访问聚合内对象

```typescript
// ✅ 订单聚合
class OrderAggregateRoot extends BaseAggregateRoot {
  private order: OrderEntity;
  private items: OrderItem[];  // 聚合内对象
  
  // 通过聚合根操作聚合内对象
  addItem(product: Product, quantity: number): void {
    this.order.ensureIsDraft();
    
    const item = OrderItem.create(product, quantity);
    this.items.push(item);
    
    // 维护聚合一致性
    this.recalculateTotal();
  }
}
```

### 3.3 聚合设计原则

#### 1. 聚合应该尽可能小

```typescript
// ✅ 正确：小聚合
class Order extends BaseAggregateRoot {
  private items: OrderItem[];  // 聚合内
  private customerId: CustomerId;  // ID引用
}

// ❌ 错误：大聚合
class Order extends BaseAggregateRoot {
  private items: OrderItem[];
  private customer: Customer;  // ❌ 应该用ID引用
  private payments: Payment[];  // ❌ 应该是独立聚合
}
```

#### 2. 聚合间通过ID引用

```typescript
// ✅ 正确
class Order extends BaseAggregateRoot {
  private customerId: CustomerId;  // ID引用
  
  getCustomerId(): CustomerId {
    return this.customerId;
  }
}

// 应用服务协调多个聚合
class OrderService {
  async getOrderDetails(orderId: string) {
    const order = await this.orderRepository.findById(orderId);
    const customer = await this.customerRepository.findById(
      order.getCustomerId()
    );
    return { order, customer };
  }
}
```

#### 3. 一个事务只修改一个聚合

```typescript
// ✅ 正确：单个聚合事务
async placeOrder(orderId: string): Promise<void> {
  const order = await this.orderRepository.findById(orderId);
  order.place();
  await this.orderRepository.save(order);
}

// ⚠️ 注意：多个聚合修改需要最终一致性
async processPayment(orderId: string, paymentId: string): Promise<void> {
  // 方案1：使用领域事件实现最终一致性
  const order = await this.orderRepository.findById(orderId);
  order.confirmPayment();
  await this.orderRepository.save(order);
  // 发布事件，由另一个处理器处理 Payment 聚合
  
  // 方案2：使用Saga模式协调多个聚合
}
```

---

## 4. 值对象

### 4.1 值对象特征

- **不可变**: 创建后不能修改
- **无标识符**: 通过值比较相等性
- **自我验证**: 构造时验证
- **可替换**: 需要修改时创建新对象

### 4.2 何时使用值对象

使用值对象封装：

- ✅ 需要验证的简单值（Email、Phone、URL）
- ✅ 需要计算的值（Money、Quantity、DateRange）
- ✅ 具有业务含义的值（Address、PersonName）
- ✅ 需要保证不变性的值

### 4.3 值对象设计

详见：[充血模型实践 - 值对象设计](../guidelines/02-rich-domain-model-practice.md#5-值对象设计)

---

## 5. 领域服务

### 5.1 何时使用领域服务

当业务逻辑满足以下条件时使用领域服务：

- ✅ 不自然属于任何单一实体
- ✅ 涉及多个实体或聚合
- ✅ 是重要的业务逻辑
- ✅ 是纯领域概念（无基础设施依赖）

### 5.2 领域服务设计

```typescript
/**
 * 价格计算领域服务
 *
 * @description 处理跨实体的定价业务逻辑
 */
export class PricingDomainService {
  calculatePrice(
    items: OrderItem[],
    customer: Customer,
    coupon?: Coupon
  ): Money {
    // 跨实体的业务逻辑
    let total = this.calculateSubtotal(items);
    
    if (customer.isVip()) {
      total = total.multiply(0.95);
    }
    
    if (coupon) {
      total = coupon.applyDiscount(total);
    }
    
    return total;
  }
}
```

---

## 6. 服务层职责

### 6.1 职责对比

| 层 | 职责 | 示例 |
|---|------|------|
| **实体/聚合** | 单个实体的业务规则 | `user.activate()` |
| **领域服务** | 跨实体的业务规则 | `pricingService.calculate()` |
| **应用服务** | 用例编排、协调 | 加载聚合、调用方法、持久化 |

### 6.2 应用服务职责

应用服务应该：

1. ✅ **协调领域对象**: 加载和保存聚合
2. ✅ **事务管理**: 保证数据一致性
3. ✅ **事件发布**: 发布领域事件
4. ✅ **外部服务集成**: 调用外部API
5. ✅ **权限检查**: 验证用户权限

应用服务不应该：

1. ❌ **包含业务规则**: 业务逻辑应该在实体或领域服务
2. ❌ **直接操作数据**: 应该通过仓储
3. ❌ **绕过实体封装**: 不应该直接修改实体属性

---

## 📚 扩展阅读

### 理论到实践

- 📖 [充血模型实践指南](../guidelines/02-rich-domain-model-practice.md) - 如何编写充血实体
- 📖 [架构设计原则](./01-architecture-principles.md) - 整体架构规则
- 📖 [CQRS与事件溯源](./03-cqrs-event-sourcing.md) - 命令查询分离

---

**返回**: [架构文档中心](./README.md)
