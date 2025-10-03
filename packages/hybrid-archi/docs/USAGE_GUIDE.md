# Hybrid Architecture 使用指南

## 快速开始

### 1. 安装依赖

```bash
pnpm add @hl8/hybrid-archi
```

### 2. 基础配置

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { HybridArchitectureModule } from '@hl8/hybrid-archi';

@Module({
  imports: [
    HybridArchitectureModule.forRoot({
      // 缓存配置
      cache: {
        enabled: true,
        level: 'multi',
        defaultTtl: 3600,
        maxSize: 10000,
        preload: true,
        monitoring: true,
        statistics: true,
        compression: true,
        encryption: false,
        partitioning: true,
        partitionCount: 4
      },
      // 连接池配置
      connectionPool: {
        minConnections: 5,
        maxConnections: 50,
        connectionTimeout: 30000,
        idleTimeout: 300000,
        validationInterval: 60000,
        retryCount: 3,
        retryInterval: 1000,
        monitoring: true,
        statistics: true,
        healthCheck: true,
        healthCheckInterval: 30000
      },
      // 异步处理器配置
      asyncProcessor: {
        enabled: true,
        maxConcurrency: 10,
        taskTimeout: 30000,
        maxRetries: 3,
        retryInterval: 1000,
        queueSize: 1000,
        monitoring: true,
        statistics: true,
        persistence: true,
        priority: true
      }
    })
  ]
})
export class AppModule {}
```

## 领域层使用

### 1. 创建实体

```typescript
// user.entity.ts
import { BaseEntity, EntityId } from '@hl8/hybrid-archi';

export class User extends BaseEntity {
  constructor(
    id: EntityId,
    private name: string,
    private email: string,
    private status: UserStatus = UserStatus.ACTIVE
  ) {
    super(id);
  }

  getName(): string {
    return this.name;
  }

  getEmail(): string {
    return this.email;
  }

  getStatus(): UserStatus {
    return this.status;
  }

  updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }
    this.name = newName.trim();
    this.updateTimestamp();
  }

  updateEmail(newEmail: string): void {
    if (!this.isValidEmail(newEmail)) {
      throw new Error('Invalid email format');
    }
    this.email = newEmail;
    this.updateTimestamp();
  }

  activate(): void {
    if (this.status === UserStatus.ACTIVE) {
      throw new Error('User is already active');
    }
    this.status = UserStatus.ACTIVE;
    this.updateTimestamp();
  }

  deactivate(): void {
    if (this.status === UserStatus.INACTIVE) {
      throw new Error('User is already inactive');
    }
    this.status = UserStatus.INACTIVE;
    this.updateTimestamp();
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending'
}
```

### 2. 创建聚合根

```typescript
// user.aggregate.ts
import { BaseAggregateRoot, EntityId, DomainEvent } from '@hl8/hybrid-archi';

export class UserAggregate extends BaseAggregateRoot {
  constructor(
    id: EntityId,
    private name: string,
    private email: string,
    private status: UserStatus = UserStatus.PENDING
  ) {
    super(id);
  }

  createUser(): void {
    this.addDomainEvent(new UserCreatedEvent(
      this.id,
      this.name,
      this.email,
      this.status
    ));
  }

  updateUser(newName: string, newEmail: string): void {
    this.name = newName;
    this.email = newEmail;
    this.addDomainEvent(new UserUpdatedEvent(
      this.id,
      this.name,
      this.email
    ));
  }

  activateUser(): void {
    this.status = UserStatus.ACTIVE;
    this.addDomainEvent(new UserActivatedEvent(this.id));
  }

  deactivateUser(): void {
    this.status = UserStatus.INACTIVE;
    this.addDomainEvent(new UserDeactivatedEvent(this.id));
  }
}

// 领域事件
export class UserCreatedEvent extends DomainEvent {
  constructor(
    public readonly aggregateId: EntityId,
    public readonly name: string,
    public readonly email: string,
    public readonly status: UserStatus
  ) {
    super();
  }
}

