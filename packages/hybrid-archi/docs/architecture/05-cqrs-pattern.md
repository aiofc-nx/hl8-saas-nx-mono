# CQRS 模式设计文档

> **文档版本**: 1.0.0  
> **创建日期**: 2025-01-27  

---

## 📋 目录

- [1. CQRS 概述](#1-cqrs-概述)
- [2. 架构设计](#2-架构设计)
- [3. 核心组件](#3-核心组件)
- [4. 实现指南](#4-实现指南)
- [5. 最佳实践](#5-最佳实践)

---

## 1. CQRS 概述

### 1.1 定义

CQRS (Command Query Responsibility Segregation) 是命令查询职责分离模式，将系统的读操作和写操作分离到不同的模型中。

### 1.2 核心概念

```
┌─────────────────────────────────────────────────────────┐
│                   CQRS Pattern                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Command Side (命令端)        Query Side (查询端)        │
│  ┌───────────────┐            ┌───────────────┐        │
│  │   Commands    │            │    Queries    │        │
│  │   (写操作)     │            │   (读操作)     │        │
│  └───────┬───────┘            └───────┬───────┘        │
│          │                            │                │
│          ▼                            ▼                │
│  ┌───────────────┐            ┌───────────────┐        │
│  │Command Handler│            │ Query Handler │        │
│  └───────┬───────┘            └───────┬───────┘        │
│          │                            │                │
│          ▼                            ▼                │
│  ┌───────────────┐            ┌───────────────┐        │
│  │  Write Model  │            │  Read Model   │        │
│  │ (聚合根)       │            │  (投影)        │        │
│  └───────┬───────┘            └───────────────┘        │
│          │                                             │
│          │ Domain Events                               │
│          └─────────────────────┬───────────────────────┘
│                                │
│                                ▼
│                        ┌───────────────┐
│                        │  Event Bus    │
│                        └───────┬───────┘
│                                │
│                                ▼
│                        ┌───────────────┐
│                        │  Projectors   │
│                        └───────────────┘
└─────────────────────────────────────────────────────────┘
```

### 1.3 优势

- ✅ **性能优化**：读写分离，可独立优化
- ✅ **可扩展性**：读写可独立扩展
- ✅ **复杂性管理**：简化复杂查询
- ✅ **灵活性**：读模型可定制化

---

## 2. 架构设计

### 2.1 命令端设计

#### 命令对象

```typescript
/**
 * 命令基类
 */
export abstract class BaseCommand {
  private readonly _commandId: EntityId;
  private readonly _createdAt: Date;
  
  protected constructor(
    private readonly _tenantId: string,
    private readonly _userId: string,
    private readonly _metadata?: Record<string, unknown>
  ) {
    this._commandId = EntityId.generate();
    this._createdAt = new Date();
  }
  
  abstract get commandType(): string;
  abstract get commandData(): Record<string, unknown>;
}
```

#### 命令处理器

```typescript
/**
 * 命令处理器接口
 */
export interface ICommandHandler<TCommand extends BaseCommand = BaseCommand> {
  execute(command: TCommand): Promise<void>;
  validateCommand(command: TCommand): void;
  canHandle(command: TCommand): Promise<boolean>;
  getSupportedCommandType(): string;
}
```

#### 命令总线

```typescript
/**
 * 命令总线
 */
export class CommandBus {
  private readonly handlers = new Map<string, ICommandHandler>();
  
  async execute<TCommand extends BaseCommand>(
    command: TCommand
  ): Promise<void> {
    const handler = this.handlers.get(command.commandType);
    if (!handler) {
      throw new Error(`No handler for command: ${command.commandType}`);
    }
    await handler.execute(command);
  }
  
  registerHandler(type: string, handler: ICommandHandler): void {
    this.handlers.set(type, handler);
  }
}
```

### 2.2 查询端设计

#### 查询对象

```typescript
/**
 * 查询基类
 */
export abstract class BaseQuery {
  private readonly _queryId: EntityId;
  private readonly _createdAt: Date;
  
  protected constructor(
    private readonly _tenantId: string,
    private readonly _userId: string,
    private readonly _page: number = 1,
    private readonly _pageSize: number = 10
  ) {
    this._queryId = EntityId.generate();
    this._createdAt = new Date();
  }
  
  abstract get queryType(): string;
  abstract get queryData(): Record<string, unknown>;
}
```

#### 查询处理器

```typescript
/**
 * 查询处理器接口
 */
export interface IQueryHandler<
  TQuery extends BaseQuery = BaseQuery,
  TResult extends IQueryResult = IQueryResult
> {
  execute(query: TQuery): Promise<TResult>;
  validateQuery(query: TQuery): void;
  canHandle(query: TQuery): Promise<boolean>;
  getSupportedQueryType(): string;
  generateCacheKey(query: TQuery): string;
}
```

#### 查询总线

```typescript
/**
 * 查询总线
 */
export class QueryBus {
  private readonly handlers = new Map<string, IQueryHandler>();
  private readonly cache = new Map();
  
  async execute<TQuery extends BaseQuery, TResult extends IQueryResult>(
    query: TQuery
  ): Promise<TResult> {
    const handler = this.handlers.get(query.queryType);
    if (!handler) {
      throw new Error(`No handler for query: ${query.queryType}`);
    }
    
    // 检查缓存
    const cacheKey = handler.generateCacheKey(query);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // 执行查询
    const result = await handler.execute(query);
    
    // 缓存结果
    this.cache.set(cacheKey, result);
    
    return result;
  }
}
```

---

## 3. 核心组件

### 3.1 CommandBus - 命令总线

**职责**：

- 接收和路由命令
- 调用命令处理器
- 执行中间件
- 错误处理

**使用示例**：

```typescript
// 1. 定义命令
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

// 2. 实现命令处理器
@CommandHandler('CreateUser')
export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}
  
  async execute(command: CreateUserCommand): Promise<void> {
    const user = UserAggregate.create(command.name, command.email);
    await this.userRepository.save(user);
  }
  
  validateCommand(command: CreateUserCommand): void {
    if (!command.name) throw new Error('Name is required');
    if (!command.email) throw new Error('Email is required');
  }
  
  async canHandle(command: CreateUserCommand): Promise<boolean> {
    return true;
  }
  
  getSupportedCommandType(): string {
    return 'CreateUser';
  }
}

// 3. 使用命令总线
const commandBus = new CommandBus();
commandBus.registerHandler('CreateUser', new CreateUserCommandHandler(...));

const command = new CreateUserCommand('张三', 'zhangsan@example.com', 'tenant-1', 'user-1');
await commandBus.execute(command);
```

### 3.2 QueryBus - 查询总线

**职责**：

- 接收和路由查询
- 调用查询处理器
- 管理查询缓存
- 性能优化

**使用示例**：

```typescript
// 1. 定义查询
export class GetUsersQuery extends BaseQuery {
  constructor(
    public readonly status?: string,
    tenantId: string,
    userId: string,
    page = 1,
    pageSize = 10
  ) {
    super(tenantId, userId, page, pageSize);
  }
  
  get queryType(): string {
    return 'GetUsers';
  }
}

// 2. 定义查询结果
export class UsersQueryResult implements IQueryResult {
  constructor(
    private readonly users: UserDto[],
    private readonly pagination: IPaginationInfo
  ) {}
  
  getData(): UserDto[] {
    return this.users;
  }
  
  getPaginationInfo(): IPaginationInfo {
    return this.pagination;
  }
}

// 3. 实现查询处理器
@QueryHandler('GetUsers')
export class GetUsersQueryHandler implements IQueryHandler<GetUsersQuery, UsersQueryResult> {
  constructor(
    private readonly readModel: IUserReadModel
  ) {}
  
  async execute(query: GetUsersQuery): Promise<UsersQueryResult> {
    const users = await this.readModel.getUsers({
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
    });
    return new UsersQueryResult(users.data, users.pagination);
  }
  
  generateCacheKey(query: GetUsersQuery): string {
    return `users:${query.status}:${query.page}:${query.pageSize}`;
  }
  
  getSupportedQueryType(): string {
    return 'GetUsers';
  }
}

// 4. 使用查询总线
const queryBus = new QueryBus();
queryBus.registerHandler('GetUsers', new GetUsersQueryHandler(...));

const query = new GetUsersQuery('active', 'tenant-1', 'user-1', 1, 10);
const result = await queryBus.execute<GetUsersQuery, UsersQueryResult>(query);
console.log('Users:', result.getData());
```

### 3.3 EventBus - 事件总线

**职责**：

- 发布领域事件
- 管理事件订阅
- 异步事件处理
- 事件投影

**使用示例**：

```typescript
// 1. 定义领域事件
export class UserCreatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string,
    public readonly userId: string,
    public readonly userName: string,
    public readonly userEmail: string
  ) {
    super(aggregateId, aggregateVersion, tenantId);
  }
  
  get eventType(): string {
    return 'UserCreated';
  }
}

// 2. 实现事件处理器
@EventHandler('UserCreated')
export class UserCreatedEventHandler implements IEventHandler<UserCreatedEvent> {
  async handle(event: UserCreatedEvent): Promise<void> {
    console.log('User created:', event.userName);
    // 发送欢迎邮件、创建用户配置等
  }
  
  getSupportedEventType(): string {
    return 'UserCreated';
  }
}

// 3. 实现事件投影器（更新读模型）
@EventProjector('UserCreated')
export class UserCreatedProjector extends BaseEventProjector<UserCreatedEvent> {
  async project(event: UserCreatedEvent): Promise<void> {
    // 更新读模型
    await this.readModel.create({
      id: event.userId,
      name: event.userName,
      email: event.userEmail,
    });
  }
}

// 4. 使用事件总线
const eventBus = new EventBus();
eventBus.registerHandler('UserCreated', new UserCreatedEventHandler());

const event = new UserCreatedEvent(aggregateId, 1, 'tenant-1', 'user-1', '张三', 'zhangsan@example.com');
await eventBus.publish(event);
```

---

## 4. 实现指南

### 4.1 命令实现步骤

```typescript
// 步骤 1: 定义命令
export class UpdateUserEmailCommand extends BaseCommand {
  constructor(
    public readonly userId: string,
    public readonly newEmail: string,
    tenantId: string,
    executorId: string
  ) {
    super(tenantId, executorId);
  }
  
  get commandType(): string {
    return 'UpdateUserEmail';
  }
  
  override get commandData(): Record<string, unknown> {
    return {
      userId: this.userId,
      newEmail: this.newEmail,
    };
  }
}

// 步骤 2: 实现命令处理器
@CommandHandler('UpdateUserEmail')
export class UpdateUserEmailCommandHandler 
  implements ICommandHandler<UpdateUserEmailCommand> {
  
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventStore: IEventStore
  ) {}
  
  async execute(command: UpdateUserEmailCommand): Promise<void> {
    // 1. 验证命令
    this.validateCommand(command);
    
    // 2. 加载聚合根
    const user = await this.userRepository.findById(
      EntityId.fromString(command.userId)
    );
    if (!user) {
      throw new Error('User not found');
    }
    
    // 3. 执行业务逻辑（在聚合根内）
    const email = Email.create(command.newEmail);
    user.updateEmail(email);
    
    // 4. 保存聚合根
    await this.userRepository.save(user);
    
    // 5. 保存事件到事件存储
    const events = user.getUncommittedEvents();
    await this.eventStore.saveEvents(user.id.toString(), events);
    
    // 6. 发布事件
    user.markEventsAsCommitted();
  }
  
  validateCommand(command: UpdateUserEmailCommand): void {
    if (!command.userId) {
      throw new Error('User ID is required');
    }
    if (!command.newEmail) {
      throw new Error('New email is required');
    }
  }
  
  async canHandle(command: UpdateUserEmailCommand): Promise<boolean> {
    return true;
  }
  
  getSupportedCommandType(): string {
    return 'UpdateUserEmail';
  }
}
```

### 4.2 查询实现步骤

```typescript
// 步骤 1: 定义查询
export class GetUserByIdQuery extends BaseQuery {
  constructor(
    public readonly userId: string,
    tenantId: string,
    executorId: string
  ) {
    super(tenantId, executorId);
  }
  
  get queryType(): string {
    return 'GetUserById';
  }
  
  override get queryData(): Record<string, unknown> {
    return {
      userId: this.userId,
    };
  }
}

// 步骤 2: 定义查询结果
export class UserQueryResult implements IQueryResult {
  constructor(private readonly user: UserDto) {}
  
  getData(): UserDto {
    return this.user;
  }
  
  getPaginationInfo(): IPaginationInfo {
    return {
      page: 1,
      pageSize: 1,
      totalCount: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }
  
  getTotalCount(): number {
    return 1;
  }
  
  hasData(): boolean {
    return !!this.user;
  }
  
  toJSON(): Record<string, unknown> {
    return this.user;
  }
}

// 步骤 3: 实现查询处理器
@QueryHandler('GetUserById')
export class GetUserByIdQueryHandler 
  implements IQueryHandler<GetUserByIdQuery, UserQueryResult> {
  
  constructor(
    private readonly userReadModel: IUserReadModel
  ) {}
  
  async execute(query: GetUserByIdQuery): Promise<UserQueryResult> {
    // 1. 验证查询
    this.validateQuery(query);
    
    // 2. 从读模型查询数据
    const user = await this.userReadModel.findById(query.userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // 3. 返回查询结果
    return new UserQueryResult(user);
  }
  
  validateQuery(query: GetUserByIdQuery): void {
    if (!query.userId) {
      throw new Error('User ID is required');
    }
  }
  
  async canHandle(query: GetUserByIdQuery): Promise<boolean> {
    return true;
  }
  
  getSupportedQueryType(): string {
    return 'GetUserById';
  }
  
  generateCacheKey(query: GetUserByIdQuery): string {
    return `user:${query.userId}`;
  }
  
  getCacheExpiration(): number {
    return 300; // 5 分钟
  }
}
```

---

## 5. 最佳实践

### 5.1 命令设计原则

#### ✅ DO - 应该做的

1. **命令表达意图**

   ```typescript
   // ✅ 好的命名
   class ActivateUserCommand extends BaseCommand {}
   class CancelOrderCommand extends BaseCommand {}
   
   // ❌ 不好的命名
   class UpdateUserCommand extends BaseCommand {}  // 太泛化
   class DoSomethingCommand extends BaseCommand {} // 不明确
   ```

2. **命令无返回值**

   ```typescript
   // ✅ 命令处理器不返回数据
   async execute(command: CreateUserCommand): Promise<void> {
     // 只执行操作，不返回数据
   }
   
   // ❌ 命令处理器返回数据
   async execute(command: CreateUserCommand): Promise<UserDto> {
     // 不应该返回数据
   }
   ```

3. **命令包含完整信息**

   ```typescript
   class CreateOrderCommand extends BaseCommand {
     constructor(
       public readonly customerId: string,
       public readonly items: OrderItemDto[],     // 完整信息
       public readonly shippingAddress: AddressDto, // 完整信息
       tenantId: string,
       userId: string
     ) {
       super(tenantId, userId);
     }
   }
   ```

#### ❌ DON'T - 不应该做的

1. **不要在命令中包含查询逻辑**
2. **不要让命令可变**
3. **不要在命令中包含技术细节**

### 5.2 查询设计原则

#### ✅ DO - 应该做的

1. **查询无副作用**

   ```typescript
   // ✅ 查询只读取数据
   async execute(query: GetUsersQuery): Promise<UsersQueryResult> {
     const users = await this.readModel.getUsers(query);
     return new UsersQueryResult(users);
   }
   
   // ❌ 查询修改数据
   async execute(query: GetUsersQuery): Promise<UsersQueryResult> {
     const users = await this.readModel.getUsers(query);
     users.forEach(u => u.lastViewed = new Date()); // 修改了状态！
     return new UsersQueryResult(users);
   }
   ```

2. **使用专门的读模型**

   ```typescript
   // ✅ 专门的读模型
   interface IUserReadModel {
     findById(id: string): Promise<UserDto>;
     getActiveUsers(page: number, size: number): Promise<UserDto[]>;
   }
   ```

3. **支持分页**

   ```typescript
   export class GetUsersQuery extends BaseQuery {
     constructor(
       tenantId: string,
       userId: string,
       page = 1,
       pageSize = 10
     ) {
       super(tenantId, userId, page, pageSize);
     }
   }
   ```

---

## 📚 相关文档

- [架构概述](00-overview.md)
- [领域层设计](01-domain-layer.md)
- [应用层设计](02-application-layer.md)
- [事件溯源设计](06-event-sourcing.md)

---

**文档维护**: HL8 架构团队  
**最后更新**: 2025-01-27
