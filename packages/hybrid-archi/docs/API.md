# Hybrid Architecture API 文档

packages/hybrid-archi模块是本项目最核心的一个模块，Hybrid Architecture 模块的目标是创建一个基于 Clean Architecture + DDD + CQRS + ES + EDA 的混合架构模式，为业务模块开发提供统一的模式和全面的通用功能组件。
我们已经对这个模块进行了反复的重构和优化，现在已经基本达到开发的目标，所以，我们需要重新创建一组文档，全面阐述Hybrid Architecture的技术设计方案，以及如何应用到业务模块的开发，并以用户管理模块为例，给出一个应用示例

## 概述

Hybrid Architecture 是一个基于 Clean Architecture + DDD + CQRS + ES + EDA 的混合架构模式，为业务模块开发提供统一的模式和全面的通用功能组件。

## 架构层次

### 1. 领域层 (Domain Layer)

#### 基础实体 (BaseEntity)

```typescript
import { BaseEntity } from '@hl8/hybrid-archi';

class User extends BaseEntity {
  constructor(
    id: EntityId,
    private name: string,
    private email: string
  ) {
    super(id);
  }

  getName(): string {
    return this.name;
  }

  updateName(newName: string): void {
    this.name = newName;
    this.updateTimestamp();
  }
}
```

#### 聚合根 (BaseAggregateRoot)

```typescript
import { BaseAggregateRoot } from '@hl8/hybrid-archi';

class UserAggregate extends BaseAggregateRoot {
  constructor(
    id: EntityId,
    private name: string,
    private email: string
  ) {
    super(id);
  }

  createUser(): void {
    this.addDomainEvent(new UserCreatedEvent(this.id, this.name, this.email));
  }

  updateUser(newName: string): void {
    this.name = newName;
    this.addDomainEvent(new UserUpdatedEvent(this.id, this.name));
  }
}
```

#### 值对象 (BaseValueObject)

```typescript
import { BaseValueObject } from '@hl8/hybrid-archi';

class Email extends BaseValueObject {
  constructor(private value: string) {
    super();
    this.validate();
  }

  private validate(): void {
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

  protected arePropertiesEqual(other: Email): boolean {
    return this.value === other.value;
  }
}
```

### 2. 应用层 (Application Layer)

#### 用例 (UseCase)

```typescript
import { BaseUseCase, IUseCase } from '@hl8/hybrid-archi';

interface CreateUserRequest {
  name: string;
  email: string;
}

interface CreateUserResponse {
  userId: string;
  name: string;
  email: string;
}

class CreateUserUseCase extends BaseUseCase<CreateUserRequest, CreateUserResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus
  ) {
    super();
  }

  async executeUseCase(request: CreateUserRequest): Promise<CreateUserResponse> {
    // 创建用户实体
    const user = new User(
      EntityId.generate(),
      request.name,
      request.email
    );

    // 保存用户
    await this.userRepository.save(user);

    // 发布领域事件
    await this.eventBus.publish(new UserCreatedEvent(user.id, user.getName(), user.getEmail()));

    return {
      userId: user.id.toString(),
      name: user.getName(),
      email: user.getEmail(),
    };
  }
}
```

#### CQRS 命令 (Command)

```typescript
import { BaseCommand } from '@hl8/hybrid-archi';

class CreateUserCommand extends BaseCommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    tenantId?: string,
    userId?: string
  ) {
    super(tenantId, userId);
  }
}

class CreateUserCommandHandler {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase
  ) {}

  async handle(command: CreateUserCommand): Promise<void> {
    await this.createUserUseCase.execute({
      name: command.name,
      email: command.email,
    });
  }
}
```

#### CQRS 查询 (Query)

```typescript
import { BaseQuery } from '@hl8/hybrid-archi';

class GetUserQuery extends BaseQuery {
  constructor(
    public readonly userId: string,
    tenantId?: string,
    userId?: string
  ) {
    super(tenantId, userId);
  }
}

class GetUserQueryHandler {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  async handle(query: GetUserQuery): Promise<User> {
    return await this.userRepository.findById(EntityId.fromString(query.userId));
  }
}
```

### 3. 基础设施层 (Infrastructure Layer)

#### 事件存储 (EventStore)

```typescript
import { EventStoreImplementation } from '@hl8/hybrid-archi';

class UserEventStore extends EventStoreImplementation {
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
}
```

#### 快照存储 (SnapshotStore)

```typescript
import { SnapshotStoreImplementation } from '@hl8/hybrid-archi';

class UserSnapshotStore extends SnapshotStoreImplementation {
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
}
```

#### 事件总线 (EventBus)

```typescript
import { CoreEventBus } from '@hl8/hybrid-archi';

class UserEventBus extends CoreEventBus {
  async publishUserCreatedEvent(event: UserCreatedEvent): Promise<void> {
    await this.publish(event);
  }

  async subscribeToUserEvents(handler: (event: DomainEvent) => Promise<void>): Promise<void> {
    await this.subscribe('UserCreatedEvent', handler);
  }
}
```