export class UserUpdatedEvent extends DomainEvent {
  constructor(
    public readonly aggregateId: EntityId,
    public readonly name: string,
    public readonly email: string
  ) {
    super();
  }
}

export class UserActivatedEvent extends DomainEvent {
  constructor(public readonly aggregateId: EntityId) {
    super();
  }
}

export class UserDeactivatedEvent extends DomainEvent {
  constructor(public readonly aggregateId: EntityId) {
    super();
  }
}
```

### 3. 创建值对象

```typescript
// email.vo.ts
import { BaseValueObject } from '@hl8/hybrid-archi';

export class Email extends BaseValueObject {
  constructor(private value: string) {
    super();
    this.validate();
  }

  private validate(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }

    if (!this.isValidEmail(this.value)) {
      throw new Error('Invalid email format');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getValue(): string {
    return this.value;
  }

  getDomain(): string {
    return this.value.split('@')[1];
  }

  getLocalPart(): string {
    return this.value.split('@')[0];
  }

  protected arePropertiesEqual(other: Email): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }
}
```

## 应用层使用

### 1. 创建用例

```typescript
// create-user.use-case.ts
import { BaseUseCase, IUseCase } from '@hl8/hybrid-archi';

export interface CreateUserRequest {
  name: string;
  email: string;
}

export interface CreateUserResponse {
  userId: string;
  name: string;
  email: string;
  status: UserStatus;
}

export class CreateUserUseCase extends BaseUseCase<CreateUserRequest, CreateUserResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus,
    private readonly validator: BusinessValidator,
    private readonly transformer: EntityTransformer,
    private readonly cache: CacheStrategy,
    private readonly asyncProcessor: AsyncProcessor
  ) {
    super();
  }

  async executeUseCase(request: CreateUserRequest): Promise<CreateUserResponse> {
    // 1. 验证输入数据
    const validation = await this.validator.validateBusinessData(request, [
      'required',
      'isString',
      'minLength',
      'maxLength',
      'email'
    ]);

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // 2. 创建用户聚合
    const userAggregate = new UserAggregate(
      EntityId.generate(),
      request.name,
      request.email,
      UserStatus.PENDING
    );

    // 3. 保存用户
    await this.userRepository.save(userAggregate);

    // 4. 发布领域事件
    await this.eventBus.publish(new UserCreatedEvent(
      userAggregate.id,
      userAggregate.name,
      userAggregate.email,
      userAggregate.status
    ));

    // 5. 缓存用户数据
    await this.cache.set(`user:${userAggregate.id}`, userAggregate, 3600);

    // 6. 异步处理后续任务
    await this.asyncProcessor.submitTask('sendWelcomeEmail', {
      userId: userAggregate.id.toString(),
      email: userAggregate.email
    }, {
      priority: 'normal',
      timeout: 30000,
      maxRetries: 3
    });

    return {
      userId: userAggregate.id.toString(),
      name: userAggregate.name,
      email: userAggregate.email,
      status: userAggregate.status
    };
  }
}
```

### 2. 创建CQRS命令

```typescript
// create-user.command.ts
import { BaseCommand } from '@hl8/hybrid-archi';

export class CreateUserCommand extends BaseCommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    tenantId?: string,
    userId?: string
  ) {
    super(tenantId, userId);
  }
}

// create-user.command-handler.ts
import { ICommandHandler } from '@hl8/hybrid-archi';

export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase
  ) {}

  async handle(command: CreateUserCommand): Promise<void> {
    await this.createUserUseCase.execute({
      name: command.name,
      email: command.email
    });
  }
}
```

### 3. 创建CQRS查询

```typescript
// get-user.query.ts
import { BaseQuery } from '@hl8/hybrid-archi';

export class GetUserQuery extends BaseQuery {
  constructor(
    public readonly userId: string,
    tenantId?: string,
    userId?: string
  ) {
    super(tenantId, userId);
  }
}

// get-user.query-handler.ts
import { IQueryHandler } from '@hl8/hybrid-archi';

