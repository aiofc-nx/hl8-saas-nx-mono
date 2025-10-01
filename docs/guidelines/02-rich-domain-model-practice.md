# 充血模型实践指南

> **Rich Domain Model Development Guide**  
> **版本**: 1.0.0  
> **更新日期**: 2025-10-01

---

## 📋 目录

- [1. 什么是充血模型](#1-什么是充血模型)
- [2. 为什么使用充血模型](#2-为什么使用充血模型)
- [3. 充血模型 vs 贫血模型](#3-充血模型-vs-贫血模型)
- [4. 实体设计原则](#4-实体设计原则)
- [5. 值对象设计](#5-值对象设计)
- [6. 聚合根设计](#6-聚合根设计)
- [7. 服务层职责](#7-服务层职责)
- [8. 领域事件](#8-领域事件)
- [9. 实践案例](#9-实践案例)
- [10. 常见问题](#10-常见问题)

> 📖 **理论基础**: [领域驱动设计](../architecture/02-domain-driven-design.md)

---

## 1. 什么是充血模型

**充血模型（Rich Domain Model）** 是一种领域驱动设计模式，其中：

- **实体不仅包含数据，还包含业务逻辑**
- **业务规则封装在领域对象内部**
- **实体具有行为，能够保护自己的不变性**

与之相对的是**贫血模型（Anemic Domain Model）**，实体只是数据容器，业务逻辑在服务层。

---

## 2. 为什么使用充血模型

### 2.1 优势

1. **业务逻辑集中**: 相关的业务规则集中在实体内，易于理解和维护
2. **封装性好**: 实体保护自己的不变性，防止非法状态
3. **可测试性强**: 实体的业务逻辑可以独立测试，无需依赖基础设施
4. **可复用性高**: 业务逻辑可以在不同场景下复用
5. **领域语言**: 代码更接近业务语言，易于沟通

### 2.2 适用场景

- ✅ 复杂的业务规则
- ✅ 需要保证数据一致性的场景
- ✅ 业务逻辑频繁变化的项目
- ✅ 需要高度可维护性的系统
- ✅ 团队规模较大，需要清晰的职责划分

---

## 3. 充血模型 vs 贫血模型

### 3.1 对比示例

#### 贫血模型（不推荐）

```typescript
// ❌ 实体只是数据容器
class Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  
  // 只有getter/setter
  getItems(): OrderItem[] {
    return this.items;
  }
  
  setStatus(status: string): void {
    this.status = status;
  }
  
  addItem(item: OrderItem): void {
    this.items.push(item);
  }
}

// 业务逻辑在服务层
class OrderService {
  placeOrder(order: Order): void {
    // ❌ 业务规则散落在服务层
    if (order.getItems().length === 0) {
      throw new Error('Order must have items');
    }
    
    // ❌ 计算逻辑在服务层
    let total = 0;
    for (const item of order.getItems()) {
      total += item.price * item.quantity;
    }
    order.totalAmount = total;
    
    // ❌ 状态转换逻辑在服务层
    if (order.status !== 'draft') {
      throw new Error('Only draft orders can be placed');
    }
    order.setStatus('placed');
  }
}
```

#### 充血模型（推荐）

```typescript
// ✅ 实体包含业务逻辑
class Order extends BaseEntity {
  private id: OrderId;
  private items: OrderItem[];
  private status: OrderStatus;
  
  private constructor(id: OrderId) {
    super(id);
    this.id = id;
    this.items = [];
    this.status = OrderStatus.Draft;
  }
  
  /**
   * 创建订单
   *
   * @description 工厂方法创建订单
   */
  static create(id: OrderId): Order {
    return new Order(id);
  }
  
  /**
   * 添加订单项
   *
   * @description 添加商品到订单
   *
   * ## 业务规则
   * - 只有草稿状态的订单才能添加商品
   * - 商品数量必须大于0
   * - 相同商品会合并数量
   *
   * @param product - 商品
   * @param quantity - 数量
   */
  addItem(product: Product, quantity: number): void {
    this.ensureIsDraft();
    this.ensureValidQuantity(quantity);
    
    const existingItem = this.findItemByProduct(product);
    if (existingItem) {
      existingItem.increaseQuantity(quantity);
    } else {
      this.items.push(OrderItem.create(product, quantity));
    }
  }
  
  /**
   * 提交订单
   *
   * @description 将订单从草稿状态提交
   *
   * ## 业务规则
   * - 订单必须包含商品
   * - 只有草稿状态的订单才能提交
   * - 提交后发布领域事件
   */
  place(): void {
    this.ensureIsDraft();
    this.ensureHasItems();
    
    this.status = OrderStatus.Placed;
    this.addDomainEvent(new OrderPlacedEvent(this.id, this.calculateTotal()));
  }
  
  /**
   * 计算订单总金额
   *
   * @description 计算所有订单项的总金额
   *
   * @returns 订单总金额
   */
  calculateTotal(): Money {
    return this.items.reduce(
      (total, item) => total.add(item.getSubtotal()),
      Money.zero()
    );
  }
  
  // 私有方法：封装业务规则检查
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
  
  private ensureValidQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw new InvalidQuantityException(quantity);
    }
  }
  
  private findItemByProduct(product: Product): OrderItem | undefined {
    return this.items.find(item => item.getProductId().equals(product.getId()));
  }
  
  // Getter方法：只读访问
  getId(): OrderId {
    return this.id;
  }
  
  getItems(): ReadonlyArray<OrderItem> {
    return [...this.items]; // 返回副本，保护内部状态
  }
  
  getStatus(): OrderStatus {
    return this.status;
  }
}

// 服务层只负责协调
class OrderService {
  async placeOrder(orderId: string): Promise<void> {
    // 1. 加载聚合
    const order = await this.orderRepository.findById(orderId);
    
    // 2. 调用实体方法（业务逻辑在实体内）
    order.place();
    
    // 3. 持久化
    await this.orderRepository.save(order);
    
    // 4. 发布事件
    await this.eventBus.publishAll(order.getDomainEvents());
  }
}
```

---

## 4. 实体设计原则

### 4.1 单一职责原则

每个实体只负责自己的业务逻辑：

```typescript
// ✅ 正确：实体只管理自己的状态
class Order extends BaseEntity {
  // 订单相关的业务逻辑
  place(): void { }
  cancel(): void { }
  ship(): void { }
}

// ❌ 错误：实体包含其他职责
class Order extends BaseEntity {
  // ❌ 不应该包含支付逻辑
  processPayment(): void { }
  
  // ❌ 不应该包含发送邮件逻辑
  sendConfirmationEmail(): void { }
}
```

### 4.2 封装原则

保护实体的内部状态：

```typescript
// ✅ 正确：私有属性，公开行为
class Account extends BaseEntity {
  private balance: Money;
  
  deposit(amount: Money): void {
    this.ensurePositiveAmount(amount);
    this.balance = this.balance.add(amount);
    this.addDomainEvent(new DepositedEvent(this.id, amount));
  }
  
  withdraw(amount: Money): void {
    this.ensurePositiveAmount(amount);
    this.ensureSufficientBalance(amount);
    this.balance = this.balance.subtract(amount);
    this.addDomainEvent(new WithdrawnEvent(this.id, amount));
  }
  
  // ✅ 只读访问
  getBalance(): Money {
    return this.balance;
  }
  
  // ❌ 不提供setter
  // setBalance(balance: Money): void { }
  
  private ensurePositiveAmount(amount: Money): void {
    if (amount.isNegativeOrZero()) {
      throw new InvalidAmountException(amount);
    }
  }
  
  private ensureSufficientBalance(amount: Money): void {
    if (this.balance.isLessThan(amount)) {
      throw new InsufficientBalanceException(this.balance, amount);
    }
  }
}
```

### 4.3 不变性原则

关键属性应该是不可变的：

```typescript
class User extends BaseEntity {
  // ✅ ID 不可变
  private readonly id: UserId;
  
  // ✅ 创建时间不可变
  private readonly createdAt: Date;
  
  // 可变属性
  private email: Email;
  private status: UserStatus;
  
  constructor(id: UserId, email: Email) {
    super(id);
    this.id = id;
    this.email = email;
    this.createdAt = new Date();
  }
  
  // ❌ 不允许修改ID
  // setId(id: UserId): void { }
}
```

### 4.4 自我验证原则

实体保证自己始终处于有效状态：

```typescript
class Product extends BaseEntity {
  private name: ProductName;
  private price: Money;
  private stock: number;
  
  constructor(id: ProductId, name: ProductName, price: Money, stock: number) {
    super(id);
    
    // 构造时验证
    this.ensureValidPrice(price);
    this.ensureValidStock(stock);
    
    this.name = name;
    this.price = price;
    this.stock = stock;
  }
  
  updatePrice(newPrice: Money): void {
    // 状态变更时验证
    this.ensureValidPrice(newPrice);
    this.price = newPrice;
  }
  
  reduceStock(quantity: number): void {
    // 业务规则验证
    if (quantity > this.stock) {
      throw new InsufficientStockException(this.stock, quantity);
    }
    this.stock -= quantity;
  }
  
  private ensureValidPrice(price: Money): void {
    if (price.isNegativeOrZero()) {
      throw new InvalidPriceException(price);
    }
  }
  
  private ensureValidStock(stock: number): void {
    if (stock < 0) {
      throw new InvalidStockException(stock);
    }
  }
}
```

---

## 5. 值对象设计

值对象是充血模型的重要组成部分，用于封装验证逻辑和领域概念。

### 5.1 值对象特征

- **不可变**: 一旦创建不能修改
- **无标识符**: 通过值比较相等性
- **自我验证**: 保证始终有效
- **可替换**: 可以整体替换

### 5.2 值对象示例

```typescript
/**
 * 邮箱值对象
 *
 * @description 封装邮箱验证逻辑
 */
class Email {
  private readonly value: string;
  
  constructor(email: string) {
    this.validate(email);
    this.value = email.toLowerCase().trim();
  }
  
  private validate(email: string): void {
    if (!email) {
      throw new EmailRequiredException();
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new InvalidEmailFormatException(email);
    }
    
    if (email.length > 255) {
      throw new EmailTooLongException(email);
    }
  }
  
  equals(other: Email): boolean {
    if (!(other instanceof Email)) {
      return false;
    }
    return this.value === other.value;
  }
  
  toString(): string {
    return this.value;
  }
  
  getDomain(): string {
    return this.value.split('@')[1];
  }
}
```

```typescript
/**
 * 金额值对象
 *
 * @description 封装金额计算和验证逻辑
 */
class Money {
  private readonly amount: number;
  private readonly currency: string;
  
  private constructor(amount: number, currency: string) {
    this.validate(amount, currency);
    this.amount = amount;
    this.currency = currency;
  }
  
  static create(amount: number, currency: string): Money {
    return new Money(amount, currency);
  }
  
  static zero(currency: string = 'CNY'): Money {
    return new Money(0, currency);
  }
  
  private validate(amount: number, currency: string): void {
    if (!Number.isFinite(amount)) {
      throw new InvalidAmountException(amount);
    }
    
    if (!currency || currency.length !== 3) {
      throw new InvalidCurrencyException(currency);
    }
  }
  
  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }
  
  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }
  
  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }
  
  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount > other.amount;
  }
  
  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount < other.amount;
  }
  
  isNegativeOrZero(): boolean {
    return this.amount <= 0;
  }
  
  equals(other: Money): boolean {
    if (!(other instanceof Money)) {
      return false;
    }
    return this.amount === other.amount && this.currency === other.currency;
  }
  
  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchException(this.currency, other.currency);
    }
  }
  
  getAmount(): number {
    return this.amount;
  }
  
  getCurrency(): string {
    return this.currency;
  }
}
```

### 5.3 何时使用值对象

使用值对象封装：

- ✅ 需要验证的简单值（Email、Phone、URL等）
- ✅ 需要计算逻辑的值（Money、Quantity等）
- ✅ 具有业务含义的值（Address、DateRange等）
- ✅ 需要保证不变性的值

---

## 6. 聚合根设计

### 6.1 聚合根职责

聚合根是聚合的入口，负责：

1. **维护聚合内的一致性边界**
2. **控制对聚合内对象的访问**
3. **发布领域事件**

### 6.2 聚合设计原则

```typescript
/**
 * 订单聚合根
 *
 * @description 管理订单及其订单项的一致性
 */
class OrderAggregateRoot extends BaseAggregateRoot {
  private order: OrderEntity;
  private items: OrderItem[];
  private coupon?: Coupon;
  
  /**
   * 添加订单项
   *
   * @description 添加商品到订单，维护聚合一致性
   *
   * ## 业务规则
   * - 订单必须处于草稿状态
   * - 商品必须有库存
   * - 计算总金额时考虑优惠券
   */
  addItem(product: Product, quantity: number): void {
    // 1. 检查订单状态（聚合根职责）
    this.order.ensureIsDraft();
    
    // 2. 检查库存（可能需要领域服务）
    if (!product.hasStock(quantity)) {
      throw new InsufficientStockException(product.getId(), quantity);
    }
    
    // 3. 添加订单项
    const item = OrderItem.create(product, quantity);
    this.items.push(item);
    
    // 4. 重新计算总金额（聚合根维护一致性）
    this.recalculateTotal();
  }
  
  /**
   * 应用优惠券
   *
   * @description 为订单应用优惠券
   *
   * ## 业务规则
   * - 检查优惠券是否可用
   * - 检查订单金额是否满足条件
   * - 重新计算折扣后金额
   */
  applyCoupon(coupon: Coupon): void {
    this.order.ensureIsDraft();
    
    // 聚合根级别的业务规则
    if (!coupon.isValid()) {
      throw new CouponInvalidException(coupon.getId());
    }
    
    const orderTotal = this.calculateSubtotal();
    if (!coupon.canApplyTo(orderTotal)) {
      throw new CouponNotApplicableException(coupon.getId(), orderTotal);
    }
    
    this.coupon = coupon;
    this.recalculateTotal();
  }
  
  /**
   * 提交订单
   *
   * @description 提交订单，触发后续流程
   */
  async place(): Promise<void> {
    this.order.ensureIsDraft();
    this.ensureHasItems();
    
    // 聚合内所有对象的状态转换
    this.order.place();
    this.items.forEach(item => item.lock());
    
    // 发布聚合级别的事件
    this.addDomainEvent(
      new OrderPlacedEvent(
        this.order.getId(),
        this.items.map(item => item.toDto()),
        this.calculateTotal()
      )
    );
  }
  
  // 私有方法：聚合内的计算逻辑
  private calculateSubtotal(): Money {
    return this.items.reduce(
      (total, item) => total.add(item.getSubtotal()),
      Money.zero()
    );
  }
  
  private recalculateTotal(): void {
    let total = this.calculateSubtotal();
    
    if (this.coupon) {
      total = this.coupon.applyDiscount(total);
    }
    
    this.order.updateTotal(total);
  }
  
  private ensureHasItems(): void {
    if (this.items.length === 0) {
      throw new OrderHasNoItemsException(this.order.getId());
    }
  }
}
```

### 6.3 聚合边界

**聚合应该尽可能小**：

```typescript
// ✅ 正确：小聚合
class Order extends BaseAggregateRoot {
  private items: OrderItem[]; // 聚合内
  // 只包含订单和订单项
}

// ❌ 错误：大聚合
class Order extends BaseAggregateRoot {
  private items: OrderItem[];
  private customer: Customer; // ❌ 应该通过ID引用
  private payments: Payment[]; // ❌ 应该是独立聚合
  private shipments: Shipment[]; // ❌ 应该是独立聚合
}
```

**聚合间通过ID引用**：

```typescript
// ✅ 正确：使用ID引用其他聚合
class Order extends BaseAggregateRoot {
  private customerId: CustomerId; // 引用Customer聚合
  private items: OrderItem[];
  
  getCustomerId(): CustomerId {
    return this.customerId;
  }
}

// 服务层协调多个聚合
class OrderService {
  async getOrderDetails(orderId: string): Promise<OrderDetailsDto> {
    const order = await this.orderRepository.findById(orderId);
    const customer = await this.customerRepository.findById(
      order.getCustomerId()
    );
    
    return {
      order: order.toDto(),
      customer: customer.toDto(),
    };
  }
}
```

---

## 7. 服务层职责

### 7.1 应用服务职责

应用服务负责：

1. **协调领域对象**: 加载和保存聚合
2. **事务管理**: 保证数据一致性
3. **事件发布**: 发布领域事件
4. **外部服务集成**: 调用外部API或服务
5. **权限检查**: 验证用户权限（也可以在守卫层）

```typescript
@Injectable()
export class UserApplicationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    private readonly eventBus: EventBus,
    private readonly unitOfWork: UnitOfWork
  ) {}
  
  /**
   * 注册用户
   *
   * @description 协调用户注册流程
   */
  async register(command: RegisterUserCommand): Promise<UserId> {
    return await this.unitOfWork.transaction(async () => {
      // 1. 检查唯一性约束（基础设施关注点）
      const exists = await this.userRepository.existsByEmail(command.email);
      if (exists) {
        throw new UserEmailExistsException(command.email);
      }
      
      // 2. 创建实体（业务逻辑在实体内）
      const user = User.create(
        UserId.generate(),
        new Email(command.email),
        HashedPassword.fromPlainText(command.password)
      );
      
      // 3. 持久化
      await this.userRepository.save(user);
      
      // 4. 外部服务协调
      await this.emailService.sendActivationEmail(
        user.getEmail(),
        user.getActivationToken()
      );
      
      // 5. 发布事件
      await this.eventBus.publishAll(user.getDomainEvents());
      
      return user.getId();
    });
  }
}
```

### 7.2 领域服务职责

领域服务处理不属于单一实体的业务逻辑：

```typescript
/**
 * 价格计算领域服务
 *
 * @description 处理跨实体的价格计算逻辑
 */
@Injectable()
export class PricingDomainService {
  /**
   * 计算订单价格
   *
   * @description 根据商品、数量、优惠券等计算最终价格
   *
   * ## 业务规则
   * - 会员享受折扣
   * - 优惠券有最低消费要求
   * - 运费根据重量和距离计算
   */
  calculateOrderPrice(
    items: OrderItem[],
    customer: Customer,
    coupon?: Coupon
  ): Money {
    // 计算商品总价
    let total = items.reduce(
      (sum, item) => sum.add(item.getSubtotal()),
      Money.zero()
    );
    
    // 应用会员折扣
    if (customer.isVip()) {
      total = total.multiply(0.95); // 95折
    }
    
    // 应用优惠券
    if (coupon && coupon.canApplyTo(total)) {
      total = coupon.applyDiscount(total);
    }
    
    // 计算运费
    const shippingFee = this.calculateShippingFee(items);
    total = total.add(shippingFee);
    
    return total;
  }
  
  private calculateShippingFee(items: OrderItem[]): Money {
    // 运费计算逻辑
    const totalWeight = items.reduce(
      (sum, item) => sum + item.getWeight(),
      0
    );
    
    if (totalWeight < 1) {
      return Money.create(10, 'CNY');
    } else if (totalWeight < 5) {
      return Money.create(20, 'CNY');
    } else {
      return Money.create(30, 'CNY');
    }
  }
}
```

### 7.3 职责对比表

| 职责 | 实体/聚合根 | 领域服务 | 应用服务 |
|------|-----------|---------|---------|
| 单个实体的业务规则 | ✅ | ❌ | ❌ |
| 跨实体的业务规则 | ❌ | ✅ | ❌ |
| 数据持久化 | ❌ | ❌ | ✅ |
| 事务管理 | ❌ | ❌ | ✅ |
| 外部服务调用 | ❌ | ❌ | ✅ |
| 事件发布 | ✅ (记录) | ❌ | ✅ (发布) |
| 权限检查 | ❌ | ❌ | ✅ |

---

## 8. 领域事件

### 8.1 事件设计原则

领域事件记录已经发生的业务事实：

```typescript
/**
 * 用户激活事件
 *
 * @description 记录用户被激活的事实
 */
class UserActivatedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly activatedAt: Date
  ) {
    super();
  }
}

/**
 * 订单已提交事件
 *
 * @description 记录订单提交的事实
 */
class OrderPlacedEvent extends DomainEvent {
  constructor(
    public readonly orderId: OrderId,
    public readonly customerId: CustomerId,
    public readonly totalAmount: Money,
    public readonly placedAt: Date
  ) {
    super();
  }
}
```

### 8.2 事件在实体中的使用

```typescript
class User extends BaseEntity {
  private domainEvents: DomainEvent[] = [];
  
  activate(): void {
    this.ensureIsPending();
    
    this.status = UserStatus.Active;
    
    // 记录领域事件
    this.addDomainEvent(
      new UserActivatedEvent(this.id, new Date())
    );
  }
  
  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }
  
  getDomainEvents(): ReadonlyArray<DomainEvent> {
    return [...this.domainEvents];
  }
  
  clearDomainEvents(): void {
    this.domainEvents = [];
  }
}
```

### 8.3 事件发布流程

```typescript
// 应用服务负责发布事件
class UserService {
  async activateUser(userId: string): Promise<void> {
    // 1. 加载聚合
    const user = await this.userRepository.findById(userId);
    
    // 2. 执行业务操作（产生事件）
    user.activate();
    
    // 3. 持久化
    await this.userRepository.save(user);
    
    // 4. 发布事件
    const events = user.getDomainEvents();
    await this.eventBus.publishAll(events);
    
    // 5. 清除事件（避免重复发布）
    user.clearDomainEvents();
  }
}
```

---

## 9. 实践案例

### 9.1 完整的租户实体示例

查看完整源文件：[RICH_DOMAIN_MODEL.md 第969-1161行](../RICH_DOMAIN_MODEL.md)

---

## 10. 常见问题

### Q1: 什么时候业务逻辑应该在实体内？

**A**: 当业务规则只涉及单个实体的状态时，应该在实体内。

```typescript
// ✅ 实体内：单个实体的业务规则
class User extends BaseEntity {
  changePassword(oldPassword: string, newPassword: string): void {
    // 只涉及User自身的状态
  }
}

// ✅ 领域服务：跨实体的业务规则
class TransferService {
  canTransfer(from: Account, to: Account, amount: Money): boolean {
    // 涉及两个Account实体
  }
}
```

### Q2: 实体可以有 setter 方法吗？

**A**: 不推荐。应该使用有业务含义的方法：

```typescript
// ❌ 不推荐：使用setter
class User extends BaseEntity {
  setStatus(status: UserStatus): void {
    this.status = status;
  }
}

user.setStatus(UserStatus.Active); // 不清楚业务含义

// ✅ 推荐：使用业务方法
class User extends BaseEntity {
  activate(): void {
    this.ensureIsPending();
    this.status = UserStatus.Active;
    this.addDomainEvent(new UserActivatedEvent(this.id));
  }
  
  suspend(): void {
    this.ensureIsActive();
    this.status = UserStatus.Suspended;
    this.addDomainEvent(new UserSuspendedEvent(this.id));
  }
}

user.activate(); // 业务含义明确
```

### Q3: 如何处理实体间的关联？

**A**: 聚合内使用对象引用，聚合间使用ID引用：

```typescript
// ✅ 聚合内：对象引用
class Order extends BaseAggregateRoot {
  private items: OrderItem[]; // 直接引用
}

// ✅ 聚合间：ID引用
class Order extends BaseAggregateRoot {
  private customerId: CustomerId; // ID引用
}

// 需要关联数据时，在应用服务层查询
class OrderService {
  async getOrderWithCustomer(orderId: string) {
    const order = await this.orderRepository.findById(orderId);
    const customer = await this.customerRepository.findById(
      order.getCustomerId()
    );
    return { order, customer };
  }
}
```

### Q4: 验证逻辑应该放在哪里？

**A**: 值对象和实体中：

```typescript
// ✅ 简单验证：值对象
class Email {
  constructor(email: string) {
    this.validate(email); // 验证逻辑在值对象内
    this.value = email;
  }
}

// ✅ 业务规则验证：实体
class Order extends BaseEntity {
  place(): void {
    this.ensureHasItems(); // 业务规则验证在实体内
    this.status = OrderStatus.Placed;
  }
}

// ✅ 跨实体验证：领域服务
class TransferService {
  canTransfer(from: Account, to: Account, amount: Money): boolean {
    // 跨实体的验证逻辑
  }
}

// ❌ 错误：验证在应用服务
class OrderService {
  placeOrder(orderId: string): void {
    const order = await this.repository.findById(orderId);
    if (order.items.length === 0) { // ❌ 不要在服务层验证
      throw new Error();
    }
  }
}
```

### Q5: 实体可以调用仓储吗？

**A**: 不可以。实体不应该依赖基础设施：

```typescript
// ❌ 错误：实体依赖仓储
class Order extends BaseEntity {
  async addProduct(productId: string): Promise<void> {
    const product = await this.productRepository.findById(productId); // ❌
    // ...
  }
}

// ✅ 正确：应用服务协调
class OrderService {
  async addProductToOrder(
    orderId: string,
    productId: string,
    quantity: number
  ): Promise<void> {
    // 服务层负责加载数据
    const order = await this.orderRepository.findById(orderId);
    const product = await this.productRepository.findById(productId);
    
    // 实体包含业务逻辑
    order.addItem(product, quantity);
    
    // 服务层负责持久化
    await this.orderRepository.save(order);
  }
}
```

### Q6: 如何处理复杂的计算逻辑？

**A**: 根据复杂度选择位置：

```typescript
// ✅ 简单计算：实体内部
class OrderItem extends BaseEntity {
  getSubtotal(): Money {
    return this.price.multiply(this.quantity);
  }
}

// ✅ 复杂计算：值对象
class Discount {
  calculate(amount: Money): Money {
    // 复杂的折扣计算逻辑
    if (this.type === DiscountType.Percentage) {
      return amount.multiply(this.value / 100);
    } else {
      return Money.create(this.value, amount.getCurrency());
    }
  }
}

// ✅ 跨实体计算：领域服务
class PricingService {
  calculateFinalPrice(
    items: OrderItem[],
    discounts: Discount[]
  ): Money {
    // 复杂的跨实体价格计算
  }
}
```

---

## 总结

### 充血模型的核心要点

1. ✅ **业务逻辑在实体**: 实体是业务规则的载体
2. ✅ **封装内部状态**: 使用私有属性和公开行为
3. ✅ **使用值对象**: 封装验证和计算逻辑
4. ✅ **领域事件**: 记录业务事实
5. ✅ **服务层协调**: 服务不包含业务逻辑
6. ✅ **自我验证**: 实体保证自身有效性
7. ✅ **业务语言**: 使用领域语言命名
8. ✅ **小聚合**: 保持聚合边界小而清晰

### 开发检查清单

在编写实体代码时，确保：

- [ ] 实体方法使用业务语言命名（如 `activate()` 而非 `setStatus()`）
- [ ] 所有业务规则封装在实体或领域服务中
- [ ] 使用私有属性保护内部状态
- [ ] 提供只读的 getter，不提供 setter
- [ ] 使用值对象封装验证逻辑
- [ ] 状态变化时发布领域事件
- [ ] 实体方法有完整的 TSDoc 注释，描述业务规则
- [ ] 服务层只负责协调，不包含业务逻辑

---

**返回**: [开发规范文档中心](./README.md)  
**理论基础**: [领域驱动设计](../architecture/02-domain-driven-design.md)

**文档维护者**: HL8 开发团队  
**最后更新**: 2025-10-01