### 4. 接口层 (Interface Layer)

#### REST 控制器 (BaseController)

```typescript
import { BaseController } from '@hl8/hybrid-archi';

@Controller('users')
export class UserController extends BaseController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase
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
}
```

#### 装饰器 (Decorators)

```typescript
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

class UserService {
  @DetailedAudit()
  async createUser(userData: CreateUserDto): Promise<User> {
    // 方法实现
  }

  @SensitiveOperationAudit(['user-deletion'])
  async deleteUser(userId: string): Promise<void> {
    // 方法实现
  }

  @PerformanceAudit()
  async processLargeDataset(data: any[]): Promise<any[]> {
    // 方法实现
  }

  @SecurityAudit()
  async changePassword(userId: string, newPassword: string): Promise<void> {
    // 方法实现
  }
}
```

#### 验证器 (Validators)

```typescript
import { BusinessValidator } from '@hl8/hybrid-archi';

class UserValidator extends BusinessValidator {
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
}
```

#### 转换器 (Transformers)

```typescript
import { EntityTransformer } from '@hl8/hybrid-archi';

class UserTransformer extends EntityTransformer {
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

## 性能优化组件

### 缓存策略 (CacheStrategy)

```typescript
import { CacheStrategy } from '@hl8/hybrid-archi';

class UserCacheStrategy extends CacheStrategy {
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
}
```

### 连接池管理 (ConnectionPoolManager)

```typescript
import { ConnectionPoolManager } from '@hl8/hybrid-archi';

class DatabaseConnectionPool extends ConnectionPoolManager {
  async executeQuery(query: string, params: any[]): Promise<any> {
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

### 异步处理器 (AsyncProcessor)

```typescript
import { AsyncProcessor } from '@hl8/hybrid-archi';

class UserAsyncProcessor extends AsyncProcessor {
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
}
```

## 事件驱动架构

### 事件监控 (EventMonitor)

```typescript
import { EventMonitor } from '@hl8/hybrid-archi';

class UserEventMonitor extends EventMonitor {
  async monitorUserEvents(event: DomainEvent): Promise<void> {
    const processingId = this.recordEventStart(event);
    try {
      // 处理事件
      await this.processEvent(event);
      this.recordEventComplete(processingId, true);
    } catch (error) {
      this.recordEventComplete(processingId, false, error);
      this.recordEventError(event, error);
    }
  }
}
```

### 死信队列 (DeadLetterQueueProcessor)

```typescript
import { DeadLetterQueueProcessor } from '@hl8/hybrid-archi';

class UserDeadLetterQueue extends DeadLetterQueueProcessor {
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
}
```

## 使用示例

### 完整的用户管理模块

```typescript
import {
  BaseEntity,
  BaseAggregateRoot,
  BaseUseCase,
  BaseController,
  Audit,
  BusinessValidator,
  EntityTransformer,
  CacheStrategy,
  ConnectionPoolManager,
  AsyncProcessor,
  EventMonitor,
  DeadLetterQueueProcessor
} from '@hl8/hybrid-archi';

// 1. 定义领域实体
class User extends BaseEntity {
  constructor(
    id: EntityId,
    private name: string,
    private email: string
  ) {
    super(id);
  }

  getName(): string {
    return this.name;
  }

  getEmail(): string {
    return this.email;
  }

  updateName(newName: string): void {
    this.name = newName;
    this.updateTimestamp();
  }
}

// 2. 定义用例
class CreateUserUseCase extends BaseUseCase<CreateUserRequest, CreateUserResponse> {
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
    // 验证数据
    const validation = await this.validator.validateBusinessData(request, [
      'required', 'isString', 'email'
    ]);

    if (!validation.isValid) {
      throw new Error('Validation failed');
    }

    // 创建用户实体
    const user = new User(
      EntityId.generate(),
      request.name,
      request.email
    );

    // 保存用户
    await this.userRepository.save(user);

    // 缓存用户
    await this.cache.set(`user:${user.id}`, user, 3600);

    // 异步处理后续任务
    await this.asyncProcessor.submitTask('sendWelcomeEmail', {
      userId: user.id.toString(),
      email: user.getEmail()
    });

    return {
      userId: user.id.toString(),
      name: user.getName(),
      email: user.getEmail()
    };
  }
}

// 3. 定义控制器
@Controller('users')
export class UserController extends BaseController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase
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
}
```

## 配置说明

### 缓存配置

```typescript
const cacheConfig: CacheStrategyConfig = {
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
};
```

### 连接池配置

```typescript
const connectionPoolConfig: ConnectionPoolConfig = {
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
};
```

### 异步处理器配置

```typescript
const asyncProcessorConfig: AsyncProcessorConfig = {
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
};
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
