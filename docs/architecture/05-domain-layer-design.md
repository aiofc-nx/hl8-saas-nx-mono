# 领域层设计方案

> **版本**: 1.0.0  
> **更新日期**: 2025-01-01  
> **适用范围**: HL8 SAAS 平台领域层设计

---

## 📋 目录

- [1. 领域层概述](#1-领域层概述)
- [2. 领域层架构设计](#2-领域层架构设计)
- [3. 核心组件设计](#3-核心组件设计)
- [4. 实体与聚合设计](#4-实体与聚合设计)
- [5. 值对象设计](#5-值对象设计)
- [6. 领域服务设计](#6-领域服务设计)
- [7. 领域事件设计](#7-领域事件设计)
- [8. 仓储接口设计](#8-仓储接口设计)
- [9. 领域层实现规范](#9-领域层实现规范)
- [10. 测试策略](#10-测试策略)

---

## 1. 领域层概述

### 1.1 设计目标

领域层是 HL8 SAAS 平台的核心，承载着所有业务逻辑和业务规则。基于领域驱动设计（DDD）和充血模型理论，我们的领域层设计目标包括：

#### 核心目标

1. **业务逻辑集中化**
   - 将业务规则封装在领域对象中
   - 避免业务逻辑分散在服务层
   - 确保业务规则的一致性和可复用性

2. **高内聚低耦合**
   - 领域对象内部高度内聚
   - 通过接口实现依赖倒置
   - 最小化对外部依赖

3. **业务语言表达**
   - 使用业务术语命名
   - 代码结构反映业务结构
   - 便于业务人员理解

4. **可测试性**
   - 纯领域逻辑，无外部依赖
   - 可独立进行单元测试
   - 快速反馈业务规则正确性

### 1.2 设计原则

#### 充血模型原则

- **业务逻辑在实体内**: 实体包含数据和行为
- **封装内部状态**: 通过方法暴露行为，隐藏实现细节
- **自我验证**: 实体保证自身状态始终有效
- **行为驱动**: 通过业务方法改变状态

#### 聚合设计原则

- **聚合边界**: 明确的业务边界
- **事务边界**: 一个事务只修改一个聚合
- **一致性边界**: 聚合内强一致性，聚合间最终一致性
- **最小化聚合**: 保持聚合尽可能小

#### 依赖规则

- **依赖倒置**: 领域层定义接口，基础设施层实现
- **无框架依赖**: 领域层不依赖任何框架
- **纯 TypeScript**: 使用原生 TypeScript 特性

---

## 2. 领域层架构设计

### 2.1 整体架构

```text
领域层 (Domain Layer)
├── 实体 (Entities)
│   ├── 基础实体 (BaseEntity)
│   ├── 聚合根 (AggregateRoot)
│   └── 领域实体 (Domain Entities)
├── 值对象 (Value Objects)
│   ├── 基础值对象 (BaseValueObject)
│   ├── 标识符 (Identifiers)
│   └── 业务值对象 (Business Value Objects)
├── 领域服务 (Domain Services)
│   ├── 计算服务 (Calculation Services)
│   ├── 验证服务 (Validation Services)
│   └── 策略服务 (Strategy Services)
├── 领域事件 (Domain Events)
│   ├── 基础事件 (BaseDomainEvent)
│   └── 业务事件 (Business Events)
├── 仓储接口 (Repository Interfaces)
│   ├── 聚合仓储 (Aggregate Repositories)
│   └── 查询仓储 (Query Repositories)
├── 异常 (Exceptions)
│   ├── 领域异常 (Domain Exceptions)
│   └── 业务异常 (Business Exceptions)
└── 规范 (Specifications)
    ├── 业务规范 (Business Specifications)
    └── 查询规范 (Query Specifications)
```

### 2.2 包结构设计

```text
libs/{domain}/src/lib/
├── entities/                    # 实体
│   ├── base/                   # 基础实体
│   │   ├── base-entity.ts      # 基础实体类
│   │   ├── aggregate-root.ts   # 聚合根基类
│   │   └── entity-id.ts        # 实体标识符
│   ├── user/                   # 用户实体
│   │   ├── user.entity.ts      # 用户实体
│   │   ├── user-status.ts      # 用户状态
│   │   └── user.repository.interface.ts
│   └── tenant/                 # 租户实体
│       ├── tenant.entity.ts    # 租户实体
│       ├── tenant-type.ts      # 租户类型
│       └── tenant.repository.interface.ts
├── value-objects/              # 值对象
│   ├── base/                   # 基础值对象
│   │   └── base-value-object.ts
│   ├── identifiers/            # 标识符
│   │   ├── user-id.ts
│   │   └── tenant-id.ts
│   └── business/               # 业务值对象
│       ├── email.ts
│       ├── phone.ts
│       └── address.ts
├── services/                   # 领域服务
│   ├── user/                   # 用户相关服务
│   │   ├── user-domain.service.ts
│   │   └── user-creation.service.ts
│   └── tenant/                 # 租户相关服务
│       ├── tenant-domain.service.ts
│       └── tenant-provisioning.service.ts
├── events/                     # 领域事件
│   ├── base/                   # 基础事件
│   │   └── base-domain-event.ts
│   ├── user/                   # 用户事件
│   │   ├── user-created.event.ts
│   │   └── user-activated.event.ts
│   └── tenant/                 # 租户事件
│       ├── tenant-created.event.ts
│       └── tenant-activated.event.ts
├── exceptions/                 # 异常
│   ├── domain/                 # 领域异常
│   │   └── domain-exception.ts
│   └── business/               # 业务异常
│       ├── user/               # 用户异常
│       │   ├── user-not-found.exception.ts
│       │   └── user-already-exists.exception.ts
│       └── tenant/             # 租户异常
│           ├── tenant-not-found.exception.ts
│           └── tenant-limit-exceeded.exception.ts
├── specifications/             # 规范
│   ├── user/                   # 用户规范
│   │   ├── user-creation.specification.ts
│   │   └── user-activation.specification.ts
│   └── tenant/                 # 租户规范
│       ├── tenant-creation.specification.ts
│       └── tenant-provisioning.specification.ts
└── constants.ts                # 常量定义
```

---

## 3. 核心组件设计

### 3.1 基础实体设计

#### BaseEntity

```typescript
/**
 * 基础实体类
 *
 * 所有领域实体的基类，提供实体的一致行为
 * 包括唯一标识符、创建时间、更新时间等基础属性
 *
 * @description 实体是领域驱动设计中的核心概念，具有唯一标识符和生命周期
 * 实体的相等性基于其标识符，而不是属性值
 *
 * ## 业务规则
 *
 * ### 标识符规则
 * - 每个实体必须具有唯一的标识符
 * - 标识符在实体生命周期内不可变更
 * - 标识符用于实体的相等性比较
 * - 标识符必须符合EntityId的格式要求
 *
 * ### 时间戳规则
 * - 创建时间在实体创建时设置，不可修改
 * - 更新时间在实体状态变更时自动更新
 * - 时间戳采用UTC时区，确保跨时区一致性
 * - 时间戳精度到毫秒级别
 *
 * ### 相等性规则
 * - 实体的相等性基于标识符比较，而非属性值
 * - 相同类型且相同标识符的实体被视为相等
 * - 不同类型但相同标识符的实体被视为不相等
 * - null和undefined与任何实体都不相等
 *
 * @example
 * ```typescript
 * class User extends BaseEntity {
 *   constructor(
 *     id: EntityId,
 *     private name: string,
 *     private email: string
 *   ) {
 *     super(id);
 *   }
 *
 *   getName(): string {
 *     return this.name;
 *   }
 *
 *   updateName(newName: string): void {
 *     this.name = newName;
 *     this.updateTimestamp(); // 自动更新修改时间
 *   }
 * }
 *
 * // 创建用户实体
 * const user = new User(EntityId.generate(), '张三', 'zhangsan@example.com');
 *
 * // 更新用户信息
 * user.updateName('李四');
 * ```
 *
 * @since 1.0.0
 */
export abstract class BaseEntity {
  private readonly _id: EntityId;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _domainEvents: DomainEvent[] = [];

  /**
   * 构造函数
   *
   * @param id - 实体唯一标识符
   * @param createdAt - 创建时间，可选，默认为当前时间
   * @param updatedAt - 更新时间，可选，默认为当前时间
   */
  constructor(id: EntityId, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  /**
   * 获取实体标识符
   *
   * @returns 实体唯一标识符
   */
  get id(): EntityId {
    return this._id;
  }

  /**
   * 获取创建时间
   *
   * @returns 创建时间
   */
  get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * 获取更新时间
   *
   * @returns 更新时间
   */
  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * 更新实体时间戳
   *
   * @description 在实体状态变更时调用，自动更新修改时间
   * 此方法应该在实体内部状态变更的方法中调用
   *
   * @example
   * ```typescript
   * updateName(newName: string): void {
   *   this.name = newName;
   *   this.updateTimestamp(); // 更新修改时间
   * }
   * ```
   */
  protected updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  /**
   * 添加领域事件
   *
   * @description 添加领域事件到实体的待发布事件列表
   * 事件将在聚合根保存时发布
   *
   * @param event - 要添加的领域事件
   *
   * @example
   * ```typescript
   * activate(): void {
   *   this.status = UserStatus.Active;
   *   this.addDomainEvent(new UserActivatedEvent(this.id));
   * }
   * ```
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * 获取所有领域事件
   *
   * @returns 领域事件数组
   */
  getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * 清除领域事件
   *
   * @description 在事件发布后调用，清除已发布的事件
   */
  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * 检查实体是否相等
   *
   * @param other - 要比较的另一个实体
   * @returns 如果实体相等返回true，否则返回false
   *
   * @example
   * ```typescript
   * const user1 = new User(EntityId.generate(), '张三', 'zhangsan@example.com');
   * const user2 = new User(user1.id, '李四', 'lisi@example.com');
   * 
   * console.log(user1.equals(user2)); // true (相同ID)
   * console.log(user1.equals(user1)); // true (相同对象)
   * ```
   */
  equals(other: BaseEntity | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (this === other) {
      return true;
    }

    if (this.constructor !== other.constructor) {
      return false;
    }

    return this._id.equals(other._id);
  }

  /**
   * 获取实体哈希值
   *
   * @returns 基于标识符的哈希值
   */
  hashCode(): string {
    return this._id.toString();
  }
}
```

---

## 4. 实体与聚合设计

### 4.1 聚合根基类设计

#### AggregateRoot

```typescript
/**
 * 聚合根基类
 *
 * 聚合根是聚合的入口点，负责维护聚合的一致性边界
 * 聚合根继承自BaseEntity，增加了聚合特定的行为
 *
 * @description 聚合根是聚合的唯一入口，外部只能通过聚合根访问聚合内的对象
 * 聚合根负责维护聚合内对象的一致性，确保业务规则得到执行
 *
 * ## 业务规则
 *
 * ### 聚合边界规则
 * - 聚合根是聚合的唯一入口点
 * - 外部不能直接访问聚合内的实体或值对象
 * - 聚合内的所有对象变更必须通过聚合根进行
 * - 聚合根负责维护聚合内对象的一致性
 *
 * ### 事务边界规则
 * - 一个事务只能修改一个聚合
 * - 聚合内保证强一致性
 * - 聚合间通过领域事件实现最终一致性
 * - 聚合根负责发布领域事件
 *
 * ### 生命周期规则
 * - 聚合根的创建和销毁代表聚合的生命周期
 * - 聚合根负责聚合内对象的创建和管理
 * - 聚合根可以包含多个实体和值对象
 *
 * @example
 * ```typescript
 * class OrderAggregateRoot extends AggregateRoot {
 *   private items: OrderItem[] = [];
 *   private customerId: CustomerId;
 *   
 *   constructor(
 *     id: OrderId,
 *     customerId: CustomerId
 *   ) {
 *     super(id);
 *     this.customerId = customerId;
 *   }
 *   
 *   addItem(productId: ProductId, quantity: number, price: Money): void {
 *     // 业务规则验证
 *     this.ensureIsDraft();
 *     this.ensureValidQuantity(quantity);
 *     
 *     const item = OrderItem.create(productId, quantity, price);
 *     this.items.push(item);
 *     
 *     // 维护聚合一致性
 *     this.recalculateTotal();
 *     
 *     // 发布领域事件
 *     this.addDomainEvent(new OrderItemAddedEvent(this.id, item));
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export abstract class AggregateRoot extends BaseEntity {
  private _version: number = 0;

  /**
   * 构造函数
   *
   * @param id - 聚合根标识符
   * @param createdAt - 创建时间，可选
   * @param updatedAt - 更新时间，可选
   * @param version - 版本号，用于乐观锁，可选
   */
  constructor(
    id: EntityId,
    createdAt?: Date,
    updatedAt?: Date,
    version: number = 0
  ) {
    super(id, createdAt, updatedAt);
    this._version = version;
  }

  /**
   * 获取聚合版本号
   *
   * @returns 当前版本号
   */
  get version(): number {
    return this._version;
  }

  /**
   * 更新聚合版本号
   *
   * @description 在聚合状态变更时调用，用于乐观锁控制
   * 此方法应该在聚合状态变更的方法中调用
   *
   * @example
   * ```typescript
   * updateStatus(newStatus: OrderStatus): void {
   *   this.status = newStatus;
   *   this.updateTimestamp();
   *   this.incrementVersion(); // 更新版本号
   * }
   * ```
   */
  protected incrementVersion(): void {
    this._version += 1;
    this.updateTimestamp();
  }

  /**
   * 设置聚合版本号
   *
   * @description 从持久化层恢复聚合时调用
   * 此方法通常由仓储实现调用
   *
   * @param version - 要设置的版本号
   */
  setVersion(version: number): void {
    this._version = version;
  }
}
```

### 4.2 实体标识符设计

#### EntityId

```typescript
/**
 * 实体标识符基类
 *
 * 所有实体标识符的基类，提供类型安全和值比较功能
 * 实体标识符是不可变的值对象，用于唯一标识实体
 *
 * @description 实体标识符是实体的唯一标识，用于区分不同的实体实例
 * 标识符是不可变的，一旦创建就不能修改
 *
 * ## 业务规则
 *
 * ### 唯一性规则
 * - 每个实体必须有唯一的标识符
 * - 标识符在实体生命周期内不可变更
 * - 不同实体的标识符必须不同
 * - 相同标识符代表同一个实体
 *
 * ### 不可变性规则
 * - 标识符一旦创建就不能修改
 * - 标识符的值在实体生命周期内保持不变
 * - 标识符的比较基于值而非引用
 *
 * ### 类型安全规则
 * - 不同类型的实体使用不同类型的标识符
 * - 标识符类型在编译时检查
 * - 防止不同类型实体标识符的混淆
 *
 * @example
 * ```typescript
 * class UserId extends EntityId {
 *   constructor(value: string) {
 *     super(value);
 *   }
 *   
 *   static generate(): UserId {
 *     return new UserId(crypto.randomUUID());
 *   }
 * }
 * 
 * class OrderId extends EntityId {
 *   constructor(value: string) {
 *     super(value);
 *   }
 * }
 * 
 * // 类型安全
 * const userId = UserId.generate();
 * const orderId = new OrderId('order-123');
 * 
 * // userId.equals(orderId); // 编译错误，类型不匹配
 * ```
 *
 * @since 1.0.0
 */
export abstract class EntityId {
  private readonly _value: string;

  /**
   * 构造函数
   *
   * @param value - 标识符的字符串值
   * @throws {InvalidEntityIdException} 当标识符值无效时抛出异常
   */
  constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  /**
   * 获取标识符值
   *
   * @returns 标识符的字符串值
   */
  get value(): string {
    return this._value;
  }

  /**
   * 验证标识符值
   *
   * @param value - 要验证的值
   * @throws {InvalidEntityIdException} 当值无效时抛出异常
   */
  protected abstract validate(value: string): void;

  /**
   * 检查标识符是否相等
   *
   * @param other - 要比较的另一个标识符
   * @returns 如果标识符相等返回true，否则返回false
   */
  equals(other: EntityId | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (this === other) {
      return true;
    }

    if (this.constructor !== other.constructor) {
      return false;
    }

    return this._value === other._value;
  }

  /**
   * 转换为字符串
   *
   * @returns 标识符的字符串表示
   */
  toString(): string {
    return this._value;
  }

  /**
   * 获取哈希值
   *
   * @returns 标识符的哈希值
   */
  hashCode(): string {
    return this._value;
  }
}
```

### 4.3 具体实体示例

#### User 实体设计

```typescript
/**
 * 用户实体
 *
 * 用户是系统中的核心实体，代表使用平台服务的个人或组织
 * 用户实体包含用户的基本信息和状态管理
 *
 * @description 用户实体负责管理用户的生命周期、状态转换和业务规则
 * 用户可以是平台用户或租户用户，具有不同的权限和状态
 *
 * ## 业务规则
 *
 * ### 用户创建规则
 * - 用户必须有有效的邮箱地址
 * - 用户必须有安全的密码
 * - 用户创建时状态为待激活
 * - 用户邮箱在系统中必须唯一
 *
 * ### 用户激活规则
 * - 只有待激活状态的用户可以被激活
 * - 用户激活后可以登录系统
 * - 用户激活会发布用户激活事件
 *
 * ### 用户状态规则
 * - 用户状态包括：待激活、激活、禁用、锁定
 * - 状态转换必须遵循预定义的规则
 * - 禁用状态的用户不能登录系统
 * - 锁定状态的用户需要管理员解锁
 *
 * @example
 * ```typescript
 * // 创建用户
 * const user = User.create(
 *   'john@example.com',
 *   'SecurePassword123!',
 *   'John Doe'
 * );
 * 
 * // 激活用户
 * user.activate();
 * 
 * // 检查用户状态
 * if (user.isActive()) {
 *   console.log('用户已激活');
 * }
 * ```
 *
 * @since 1.0.0
 */
export class User extends BaseEntity {
  private _email: Email;
  private _password: HashedPassword;
  private _name: string;
  private _status: UserStatus;
  private _lastLoginAt: Date | null = null;
  private _tenantIds: TenantId[] = [];

  /**
   * 创建新用户
   *
   * @description 创建新用户实例，用户初始状态为待激活
   * 此方法会验证用户信息的有效性并设置初始状态
   *
   * @param email - 用户邮箱地址
   * @param plainPassword - 用户明文密码
   * @param name - 用户姓名
   * @returns 新创建的用户实例
   * @throws {InvalidEmailException} 当邮箱格式无效时
   * @throws {InvalidPasswordException} 当密码不符合要求时
   * @throws {UserAlreadyExistsException} 当用户已存在时
   *
   * @example
   * ```typescript
   * const user = User.create(
   *   'john@example.com',
   *   'SecurePassword123!',
   *   'John Doe'
   * );
   * ```
   */
  static create(
    email: string,
    plainPassword: string,
    name: string
  ): User {
    const userId = UserId.generate();
    const emailValue = new Email(email);
    const hashedPassword = HashedPassword.fromPlainText(plainPassword);

    const user = new User(userId, emailValue, hashedPassword, name);
    user.addDomainEvent(new UserCreatedEvent(userId, email, name));

    return user;
  }

  /**
   * 构造函数
   *
   * @param id - 用户标识符
   * @param email - 用户邮箱
   * @param password - 用户密码哈希
   * @param name - 用户姓名
   * @param status - 用户状态，默认为待激活
   * @param createdAt - 创建时间
   * @param updatedAt - 更新时间
   */
  constructor(
    id: UserId,
    email: Email,
    password: HashedPassword,
    name: string,
    status: UserStatus = UserStatus.Pending,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this._email = email;
    this._password = password;
    this._name = name;
    this._status = status;
  }

  /**
   * 激活用户
   *
   * @description 将用户状态从待激活改为激活
   * 只有待激活状态的用户可以被激活
   *
   * @throws {UserNotPendingException} 当用户不是待激活状态时
   *
   * @example
   * ```typescript
   * user.activate();
   * ```
   */
  activate(): void {
    this.ensureIsPending();
    this._status = UserStatus.Active;
    this.updateTimestamp();
    this.addDomainEvent(new UserActivatedEvent(this.id as UserId));
  }

  /**
   * 禁用用户
   *
   * @description 禁用用户账户，用户将无法登录系统
   * 禁用操作会发布用户禁用事件
   *
   * @param reason - 禁用原因
   * @throws {UserNotActiveException} 当用户不是激活状态时
   *
   * @example
   * ```typescript
   * user.disable('违反使用条款');
   * ```
   */
  disable(reason: string): void {
    this.ensureIsActive();
    this._status = UserStatus.Disabled;
    this.updateTimestamp();
    this.addDomainEvent(new UserDisabledEvent(this.id as UserId, reason));
  }

  /**
   * 锁定用户
   *
   * @description 锁定用户账户，通常由于安全原因
   * 锁定的用户需要管理员手动解锁
   *
   * @param reason - 锁定原因
   * @throws {UserNotActiveException} 当用户不是激活状态时
   *
   * @example
   * ```typescript
   * user.lock('多次登录失败');
   * ```
   */
  lock(reason: string): void {
    this.ensureIsActive();
    this._status = UserStatus.Locked;
    this.updateTimestamp();
    this.addDomainEvent(new UserLockedEvent(this.id as UserId, reason));
  }

  /**
   * 解锁用户
   *
   * @description 解锁用户账户，用户可以重新登录
   * 只有锁定状态的用户可以被解锁
   *
   * @throws {UserNotLockedException} 当用户不是锁定状态时
   *
   * @example
   * ```typescript
   * user.unlock();
   * ```
   */
  unlock(): void {
    this.ensureIsLocked();
    this._status = UserStatus.Active;
    this.updateTimestamp();
    this.addDomainEvent(new UserUnlockedEvent(this.id as UserId));
  }

  /**
   * 记录登录时间
   *
   * @description 更新用户最后登录时间
   * 此方法在用户成功登录后调用
   *
   * @example
   * ```typescript
   * user.recordLogin();
   * ```
   */
  recordLogin(): void {
    this._lastLoginAt = new Date();
    this.updateTimestamp();
  }

  /**
   * 更改密码
   *
   * @description 更改用户密码
   * 需要验证当前密码的正确性
   *
   * @param currentPassword - 当前密码
   * @param newPassword - 新密码
   * @throws {InvalidPasswordException} 当当前密码不正确时
   * @throws {InvalidPasswordException} 当新密码不符合要求时
   *
   * @example
   * ```typescript
   * user.changePassword('OldPassword123!', 'NewPassword123!');
   * ```
   */
  changePassword(currentPassword: string, newPassword: string): void {
    this.ensurePasswordMatches(currentPassword);
    
    const newHashedPassword = HashedPassword.fromPlainText(newPassword);
    this._password = newHashedPassword;
    this.updateTimestamp();
    
    this.addDomainEvent(new UserPasswordChangedEvent(this.id as UserId));
  }

  /**
   * 重置密码
   *
   * @description 重置用户密码为临时密码
   * 重置后用户需要立即更改密码
   *
   * @param temporaryPassword - 临时密码
   * @throws {UserNotActiveException} 当用户不是激活状态时
   *
   * @example
   * ```typescript
   * user.resetPassword('TempPassword123!');
   * ```
   */
  resetPassword(temporaryPassword: string): void {
    this.ensureIsActive();
    
    const hashedPassword = HashedPassword.fromPlainText(temporaryPassword);
    this._password = hashedPassword;
    this.updateTimestamp();
    
    this.addDomainEvent(new UserPasswordResetEvent(this.id as UserId));
  }

  /**
   * 添加租户关联
   *
   * @description 将用户关联到租户
   * 用户可以关联到多个租户
   *
   * @param tenantId - 租户标识符
   * @throws {UserNotActiveException} 当用户不是激活状态时
   *
   * @example
   * ```typescript
   * user.addTenant(tenantId);
   * ```
   */
  addTenant(tenantId: TenantId): void {
    this.ensureIsActive();
    
    if (!this._tenantIds.some(id => id.equals(tenantId))) {
      this._tenantIds.push(tenantId);
      this.updateTimestamp();
      this.addDomainEvent(new UserTenantAddedEvent(this.id as UserId, tenantId));
    }
  }

  /**
   * 移除租户关联
   *
   * @description 移除用户与租户的关联
   *
   * @param tenantId - 租户标识符
   *
   * @example
   * ```typescript
   * user.removeTenant(tenantId);
   * ```
   */
  removeTenant(tenantId: TenantId): void {
    const index = this._tenantIds.findIndex(id => id.equals(tenantId));
    if (index !== -1) {
      this._tenantIds.splice(index, 1);
      this.updateTimestamp();
      this.addDomainEvent(new UserTenantRemovedEvent(this.id as UserId, tenantId));
    }
  }

  // 获取器方法
  get email(): Email {
    return this._email;
  }

  get name(): string {
    return this._name;
  }

  get status(): UserStatus {
    return this._status;
  }

  get lastLoginAt(): Date | null {
    return this._lastLoginAt;
  }

  get tenantIds(): TenantId[] {
    return [...this._tenantIds];
  }

  // 状态检查方法
  isActive(): boolean {
    return this._status === UserStatus.Active;
  }

  isPending(): boolean {
    return this._status === UserStatus.Pending;
  }

  isDisabled(): boolean {
    return this._status === UserStatus.Disabled;
  }

  isLocked(): boolean {
    return this._status === UserStatus.Locked;
  }

  canLogin(): boolean {
    return this._status === UserStatus.Active;
  }

  // 私有验证方法
  private ensureIsPending(): void {
    if (this._status !== UserStatus.Pending) {
      throw new UserNotPendingException(this.id as UserId);
    }
  }

  private ensureIsActive(): void {
    if (this._status !== UserStatus.Active) {
      throw new UserNotActiveException(this.id as UserId);
    }
  }

  private ensureIsLocked(): void {
    if (this._status !== UserStatus.Locked) {
      throw new UserNotLockedException(this.id as UserId);
    }
  }

  private ensurePasswordMatches(password: string): void {
    if (!this._password.matches(password)) {
      throw new InvalidPasswordException('当前密码不正确');
    }
  }
}
```

---

## 5. 值对象设计

### 5.1 值对象基类设计

#### BaseValueObject

```typescript
/**
 * 值对象基类
 *
 * 所有值对象的基类，提供不可变性和值比较功能
 * 值对象是没有标识符的不可变对象，通过值进行比较
 *
 * @description 值对象是领域模型中的重要概念，用于封装具有业务含义的值
 * 值对象是不可变的，一旦创建就不能修改，需要修改时创建新对象
 *
 * ## 业务规则
 *
 * ### 不可变性规则
 * - 值对象一旦创建就不能修改
 * - 所有属性都是只读的
 * - 需要修改时创建新的值对象实例
 * - 值对象的状态在生命周期内保持不变
 *
 * ### 值相等性规则
 * - 值对象的相等性基于值比较，而非引用比较
 * - 相同类型的值对象，如果所有属性值相等，则对象相等
 * - 值对象可以用作 Map 的键或 Set 的元素
 *
 * ### 自我验证规则
 * - 值对象在构造时验证自身有效性
 * - 无效的值对象不能创建
 * - 验证规则封装在值对象内部
 *
 * @example
 * ```typescript
 * class Email extends BaseValueObject {
 *   private readonly _value: string;
 *   
 *   constructor(value: string) {
 *     super();
 *     this.validate(value);
 *     this._value = value.toLowerCase().trim();
 *   }
 *   
 *   get value(): string {
 *     return this._value;
 *   }
 *   
 *   protected validate(value: string): void {
 *     if (!this.isValidEmail(value)) {
 *       throw new InvalidEmailException(value);
 *     }
 *   }
 *   
 *   private isValidEmail(value: string): boolean {
 *     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 *     return emailRegex.test(value);
 *   }
 * }
 * 
 * // 使用示例
 * const email1 = new Email('john@example.com');
 * const email2 = new Email('JOHN@EXAMPLE.COM');
 * 
 * console.log(email1.equals(email2)); // true (值相等)
 * ```
 *
 * @since 1.0.0
 */
export abstract class BaseValueObject {
  /**
   * 检查值对象是否相等
   *
   * @param other - 要比较的另一个值对象
   * @returns 如果值对象相等返回true，否则返回false
   */
  equals(other: BaseValueObject | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }

    if (this === other) {
      return true;
    }

    if (this.constructor !== other.constructor) {
      return false;
    }

    return this.getValueEquality(other);
  }

  /**
   * 获取值相等性比较
   *
   * @description 子类需要实现此方法，定义如何比较值对象的相等性
   * 通常比较所有属性的值
   *
   * @param other - 要比较的另一个值对象
   * @returns 如果值相等返回true，否则返回false
   */
  protected abstract getValueEquality(other: BaseValueObject): boolean;

  /**
   * 获取哈希值
   *
   * @description 子类需要实现此方法，返回基于值的哈希码
   * 相等的值对象必须返回相同的哈希码
   *
   * @returns 哈希值
   */
  abstract hashCode(): string;

  /**
   * 转换为字符串
   *
   * @returns 值对象的字符串表示
   */
  abstract toString(): string;
}
```

### 5.2 具体值对象示例

#### Email 值对象

```typescript
/**
 * 邮箱地址值对象
 *
 * 封装邮箱地址的业务规则和验证逻辑
 * 邮箱地址在系统中必须唯一且有效
 *
 * @description 邮箱地址是用户身份的重要标识，需要严格的格式验证
 * 邮箱地址会自动转换为小写并去除空格，确保一致性
 *
 * ## 业务规则
 *
 * ### 格式验证规则
 * - 必须符合标准邮箱格式
 * - 不能包含无效字符
 * - 域名部分必须有效
 * - 长度不能超过限制
 *
 * ### 标准化规则
 * - 自动转换为小写
 * - 去除前后空格
 * - 统一格式表示
 *
 * ### 唯一性规则
 * - 邮箱地址在系统中必须唯一
 * - 相同邮箱的不同表示形式被视为相同
 *
 * @example
 * ```typescript
 * // 创建邮箱地址
 * const email = new Email('john.doe@example.com');
 * 
 * // 验证格式
 * const invalidEmail = new Email('invalid-email'); // 抛出异常
 * 
 * // 标准化
 * const email1 = new Email('JOHN@EXAMPLE.COM');
 * const email2 = new Email('john@example.com');
 * console.log(email1.equals(email2)); // true
 * ```
 *
 * @since 1.0.0
 */
export class Email extends BaseValueObject {
  private readonly _value: string;

  /**
   * 构造函数
   *
   * @param value - 邮箱地址字符串
   * @throws {InvalidEmailException} 当邮箱格式无效时
   */
  constructor(value: string) {
    super();
    this.validate(value);
    this._value = this.normalize(value);
  }

  /**
   * 获取邮箱地址值
   *
   * @returns 标准化后的邮箱地址
   */
  get value(): string {
    return this._value;
  }

  /**
   * 获取邮箱用户名部分
   *
   * @returns 邮箱地址中@符号前的部分
   */
  get username(): string {
    return this._value.split('@')[0];
  }

  /**
   * 获取邮箱域名部分
   *
   * @returns 邮箱地址中@符号后的部分
   */
  get domain(): string {
    return this._value.split('@')[1];
  }

  /**
   * 验证邮箱格式
   *
   * @param value - 要验证的邮箱地址
   * @throws {InvalidEmailException} 当邮箱格式无效时
   */
  private validate(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new InvalidEmailException('邮箱地址不能为空');
    }

    if (value.length > 254) {
      throw new InvalidEmailException('邮箱地址长度不能超过254个字符');
    }

    if (!this.isValidEmailFormat(value)) {
      throw new InvalidEmailException(`无效的邮箱格式: ${value}`);
    }
  }

  /**
   * 标准化邮箱地址
   *
   * @param value - 原始邮箱地址
   * @returns 标准化后的邮箱地址
   */
  private normalize(value: string): string {
    return value.toLowerCase().trim();
  }

  /**
   * 验证邮箱格式
   *
   * @param email - 邮箱地址
   * @returns 如果格式有效返回true，否则返回false
   */
  private isValidEmailFormat(email: string): boolean {
    // RFC 5322 兼容的邮箱正则表达式
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  /**
   * 获取值相等性比较
   *
   * @param other - 要比较的另一个值对象
   * @returns 如果值相等返回true，否则返回false
   */
  protected getValueEquality(other: BaseValueObject): boolean {
    return other instanceof Email && this._value === other._value;
  }

  /**
   * 获取哈希值
   *
   * @returns 基于邮箱地址值的哈希码
   */
  hashCode(): string {
    return this._value;
  }

  /**
   * 转换为字符串
   *
   * @returns 邮箱地址的字符串表示
   */
  toString(): string {
    return this._value;
  }
}
```

#### Money 值对象

```typescript
/**
 * 金额值对象
 *
 * 封装金额的计算和验证逻辑
 * 支持不同货币的金额运算和比较
 *
 * @description 金额是金融系统中的核心概念，需要精确的计算和安全的操作
 * 金额使用整数存储以避免浮点数精度问题
 *
 * ## 业务规则
 *
 * ### 精度规则
 * - 使用整数存储，避免浮点数精度问题
 * - 支持不同的小数位数
 * - 计算时保持精度
 *
 * ### 货币规则
 * - 只能与相同货币的金额进行运算
 * - 支持多种货币类型
 * - 货币转换需要特殊处理
 *
 * ### 运算规则
 * - 支持加法、减法、乘法、除法
 * - 除法运算可能产生精度损失
 * - 运算结果创建新的金额对象
 *
 * @example
 * ```typescript
 * // 创建金额
 * const amount1 = new Money(10000, Currency.CNY); // 100.00 CNY
 * const amount2 = new Money(5000, Currency.CNY);  // 50.00 CNY
 * 
 * // 运算
 * const sum = amount1.add(amount2); // 150.00 CNY
 * const diff = amount1.subtract(amount2); // 50.00 CNY
 * 
 * // 比较
 * console.log(amount1.isGreaterThan(amount2)); // true
 * ```
 *
 * @since 1.0.0
 */
export class Money extends BaseValueObject {
  private readonly _amount: number;
  private readonly _currency: Currency;

  /**
   * 构造函数
   *
   * @param amount - 金额数量（以最小单位计算，如分为单位）
   * @param currency - 货币类型
   * @throws {InvalidAmountException} 当金额无效时
   */
  constructor(amount: number, currency: Currency) {
    super();
    this.validate(amount, currency);
    this._amount = Math.round(amount);
    this._currency = currency;
  }

  /**
   * 从字符串创建金额
   *
   * @param amountStr - 金额字符串（如 "100.50"）
   * @param currency - 货币类型
   * @returns 金额对象
   */
  static fromString(amountStr: string, currency: Currency): Money {
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
      throw new InvalidAmountException(`无效的金额字符串: ${amountStr}`);
    }
    return new Money(amount * 100, currency); // 转换为分
  }

  /**
   * 获取金额数量
   *
   * @returns 金额数量（以最小单位计算）
   */
  get amount(): number {
    return this._amount;
  }

  /**
   * 获取货币类型
   *
   * @returns 货币类型
   */
  get currency(): Currency {
    return this._currency;
  }

  /**
   * 获取显示金额
   *
   * @returns 显示用的金额（以元为单位）
   */
  get displayAmount(): number {
    return this._amount / 100;
  }

  /**
   * 验证金额
   *
   * @param amount - 金额数量
   * @param currency - 货币类型
   * @throws {InvalidAmountException} 当金额无效时
   */
  private validate(amount: number, currency: Currency): void {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new InvalidAmountException('金额必须是有效数字');
    }

    if (!Number.isFinite(amount)) {
      throw new InvalidAmountException('金额必须是有限数字');
    }

    if (amount < 0) {
      throw new InvalidAmountException('金额不能为负数');
    }

    if (!currency) {
      throw new InvalidAmountException('货币类型不能为空');
    }
  }

  /**
   * 加法运算
   *
   * @param other - 要相加的金额
   * @returns 新的金额对象
   * @throws {CurrencyMismatchException} 当货币类型不匹配时
   */
  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this._amount + other._amount, this._currency);
  }

  /**
   * 减法运算
   *
   * @param other - 要相减的金额
   * @returns 新的金额对象
   * @throws {CurrencyMismatchException} 当货币类型不匹配时
   */
  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this._amount - other._amount, this._currency);
  }

  /**
   * 乘法运算
   *
   * @param multiplier - 乘数
   * @returns 新的金额对象
   */
  multiply(multiplier: number): Money {
    return new Money(this._amount * multiplier, this._currency);
  }

  /**
   * 除法运算
   *
   * @param divisor - 除数
   * @returns 新的金额对象
   * @throws {InvalidAmountException} 当除数为0时
   */
  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new InvalidAmountException('除数不能为0');
    }
    return new Money(Math.round(this._amount / divisor), this._currency);
  }

  /**
   * 检查是否大于指定金额
   *
   * @param other - 要比较的金额
   * @returns 如果大于返回true，否则返回false
   * @throws {CurrencyMismatchException} 当货币类型不匹配时
   */
  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount > other._amount;
  }

  /**
   * 检查是否小于指定金额
   *
   * @param other - 要比较的金额
   * @returns 如果小于返回true，否则返回false
   * @throws {CurrencyMismatchException} 当货币类型不匹配时
   */
  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount < other._amount;
  }

  /**
   * 检查是否等于指定金额
   *
   * @param other - 要比较的金额
   * @returns 如果等于返回true，否则返回false
   * @throws {CurrencyMismatchException} 当货币类型不匹配时
   */
  isEqualTo(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount === other._amount;
  }

  /**
   * 检查是否为零
   *
   * @returns 如果为零返回true，否则返回false
   */
  isZero(): boolean {
    return this._amount === 0;
  }

  /**
   * 获取绝对值
   *
   * @returns 绝对值金额
   */
  abs(): Money {
    return new Money(Math.abs(this._amount), this._currency);
  }

  /**
   * 确保货币类型相同
   *
   * @param other - 要比较的金额
   * @throws {CurrencyMismatchException} 当货币类型不匹配时
   */
  private ensureSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new CurrencyMismatchException(
        `货币类型不匹配: ${this._currency} vs ${other._currency}`
      );
    }
  }

  /**
   * 获取值相等性比较
   *
   * @param other - 要比较的另一个值对象
   * @returns 如果值相等返回true，否则返回false
   */
  protected getValueEquality(other: BaseValueObject): boolean {
    return other instanceof Money && 
           this._amount === other._amount && 
           this._currency === other._currency;
  }

  /**
   * 获取哈希值
   *
   * @returns 基于金额和货币的哈希码
   */
  hashCode(): string {
    return `${this._amount}-${this._currency}`;
  }

  /**
   * 转换为字符串
   *
   * @returns 金额的字符串表示
   */
  toString(): string {
    return `${this.displayAmount.toFixed(2)} ${this._currency}`;
  }
}
```

### 5.3 枚举值对象

#### UserStatus 枚举

```typescript
/**
 * 用户状态枚举
 *
 * 定义用户的所有可能状态
 * 用户状态控制用户的行为和权限
 *
 * @description 用户状态是用户生命周期的重要概念
 * 状态转换必须遵循预定义的业务规则
 *
 * ## 业务规则
 *
 * ### 状态定义
 * - Pending: 待激活状态，用户已创建但未激活
 * - Active: 激活状态，用户可以正常使用系统
 * - Disabled: 禁用状态，用户被管理员禁用
 * - Locked: 锁定状态，用户因安全原因被锁定
 *
 * ### 状态转换规则
 * - Pending → Active: 用户激活
 * - Active → Disabled: 管理员禁用用户
 * - Active → Locked: 系统自动锁定（如多次登录失败）
 * - Disabled → Active: 管理员重新启用
 * - Locked → Active: 管理员解锁
 *
 * @example
 * ```typescript
 * // 检查用户状态
 * if (user.status === UserStatus.Active) {
 *   console.log('用户可以登录');
 * }
 * 
 * // 状态转换
 * user.activate(); // Pending → Active
 * user.disable('违反使用条款'); // Active → Disabled
 * ```
 *
 * @since 1.0.0
 */
export enum UserStatus {
  /**
   * 待激活状态
   * 
   * 用户已创建但尚未激活，不能登录系统
   * 需要管理员激活或用户通过邮箱验证激活
   */
  Pending = 'pending',

  /**
   * 激活状态
   * 
   * 用户可以正常使用系统，具有完整的权限
   * 这是用户的正常工作状态
   */
  Active = 'active',

  /**
   * 禁用状态
   * 
   * 用户被管理员禁用，不能登录系统
   * 禁用通常是由于违反使用条款或其他管理原因
   */
  Disabled = 'disabled',

  /**
   * 锁定状态
   * 
   * 用户因安全原因被系统锁定
   * 锁定通常是由于多次登录失败或其他安全威胁
   */
  Locked = 'locked'
}
```

---

**返回**: [架构文档中心](./README.md)
