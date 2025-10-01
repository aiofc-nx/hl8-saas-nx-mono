# 架构设计原则

> **版本**: 1.0.0  
> **更新日期**: 2025-10-01  
> **适用范围**: HL8 SAAS 平台整体架构

---

## 📋 目录

- [1. 架构概述](#1-架构概述)
- [2. Clean Architecture](#2-clean-architecture)
- [3. 依赖规则](#3-依赖规则)
- [4. 架构分层详解](#4-架构分层详解)
- [5. 模块设计原则](#5-模块设计原则)

---

## 1. 架构概述

### 1.1 混合架构模式

HL8 SAAS平台采用混合架构模式，结合多种架构模式的优势：

```
混合架构 = Clean Architecture + DDD + CQRS + ES + EDA

├── Clean Architecture      # 分层架构，清晰的依赖关系
├── DDD                    # 领域驱动设计，业务为中心
│   └── Rich Domain Model  # 充血模型，业务逻辑在实体
├── CQRS                   # 命令查询分离，读写分离
├── Event Sourcing         # 事件溯源，完整历史记录
└── Event-Driven           # 事件驱动，松耦合异步处理
```

### 1.2 为什么选择 Clean Architecture

#### 核心优势

1. **独立性**
   - 框架独立：不被特定框架绑定
   - 数据库独立：可以切换数据库
   - UI独立：可以支持多种接口
   - 测试独立：业务逻辑可以独立测试

2. **可测试性**
   - 业务逻辑不依赖外部
   - 可以快速运行单元测试
   - 无需启动数据库或服务器

3. **可维护性**
   - 清晰的依赖关系
   - 业务逻辑集中在领域层
   - 易于理解和修改

---

## 2. Clean Architecture

### 2.1 分层架构

```
┌─────────────────────────────────────┐
│      Interface Layer (接口层)        │
│  - Controllers                      │
│  - DTOs                            │
│  - HTTP Handlers                   │
│  - Message Consumers               │
├─────────────────────────────────────┤
│    Application Layer (应用层)        │
│  - Use Cases                       │
│  - Command Handlers                │
│  - Query Handlers                  │
│  - Application Services            │
├─────────────────────────────────────┤
│      Domain Layer (领域层)           │
│  - Entities (实体)                  │
│  - Aggregate Roots (聚合根)        │
│  - Value Objects (值对象)          │
│  - Domain Services (领域服务)      │
│  - Domain Events (领域事件)        │
├─────────────────────────────────────┤
│  Infrastructure Layer (基础设施层)   │
│  - Repositories                    │
│  - Database                        │
│  - Cache                          │
│  - Message Queue                  │
│  - External Services              │
└─────────────────────────────────────┘
```

### 2.2 各层职责

#### 接口层（Interface Layer）

**职责**: 处理外部输入，适配不同协议

```typescript
// HTTP Controller
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserApplicationService) {}
  
  @Post()
  async create(@Body() dto: CreateUserDto) {
    const command = new CreateUserCommand(dto);
    return await this.userService.createUser(command);
  }
}

// Message Consumer
@MessageHandler('user.events')
export class UserEventConsumer {
  async handle(event: UserEvent) {
    // 处理外部事件
  }
}
```

#### 应用层（Application Layer）

**职责**: 协调领域对象，实现用例

```typescript
@Injectable()
export class UserApplicationService {
  // 实现用例：注册用户
  async registerUser(command: RegisterUserCommand): Promise<UserId> {
    // 1. 协调领域对象
    // 2. 事务管理
    // 3. 事件发布
  }
}
```

#### 领域层（Domain Layer）

**职责**: 核心业务逻辑，业务规则

```typescript
// 实体：包含业务逻辑
export class User extends BaseEntity {
  activate(): void {
    // 业务规则在这里
  }
}

// 领域服务：跨实体的业务逻辑
export class TransferDomainService {
  canTransfer(from: Account, to: Account): boolean {
    // 跨实体的业务规则
  }
}
```

#### 基础设施层（Infrastructure Layer）

**职责**: 技术实现细节

```typescript
// 仓储实现
@Injectable()
export class UserRepositoryImpl implements IUserRepository {
  async findById(id: UserId): Promise<User | null> {
    // 数据库访问
  }
}

// 缓存实现
@Injectable()
export class RedisCacheService implements ICacheService {
  // Redis 操作
}
```

---

## 3. 依赖规则

### 3.1 依赖方向

**核心规则**: 依赖只能向内，不能向外

```
Interface → Application → Domain
     ↓           ↓
Infrastructure ←┘

✅ 允许：外层依赖内层
❌ 禁止：内层依赖外层
```

### 3.2 依赖倒置原则

**内层定义接口，外层实现接口**

```typescript
// ✅ 正确：领域层定义接口
// domain/repositories/user-repository.interface.ts
export interface IUserRepository {
  findById(id: UserId): Promise<User | null>;
  save(user: User): Promise<void>;
}

// ✅ 基础设施层实现接口
// infrastructure/repositories/user.repository.ts
@Injectable()
export class UserRepository implements IUserRepository {
  async findById(id: UserId): Promise<User | null> {
    // 数据库实现
  }
}

// ✅ 领域层使用接口（不依赖具体实现）
export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}
}
```

### 3.3 禁止的依赖

```typescript
// ❌ 错误：领域层依赖基础设施层
// domain/user.entity.ts
import { UserRepository } from '../../infrastructure/repositories/user.repository';

export class User {
  async loadRoles() {
    await this.repository.findRoles(); // ❌ 领域层不能依赖仓储
  }
}

// ❌ 错误：领域层依赖框架
import { Injectable } from '@nestjs/common'; // ❌ 领域层不依赖框架

export class User {
  // 领域层应该是纯 TypeScript
}
```

---

## 4. 架构分层详解

### 4.1 接口层设计

**关注点**: 协议适配、输入验证、响应格式化

#### HTTP 接口

```typescript
@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderApplicationService
  ) {}
  
  @Post()
  @UsePipes(ValidationPipe)
  async createOrder(@Body() dto: CreateOrderDto): Promise<OrderResponse> {
    // 1. DTO 验证（由 ValidationPipe 处理）
    // 2. 转换为命令
    const command = CreateOrderCommand.fromDto(dto);
    
    // 3. 调用应用层
    const orderId = await this.orderService.createOrder(command);
    
    // 4. 格式化响应
    return { orderId: orderId.toString() };
  }
}
```

#### 消息队列接口

```typescript
@MessageHandler('order.events')
export class OrderEventHandler {
  async handle(message: OrderEventMessage): Promise<void> {
    // 适配消息队列协议到领域事件
    const event = OrderPlacedEvent.fromMessage(message);
    await this.eventBus.publish(event);
  }
}
```

### 4.2 应用层设计

**关注点**: 用例编排、事务管理、事件发布

#### 用例实现

```typescript
@Injectable()
export class OrderApplicationService {
  /**
   * 创建订单用例
   *
   * 职责：
   * 1. 加载聚合
   * 2. 调用领域方法
   * 3. 事务管理
   * 4. 事件发布
   */
  async createOrder(command: CreateOrderCommand): Promise<OrderId> {
    return await this.unitOfWork.transaction(async () => {
      // 1. 加载聚合
      const customer = await this.customerRepository.findById(
        command.customerId
      );
      
      // 2. 调用领域方法（业务逻辑在这里）
      const order = Order.create(customer);
      command.items.forEach(item => {
        order.addItem(item.product, item.quantity);
      });
      order.place();
      
      // 3. 持久化
      await this.orderRepository.save(order);
      
      // 4. 发布事件
      await this.eventBus.publishAll(order.getDomainEvents());
      
      return order.getId();
    });
  }
}
```

#### CQRS 实现

```typescript
// 命令处理器
@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  async execute(command: CreateUserCommand): Promise<void> {
    const user = User.create(command.email, command.password);
    await this.repository.save(user);
    await this.eventBus.publishAll(user.getDomainEvents());
  }
}

// 查询处理器
@QueryHandler(GetUserQuery)
export class GetUserHandler {
  async execute(query: GetUserQuery): Promise<UserDto> {
    const user = await this.queryRepository.findById(query.userId);
    return UserDto.fromEntity(user);
  }
}
```

### 4.3 领域层设计

**关注点**: 业务规则、领域逻辑、不变性

详见：[领域驱动设计](./02-domain-driven-design.md)

### 4.4 基础设施层设计

**关注点**: 技术实现、外部集成

#### 仓储实现

```typescript
@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orm: EntityRepository<OrderEntity>
  ) {}
  
  async findById(id: OrderId): Promise<Order | null> {
    const entity = await this.orm.findOne({ id: id.toString() });
    return entity ? OrderMapper.toDomain(entity) : null;
  }
  
  async save(order: Order): Promise<void> {
    const entity = OrderMapper.toEntity(order);
    await this.orm.persistAndFlush(entity);
  }
}
```

---

## 5. 模块设计原则

### 5.1 模块边界

每个模块应该：

- ✅ 有清晰的职责边界
- ✅ 通过接口对外提供服务
- ✅ 最小化对其他模块的依赖
- ✅ 可以独立部署（面向微服务）

### 5.2 模块依赖

```
业务模块（libs/）
    ↓
基础设施模块（packages/）
    ↓
核心框架（NestJS、TypeScript）
```

---

## 📚 扩展阅读

- [领域驱动设计详解](./02-domain-driven-design.md)
- [CQRS与事件溯源](./03-cqrs-event-sourcing.md)
- [事件驱动架构](./04-event-driven-architecture.md)
- [充血模型实践](../guidelines/02-rich-domain-model-practice.md)

---

**返回**: [架构文档中心](./README.md)