export class GetUserQueryHandler implements IQueryHandler<GetUserQuery, User> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly cache: CacheStrategy
  ) {}

  async handle(query: GetUserQuery): Promise<User> {
    // 1. 尝试从缓存获取
    const cachedUser = await this.cache.get<User>(`user:${query.userId}`);
    if (cachedUser) {
      return cachedUser;
    }

    // 2. 从数据库获取
    const user = await this.userRepository.findById(EntityId.fromString(query.userId));
    if (!user) {
      throw new Error('User not found');
    }

    // 3. 缓存用户数据
    await this.cache.set(`user:${user.id}`, user, 3600);

    return user;
  }
}
```

## 基础设施层使用

### 1. 实现事件存储

```typescript
// user-event-store.ts
import { EventStoreImplementation } from '@hl8/hybrid-archi';

export class UserEventStore extends EventStoreImplementation {
  async saveUserEvents(
    userId: string,
    events: DomainEvent[],
    expectedVersion: number
  ): Promise<void> {
    await this.saveEvents(userId, events, expectedVersion);
  }

  async getUserEvents(userId: string): Promise<DomainEvent[]> {
    return await this.getEvents(userId);
  }

  async getUserEventsFromVersion(
    userId: string,
    fromVersion: number
  ): Promise<DomainEvent[]> {
    return await this.getEventsFromVersion(userId, fromVersion);
  }
}
```

### 2. 实现快照存储

```typescript
// user-snapshot-store.ts
import { SnapshotStoreImplementation } from '@hl8/hybrid-archi';

export class UserSnapshotStore extends SnapshotStoreImplementation {
  async saveUserSnapshot(
    userId: string,
    userData: any,
    version: number
  ): Promise<void> {
    await this.saveSnapshot(userId, userData, version);
  }

  async getUserSnapshot(userId: string, version: number): Promise<any> {
    return await this.getSnapshot(userId, version);
  }

  async getLatestUserSnapshot(userId: string): Promise<any> {
    return await this.getLatestSnapshot(userId);
  }
}
```

### 3. 实现事件总线

```typescript
// user-event-bus.ts
import { CoreEventBus } from '@hl8/hybrid-archi';

export class UserEventBus extends CoreEventBus {
  async publishUserCreatedEvent(event: UserCreatedEvent): Promise<void> {
    await this.publish(event);
  }

  async publishUserUpdatedEvent(event: UserUpdatedEvent): Promise<void> {
    await this.publish(event);
  }

  async subscribeToUserEvents(handler: (event: DomainEvent) => Promise<void>): Promise<void> {
    await this.subscribe('UserCreatedEvent', handler);
    await this.subscribe('UserUpdatedEvent', handler);
    await this.subscribe('UserActivatedEvent', handler);
    await this.subscribe('UserDeactivatedEvent', handler);
  }
}
```

## 接口层使用

### 1. 创建控制器

```typescript
// user.controller.ts
import { BaseController, Audit } from '@hl8/hybrid-archi';

@Controller('users')
export class UserController extends BaseController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase
  ) {
    super();
  }

  @Post()
  @Audit({ level: 'detailed', tags: ['user-creation'] })
  async createUser(@Body() request: CreateUserRequest): Promise<CreateUserResponse> {
    return await this.createUserUseCase.execute(request);
  }

  @Get(':id')
  @Audit({ level: 'basic' })
  async getUser(@Param('id') id: string): Promise<User> {
    return await this.getUserUseCase.execute({ userId: id });
  }

  @Put(':id')
  @Audit({ level: 'detailed', tags: ['user-update'] })
  async updateUser(
    @Param('id') id: string,
    @Body() request: UpdateUserRequest
  ): Promise<UpdateUserResponse> {
    return await this.updateUserUseCase.execute({
      userId: id,
      ...request
    });
  }

  @Delete(':id')
  @Audit({ level: 'comprehensive', tags: ['user-deletion', 'sensitive'] })
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.deleteUserUseCase.execute({ userId: id });
  }
}
```

### 2. 使用装饰器

```typescript
// user.service.ts
import { 
  Audit, 
  DetailedAudit, 
  ComprehensiveAudit,
  SensitiveOperationAudit,
  PerformanceAudit,
  SecurityAudit,
  DataChangeAudit,
  BusinessOperationAudit
} from '@hl8/hybrid-archi';

