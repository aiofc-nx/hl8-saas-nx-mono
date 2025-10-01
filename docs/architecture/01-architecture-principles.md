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
- [6. 混合架构模式的价值](#6-混合架构模式的价值)

---

## 1. 架构概述

### 1.1 混合架构模式

HL8 SAAS平台采用混合架构模式，结合多种架构模式的优势：

```text
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

#### 架构分层图

```mermaid
graph TD
    subgraph "Interface Layer"
        A1["REST API - Commands"]
        A2["REST API - Queries"]
        A3["GraphQL Resolvers"]
        A4["WebSocket Gateway"]
        A5["CLI Commands"]
        A6["Message Consumers"]
        A7["DTOs"]
    end
    
    subgraph "Application Layer"
        B1["Use Cases"]
        B2["Command Handlers"]
        B3["Query Handlers"]
        B4["Event Handlers"]
        B5["Application Services"]
        B6["Transaction Management"]
    end
    
    subgraph "Domain Layer"
        C1["Aggregate Roots"]
        C2["Entities"]
        C3["Value Objects"]
        C4["Domain Services"]
        C5["Domain Events"]
        C6["Business Rules"]
    end
    
    subgraph "Infrastructure Layer"
        D1["Event Store"]
        D2["Message Bus"]
        D3["Database Repositories"]
        D4["Cache Services"]
        D5["External Services"]
        D6["File Storage"]
    end
    
    A1 --> B2
    A2 --> B3
    A3 --> B3
    A4 --> B2
    A4 --> B3
    A4 --> B4
    A5 --> B2
    A6 --> B4
    
    B1 --> C1
    B2 --> C1
    B3 --> C2
    B4 --> C4
    B5 --> C5
    B6 --> C6
    
    C1 -.-> D1
    C2 -.-> D3
    C3 -.-> D4
    C4 -.-> D5
    C5 -.-> D2
    
    D2 -.-> B4
    D2 -.-> A6
    
    style A1 fill:#ffebee
    style A2 fill:#e3f2fd
    style A3 fill:#e3f2fd
    style B2 fill:#ffebee
    style B3 fill:#e3f2fd
    style B4 fill:#f3e5f5
    style C1 fill:#e8f5e8
    style D1 fill:#fff3e0
```

#### 分层结构说明

```text
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

#### CQRS 绑定关系说明

**命令端 (Write Side)**:

- REST API Commands → Command Handlers
- CLI Commands → Command Handlers
- WebSocket Commands → Command Handlers

**查询端 (Read Side)**:

- REST API Queries → Query Handlers
- GraphQL Resolvers → Query Handlers (主要用于查询)
- WebSocket Queries → Query Handlers

**事件处理**:

- Message Consumers → Event Handlers
- WebSocket Events → Event Handlers

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

```text
Interface → Application → Domain
     ↓           ↓
Infrastructure ←┘

✅ 允许：外层依赖内层
❌ 禁止：内层依赖外层
```

### 3.2 依赖倒置原则

内层定义接口，外层实现接口

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

```text
业务模块（libs/）
    ↓
基础设施模块（packages/）
    ↓
核心框架（NestJS、TypeScript）
```

---

---

## 6. 混合架构模式的价值

### 6.1 为 SAAS 平台带来的价值

混合架构模式（Clean Architecture + DDD + CQRS + ES + EDA）为 SAAS 平台提供了全面的技术支撑，在业务、技术、开发和运营等多个维度创造显著价值。

#### 业务价值

多租户支持能力

- **租户隔离**: Clean Architecture 的层次分离天然支持租户级别的数据隔离
- **个性化配置**: 事件溯源记录每个租户的配置变更历史，支持配置回滚和审计
- **租户级扩展**: 事件驱动架构支持按租户进行独立的服务扩展

订阅和计费管理

- **使用量追踪**: 事件溯源精确记录每个租户的功能使用情况
- **计费准确性**: CQRS 的读模型可以实时计算使用量和费用
- **计费审计**: 完整的事件历史支持计费争议的审计和追溯

合规性和审计

- **完整审计轨迹**: 事件溯源提供完整的业务操作历史记录
- **数据治理**: 清晰的数据流向和事件边界便于数据治理
- **合规报告**: 基于事件数据自动生成合规报告
- **安全审计**: 通过事件日志实现安全事件的追踪和分析

#### 技术价值

高可扩展性

- **水平扩展**: 事件驱动架构支持服务独立扩展
- **读写分离**: CQRS 允许读写服务独立扩展
- **负载均衡**: 查询端可以部署多个实例处理高并发查询
- **微服务友好**: 清晰的模块边界便于微服务拆分

高性能

- **查询优化**: CQRS 读模型针对查询场景优化，提升查询性能
- **缓存友好**: 读模型天然适合缓存，减少数据库压力
- **异步处理**: 事件驱动架构将耗时操作异步化，提升响应速度
- **资源隔离**: 读写分离避免相互影响，提升整体性能

高可靠性

- **故障恢复**: 事件溯源支持从任意时间点恢复系统状态
- **数据一致性**: 事件驱动架构通过最终一致性模型保证数据完整性
- **容错能力**: 松耦合的事件架构提高系统容错能力
- **补偿机制**: 支持业务补偿和回滚操作

高可维护性

- **代码组织**: Clean Architecture 提供清晰的代码结构和依赖关系
- **测试友好**: 各层独立，便于单元测试和集成测试
- **技术演进**: 松耦合设计支持技术栈的渐进式升级
- **调试便利**: 事件日志提供完整的业务执行轨迹

#### 开发价值

开发效率

- **快速原型**: Clean Architecture 的分层使新功能开发更快速
- **代码复用**: 领域层代码可在不同接口间复用
- **团队协作**: 清晰的边界便于团队并行开发
- **学习曲线**: 标准化的架构降低新成员学习成本

业务敏捷性

- **需求变更**: 松耦合设计降低需求变更的影响范围
- **集成能力**: 事件驱动架构便于与第三方系统集成
- **功能开关**: 基于事件的架构支持功能的热插拔
- **快速迭代**: 模块化设计支持功能的快速迭代

#### 运营价值

快速迭代

- **功能解耦**: 事件驱动架构支持功能的独立开发和部署
- **A/B 测试**: 基于事件的架构便于实现功能开关和 A/B 测试
- **灰度发布**: 支持按租户或用户群体进行灰度发布
- **回滚能力**: 事件溯源支持快速回滚到历史状态

成本控制

- **资源优化**: CQRS 允许根据实际使用情况优化资源分配
- **按需扩展**: 事件驱动架构支持按需扩展，避免资源浪费
- **运维效率**: 清晰的架构边界降低运维复杂度
- **监控友好**: 事件日志提供丰富的监控和告警数据

客户体验

- **实时响应**: 异步事件处理提升用户体验
- **个性化服务**: 基于事件历史提供个性化功能
- **服务可用性**: 高可靠性架构保证服务稳定性
- **响应速度**: 读写分离和缓存优化提升响应速度

### 6.2 架构价值实现机制

#### Clean Architecture 的价值实现

```text
分层隔离 → 技术独立 → 业务稳定
    ↓
依赖倒置 → 接口抽象 → 灵活扩展
    ↓
关注点分离 → 职责清晰 → 易于维护
```

#### DDD 的价值实现

```text
领域建模 → 业务理解 → 需求准确
    ↓
充血模型 → 业务逻辑集中 → 代码质量
    ↓
统一语言 → 团队协作 → 开发效率
```

#### CQRS 的价值实现

```text
读写分离 → 性能优化 → 用户体验
    ↓
模型优化 → 查询效率 → 响应速度
    ↓
独立扩展 → 资源优化 → 成本控制
```

#### 事件溯源的价值实现

```text
完整历史 → 审计合规 → 业务保障
    ↓
状态重建 → 故障恢复 → 系统可靠
    ↓
事件驱动 → 松耦合 → 架构灵活
```

#### 事件驱动架构的价值实现

```text
异步处理 → 性能提升 → 用户体验
    ↓
松耦合 → 独立部署 → 快速迭代
    ↓
事件总线 → 系统集成 → 业务扩展
```

---

## 📚 扩展阅读

- [领域驱动设计详解](./02-domain-driven-design.md)
- [CQRS与事件溯源](./03-cqrs-event-sourcing.md)
- [事件驱动架构](./04-event-driven-architecture.md)
- [充血模型实践](../guidelines/02-rich-domain-model-practice.md)

---

**返回**: [架构文档中心](./README.md)