export class UserService {
  @DetailedAudit()
  async createUser(userData: CreateUserDto): Promise<User> {
    // 创建用户逻辑
  }

  @SensitiveOperationAudit(['user-deletion'])
  async deleteUser(userId: string): Promise<void> {
    // 删除用户逻辑
  }

  @PerformanceAudit()
  async processLargeUserDataset(users: User[]): Promise<User[]> {
    // 处理大量用户数据
  }

  @SecurityAudit()
  async changeUserPassword(userId: string, newPassword: string): Promise<void> {
    // 修改密码逻辑
  }

  @DataChangeAudit()
  async updateUserProfile(userId: string, profile: UserProfile): Promise<void> {
    // 更新用户资料
  }

  @BusinessOperationAudit('user-management')
  async activateUser(userId: string): Promise<void> {
    // 激活用户
  }
}
```

### 3. 使用验证器

```typescript
// user.validator.ts
import { BusinessValidator } from '@hl8/hybrid-archi';

export class UserValidator extends BusinessValidator {
  async validateUserData(userData: any): Promise<ValidationResult> {
    return await this.validateBusinessData(userData, [
      'required',
      'isString',
      'minLength',
      'maxLength',
      'email'
    ]);
  }

  async validateUserCreation(userData: any): Promise<ValidationResult> {
    return await this.validateBusinessOperation('createUser', userData);
  }

  async validateUserUpdate(userData: any): Promise<ValidationResult> {
    return await this.validateBusinessOperation('updateUser', userData);
  }
}
```

### 4. 使用转换器

```typescript
// user.transformer.ts
import { EntityTransformer } from '@hl8/hybrid-archi';

export class UserTransformer extends EntityTransformer {
  async transformUserDtoToEntity(dto: CreateUserDto): Promise<TransformResult<User>> {
    return await this.transformDtoToEntity(dto, User, {
      enableFieldMapping: true,
      fieldMappings: {
        'userName': 'name',
        'userEmail': 'email'
      },
      excludeFields: ['internalId'],
      sensitiveFields: ['password']
    });
  }

  async transformUserEntityToDto(user: User): Promise<TransformResult<UserDto>> {
    return await this.transformEntityToDto(user, UserDto, {
      enableFieldMapping: true,
      excludeFields: ['internalId', 'systemData']
    });
  }
}
```

## 性能优化使用

### 1. 缓存策略

```typescript
// user-cache.service.ts
import { CacheStrategy } from '@hl8/hybrid-archi';

export class UserCacheService extends CacheStrategy {
  async getUser(userId: string): Promise<User | null> {
    return await this.get<User>(`user:${userId}`, 'cache-aside');
  }

  async setUser(userId: string, user: User): Promise<void> {
    await this.set(`user:${userId}`, user, 3600, 'write-through');
  }

  async preloadUsers(userIds: string[]): Promise<void> {
    await this.preload(userIds, async (id) => {
      return await this.userRepository.findById(EntityId.fromString(id));
    });
  }

  async invalidateUser(userId: string): Promise<void> {
    await this.delete(`user:${userId}`);
  }
}
```

### 2. 连接池管理

```typescript
// database-connection-pool.ts
import { ConnectionPoolManager } from '@hl8/hybrid-archi';

export class DatabaseConnectionPool extends ConnectionPoolManager {
  async executeUserQuery(query: string, params: any[]): Promise<any> {
    const connection = await this.getConnection();
    try {
      const result = await connection.execute(query, params);
      return result;
    } finally {
      await this.releaseConnection(connection.id);
    }
  }

  async checkDatabaseHealth(): Promise<boolean> {
    const health = await this.checkHealth();
    return health.healthy;
  }
}
```

### 3. 异步处理

```typescript
// user-async.service.ts
import { AsyncProcessor } from '@hl8/hybrid-archi';

export class UserAsyncService extends AsyncProcessor {
  async processUserCreation(userData: any): Promise<string> {
    return await this.submitTask('createUser', userData, {
      priority: 'high',
      timeout: 30000,
      maxRetries: 3
    });
  }

  async processUserDeletion(userId: string): Promise<string> {
    return await this.submitTask('deleteUser', { userId }, {
      priority: 'critical',
      timeout: 60000,
      maxRetries: 5
    });
  }

  async processUserBatchUpdate(users: User[]): Promise<string> {
    return await this.submitTask('batchUpdateUsers', { users }, {
      priority: 'normal',
      timeout: 120000,
      maxRetries: 2
    });
  }
}
```

## 事件驱动架构使用

### 1. 事件监控

```typescript
// user-event-monitor.ts
import { EventMonitor } from '@hl8/hybrid-archi';

export class UserEventMonitor extends EventMonitor {
  async monitorUserEvents(event: DomainEvent): Promise<void> {
    const processingId = this.recordEventStart(event);
    try {
      // 处理事件
      await this.processUserEvent(event);
      this.recordEventComplete(processingId, true);
    } catch (error) {
      this.recordEventComplete(processingId, false, error);
      this.recordEventError(event, error);
    }
  }

  private async processUserEvent(event: DomainEvent): Promise<void> {
    // 具体的事件处理逻辑
    console.log(`处理用户事件: ${event.eventType}`);
  }
}
```

### 2. 死信队列

```typescript
// user-dead-letter-queue.ts
import { DeadLetterQueueProcessor } from '@hl8/hybrid-archi';

export class UserDeadLetterQueue extends DeadLetterQueueProcessor {
  async handleFailedUserEvent(event: DomainEvent, error: Error): Promise<string> {
    return await this.addToDeadLetterQueue(event, error, {
      maxRetries: 5,
      initialDelay: 1000,
      backoffMultiplier: 2,
      maxDelay: 30000
    });
  }

  async retryFailedUserEvent(entryId: string): Promise<boolean> {
    return await this.retryEntry(entryId, async (event) => {
      await this.processUserEvent(event);
    });
  }

  private async processUserEvent(event: DomainEvent): Promise<void> {
    // 具体的事件处理逻辑
    console.log(`处理用户事件: ${event.eventType}`);
  }
}
```

## 最佳实践

### 1. 领域建模

- 使用充血模型，业务逻辑在实体内
- 聚合根管理一致性边界
- 值对象确保数据完整性
- 领域事件表示重要业务变化

### 2. 应用层设计

- 用例类只协调，不包含业务逻辑
- 使用CQRS分离读写操作
- 通过事件总线实现松耦合

### 3. 基础设施层

- 实现端口适配器模式
- 使用工厂模式创建适配器
- 提供统一的配置管理

### 4. 接口层

- 使用装饰器处理横切关注点
- 实现统一的错误处理
- 提供完整的审计功能

### 5. 性能优化

- 使用多级缓存策略
- 实现连接池管理
- 异步处理长时间任务
- 监控和统计性能指标

## 故障排除

### 常见问题

1. **缓存命中率低**
   - 检查缓存配置
   - 优化缓存键设计
   - 调整TTL设置

2. **连接池耗尽**
   - 增加最大连接数
   - 优化连接使用
   - 检查连接泄漏

3. **异步任务失败**
   - 检查任务处理器
   - 调整重试策略
   - 监控死信队列

4. **事件处理延迟**
   - 优化事件处理器
   - 调整并发设置
   - 检查事件监控

### 监控指标

- 缓存命中率
- 连接池利用率
- 异步任务成功率
- 事件处理延迟
- 系统响应时间

## 更新日志

### v1.0.0

- 初始版本发布
- 实现混合架构模式
- 提供完整的通用功能组件
- 支持性能优化和监控
