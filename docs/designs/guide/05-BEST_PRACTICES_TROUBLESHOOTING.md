# Hybrid Architecture 最佳实践和故障排除

> **版本**: 1.0.0 | **创建日期**: 2025-01-27 | **模块**: packages/hybrid-archi

---

## 📋 目录

- [1. 最佳实践](#1-最佳实践)
- [2. 常见问题](#2-常见问题)
- [3. 故障排除](#3-故障排除)
- [4. 性能优化](#4-性能优化)
- [5. 安全最佳实践](#5-安全最佳实践)
- [6. 监控和日志](#6-监控和日志)

---

## 1. 最佳实践

### 1.1 架构设计最佳实践

#### 1.1.1 分层架构实践

**✅ 正确做法**

```typescript
// 领域层 - 纯业务逻辑，无外部依赖
export class User extends BaseEntity {
  public activate(): void {
    if (this.status !== UserStatus.Pending) {
      throw new UserNotPendingException();
    }
    this.status = UserStatus.Active;
    this.addDomainEvent(new UserActivatedEvent(this.id));
  }
}

// 应用层 - 协调领域对象
export class CreateUserUseCase extends BaseUseCase {
  async executeUseCase(request: CreateUserRequest): Promise<CreateUserResponse> {
    const user = User.create(/* ... */);
    await this.userRepository.save(user);
    await this.eventBus.publishAll(user.getUncommittedEvents());
    return this.mapper.toDto(user);
  }
}
```

**❌ 错误做法**

```typescript
// ❌ 领域层包含外部依赖
export class User extends BaseEntity {
  constructor(
    private readonly emailService: IEmailService // ❌ 外部依赖
  ) {}
}

// ❌ 应用层包含业务逻辑
export class CreateUserUseCase {
  async executeUseCase(request: CreateUserRequest): Promise<CreateUserResponse> {
    // ❌ 业务逻辑应该在领域层
    if (!this.isValidEmail(request.email)) {
      throw new Error('Invalid email');
    }
  }
}
```

#### 1.1.2 依赖注入实践

**✅ 正确做法**

```typescript
// 通过接口注入依赖
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository, // ✅ 接口注入
    private readonly eventBus: IEventBus
  ) {}
}

// 使用装饰器注册服务
@Injectable()
export class UserRepository implements IUserRepository {
  // 实现
}
```

**❌ 错误做法**

```typescript
// ❌ 直接实例化依赖
export class CreateUserUseCase {
  constructor() {
    this.userRepository = new UserRepository(); // ❌ 硬编码依赖
  }
}
```

### 1.2 领域建模最佳实践

#### 1.2.1 充血模型实践

**✅ 正确做法**

```typescript
// 业务逻辑在实体内
export class User extends BaseEntity {
  public updateProfile(profile: UserProfile): void {
    this.validateProfile(profile);
    this._profile = profile;
    this.addDomainEvent(new UserProfileUpdatedEvent(this._id, profile));
  }

  private validateProfile(profile: UserProfile): void {
    if (!profile.getFirstName() || !profile.getLastName()) {
      throw new InvalidProfileException('First name and last name are required');
    }
  }
}
```

**❌ 错误做法**

```typescript
// ❌ 贫血模型 - 只有getter/setter
export class User {
  private _profile: UserProfile;
  
  setProfile(profile: UserProfile): void {
    this._profile = profile; // ❌ 没有业务逻辑
  }
  
  getProfile(): UserProfile {
    return this._profile;
  }
}
```

#### 1.2.2 聚合设计实践

**✅ 正确做法**

```typescript
// 聚合根管理一致性边界
export class UserAggregate extends BaseAggregateRoot {
  public createUser(email: Email, username: Username): void {
    this.validateUserCreation(email, username);
    this._email = email;
    this._username = username;
    this.addDomainEvent(new UserCreatedEvent(this._id, email, username));
  }

  private validateUserCreation(email: Email, username: Username): void {
    // 聚合内的业务规则验证
  }
}
```

### 1.3 CQRS最佳实践

#### 1.3.1 命令设计实践

**✅ 正确做法**

```typescript
// 命令包含所有必要信息
export class CreateUserCommand extends BaseCommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly password: string,
    public readonly profile: UserProfileDto,
    tenantId?: string
  ) {
    super(tenantId);
  }
}

// 命令处理器只协调，不包含业务逻辑
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  async handle(command: CreateUserCommand): Promise<string> {
    const request = {
      name: command.name,
      email: command.email,
      password: command.password,
      profile: command.profile
    };
    
    return await this.createUserUseCase.execute(request);
  }
}
```

#### 1.3.2 查询设计实践

**✅ 正确做法**

```typescript
// 查询优化读取性能
@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery, UserDto> {
  async handle(query: GetUserQuery): Promise<UserDto> {
    // 1. 尝试从缓存获取
    const cachedUser = await this.cache.get<UserDto>(`user:${query.userId}`);
    if (cachedUser) {
      return cachedUser;
    }

    // 2. 从数据库获取
    const user = await this.userRepository.findById(query.userId);
    if (!user) {
      throw new UserNotFoundException(query.userId);
    }

    // 3. 缓存结果
    const userDto = UserDto.fromEntity(user);
    await this.cache.set(`user:${query.userId}`, userDto, 3600);
    
    return userDto;
  }
}
```

### 1.4 事件驱动最佳实践

#### 1.4.1 领域事件实践

**✅ 正确做法**

```typescript
// 领域事件表示重要的业务变化
export class UserCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: EntityId,
    public readonly email: Email,
    public readonly username: Username,
    public readonly timestamp: Date = new Date()
  ) {
    super();
  }
}

// 事件处理器处理副作用
@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  async handle(event: UserCreatedEvent): Promise<void> {
    // 发送欢迎邮件
    await this.emailService.sendWelcomeEmail(event.email);
    
    // 创建用户会话
    await this.sessionService.createUserSession(event.userId);
  }
}
```

#### 1.4.2 事件存储实践

**✅ 正确做法**

```typescript
// 事件存储确保数据一致性
export class UserEventStore implements IEventStore {
  async saveEvents(
    aggregateId: string,
    events: BaseDomainEvent[],
    expectedVersion: number
  ): Promise<void> {
    // 使用事务确保原子性
    await this.database.transaction(async (trx) => {
      for (const event of events) {
        await trx.insert('events', {
          aggregateId,
          eventType: event.constructor.name,
          eventData: this.serializer.serialize(event),
          version: expectedVersion + events.indexOf(event) + 1,
          timestamp: new Date()
        });
      }
    });
  }
}
```

---

## 2. 常见问题

### 2.1 架构问题

#### 2.1.1 循环依赖问题

**问题描述**: 模块间出现循环依赖

**解决方案**:

```typescript
// ❌ 错误 - 循环依赖
// UserService 依赖 OrderService
// OrderService 依赖 UserService

// ✅ 正确 - 通过事件解耦
export class UserService {
  async createUser(userData: CreateUserDto): Promise<void> {
    const user = User.create(/* ... */);
    await this.userRepository.save(user);
    
    // 发布事件而不是直接调用
    await this.eventBus.publish(new UserCreatedEvent(user.getId()));
  }
}

export class OrderService {
  @EventsHandler(UserCreatedEvent)
  async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    // 处理用户创建后的订单相关逻辑
  }
}
```

#### 2.1.2 依赖方向问题

**问题描述**: 依赖方向违反Clean Architecture原则

**解决方案**:

```typescript
// ❌ 错误 - 领域层依赖基础设施层
export class User extends BaseEntity {
  constructor(
    private readonly emailService: IEmailService // ❌ 外部依赖
  ) {}
}

// ✅ 正确 - 通过应用层协调
export class User extends BaseEntity {
  // 纯领域逻辑，无外部依赖
  public activate(): void {
    this.status = UserStatus.Active;
    this.addDomainEvent(new UserActivatedEvent(this.id));
  }
}

export class ActivateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus,
    private readonly emailService: IEmailService
  ) {}

  async execute(request: ActivateUserRequest): Promise<void> {
    const user = await this.userRepository.findById(request.userId);
    user.activate();
    await this.userRepository.save(user);
    await this.eventBus.publishAll(user.getUncommittedEvents());
  }
}
```

### 2.2 性能问题

#### 2.2.1 N+1查询问题

**问题描述**: 查询用户时出现N+1查询问题

**解决方案**:

```typescript
// ❌ 错误 - N+1查询
export class GetUsersHandler {
  async handle(query: GetUsersQuery): Promise<UserDto[]> {
    const users = await this.userRepository.findAll();
    
    // N+1查询问题
    for (const user of users) {
      user.profile = await this.profileRepository.findByUserId(user.id);
    }
    
    return users.map(user => UserDto.fromEntity(user));
  }
}

// ✅ 正确 - 使用JOIN查询
export class GetUsersHandler {
  async handle(query: GetUsersQuery): Promise<UserDto[]> {
    // 一次性查询所有数据
    const users = await this.userRepository.findAllWithProfiles();
    return users.map(user => UserDto.fromEntity(user));
  }
}
```

#### 2.2.2 缓存穿透问题

**问题描述**: 缓存未命中导致大量数据库查询

**解决方案**:

```typescript
// ✅ 正确 - 使用布隆过滤器防止缓存穿透
export class UserCacheService {
  private readonly bloomFilter: BloomFilter;

  async getUser(userId: string): Promise<User | null> {
    // 1. 检查布隆过滤器
    if (!this.bloomFilter.mightContain(userId)) {
      return null;
    }

    // 2. 尝试从缓存获取
    const cachedUser = await this.cache.get<User>(`user:${userId}`);
    if (cachedUser) {
      return cachedUser;
    }

    // 3. 从数据库获取
    const user = await this.userRepository.findById(userId);
    if (user) {
      await this.cache.set(`user:${userId}`, user, 3600);
    }

    return user;
  }
}
```

### 2.3 数据一致性问题

#### 2.3.1 分布式事务问题

**问题描述**: 跨服务的数据一致性问题

**解决方案**:

```typescript
// ✅ 使用Saga模式处理分布式事务
export class CreateUserSaga {
  async execute(command: CreateUserCommand): Promise<void> {
    try {
      // 1. 创建用户
      const user = await this.userService.createUser(command);
      
      // 2. 发送欢迎邮件
      await this.emailService.sendWelcomeEmail(user.email);
      
      // 3. 创建用户会话
      await this.sessionService.createUserSession(user.id);
      
    } catch (error) {
      // 补偿操作
      await this.compensate(command);
      throw error;
    }
  }

  private async compensate(command: CreateUserCommand): Promise<void> {
    // 回滚操作
    await this.userService.deleteUser(command.userId);
  }
}
```

---

## 3. 故障排除

### 3.1 启动问题

#### 3.1.1 模块加载失败

**问题描述**: 应用启动时模块加载失败

**排查步骤**:

1. 检查模块依赖关系
2. 验证依赖注入配置
3. 检查循环依赖

**解决方案**:

```typescript
// 检查模块配置
@Module({
  imports: [
    // 确保依赖模块正确导入
    DatabaseModule,
    CacheModule,
    EventBusModule
  ],
  providers: [
    // 确保服务正确注册
    UserRepository,
    UserService,
    CreateUserUseCase
  ],
  exports: [
    // 确保导出的服务正确
    UserService
  ]
})
export class UserManagementModule {}
```

#### 3.1.2 数据库连接失败

**问题描述**: 数据库连接失败

**排查步骤**:

1. 检查数据库配置
2. 验证网络连接
3. 检查数据库服务状态

**解决方案**:

```typescript
// 数据库配置检查
export const databaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'hl8_saas',
  // 连接池配置
  pool: {
    min: 5,
    max: 50,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 300000
  }
};
```

### 3.2 运行时问题

#### 3.2.1 内存泄漏问题

**问题描述**: 应用运行过程中内存持续增长

**排查步骤**:

1. 使用内存分析工具
2. 检查事件监听器
3. 验证资源释放

**解决方案**:

```typescript
// 正确的事件监听器管理
export class UserService {
  private readonly eventListeners = new Map<string, Function>();

  async subscribeToEvents(): Promise<void> {
    const handler = this.handleUserEvent.bind(this);
    await this.eventBus.subscribe('UserCreatedEvent', handler);
    this.eventListeners.set('UserCreatedEvent', handler);
  }

  async unsubscribeFromEvents(): Promise<void> {
    for (const [eventType, handler] of this.eventListeners) {
      await this.eventBus.unsubscribe(eventType, handler);
    }
    this.eventListeners.clear();
  }

  private async handleUserEvent(event: BaseDomainEvent): Promise<void> {
    // 处理事件
  }
}
```

#### 3.2.2 性能瓶颈问题

**问题描述**: 应用响应时间过长

**排查步骤**:

1. 使用性能分析工具
2. 检查数据库查询
3. 验证缓存策略

**解决方案**:

```typescript
// 性能监控
export class PerformanceMonitor {
  private readonly metrics = new Map<string, number>();

  recordRequest(method: string, route: string, duration: number): void {
    const key = `${method}:${route}`;
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + duration);
  }

  getSlowQueries(): Array<{ route: string; avgDuration: number }> {
    return Array.from(this.metrics.entries())
      .map(([route, totalDuration]) => ({
        route,
        avgDuration: totalDuration / this.getRequestCount(route)
      }))
      .filter(query => query.avgDuration > 1000) // 超过1秒的查询
      .sort((a, b) => b.avgDuration - a.avgDuration);
  }
}
```

---

## 4. 性能优化

### 4.1 数据库优化

#### 4.1.1 查询优化

**索引优化**:

```sql
-- 为用户表创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**查询优化**:

```typescript
// 使用分页查询
export class GetUsersQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly filters?: UserFilters
  ) {}
}

export class GetUsersHandler {
  async handle(query: GetUsersQuery): Promise<PaginatedResult<UserDto>> {
    const offset = (query.page - 1) * query.limit;
    
    const [users, total] = await this.userRepository.findAndCount(
      query.filters,
      {
        limit: query.limit,
        offset: offset,
        orderBy: { createdAt: 'DESC' }
      }
    );

    return {
      data: users.map(user => UserDto.fromEntity(user)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit)
      }
    };
  }
}
```

#### 4.1.2 连接池优化

**连接池配置**:

```typescript
export const connectionPoolConfig = {
  min: 5,                    // 最小连接数
  max: 50,                   // 最大连接数
  acquireTimeoutMillis: 30000, // 获取连接超时
  idleTimeoutMillis: 300000,  // 空闲连接超时
  validationInterval: 60000,   // 连接验证间隔
  retryCount: 3,             // 重试次数
  retryInterval: 1000        // 重试间隔
};
```

### 4.2 缓存优化

#### 4.2.1 多级缓存策略

```typescript
export class MultiLevelCacheService {
  constructor(
    private readonly l1Cache: MemoryCache,    // L1缓存 - 内存
    private readonly l2Cache: RedisCache,      // L2缓存 - Redis
    private readonly database: DatabaseAdapter // 数据库
  ) {}

  async get<T>(key: string): Promise<T | null> {
    // 1. 尝试从L1缓存获取
    let value = await this.l1Cache.get<T>(key);
    if (value) {
      return value;
    }

    // 2. 尝试从L2缓存获取
    value = await this.l2Cache.get<T>(key);
    if (value) {
      // 回填L1缓存
      await this.l1Cache.set(key, value, 300); // 5分钟
      return value;
    }

    // 3. 从数据库获取
    value = await this.database.get<T>(key);
    if (value) {
      // 回填缓存
      await this.l2Cache.set(key, value, 3600); // 1小时
      await this.l1Cache.set(key, value, 300); // 5分钟
    }

    return value;
  }
}
```

#### 4.2.2 缓存预热

```typescript
export class CacheWarmupService {
  async warmupUserCache(): Promise<void> {
    // 预热热门用户数据
    const hotUsers = await this.userRepository.findHotUsers(100);
    
    for (const user of hotUsers) {
      const userDto = UserDto.fromEntity(user);
      await this.cache.set(`user:${user.getId()}`, userDto, 3600);
    }
  }

  async warmupUserSessions(): Promise<void> {
    // 预热活跃用户会话
    const activeSessions = await this.sessionRepository.findActiveSessions();
    
    for (const session of activeSessions) {
      await this.cache.set(`session:${session.id}`, session, 1800);
    }
  }
}
```

### 4.3 异步处理优化

#### 4.3.1 任务队列优化

```typescript
export class TaskQueueService {
  private readonly queues = new Map<string, Queue>();

  async submitTask(
    taskType: string,
    data: any,
    options: TaskOptions = {}
  ): Promise<string> {
    const taskId = uuidv4();
    const task = {
      id: taskId,
      type: taskType,
      data,
      priority: options.priority || 'normal',
      timeout: options.timeout || 30000,
      maxRetries: options.maxRetries || 3,
      createdAt: new Date()
    };

    await this.queues.get(taskType)?.add(task);
    return taskId;
  }

  async processTask(task: Task): Promise<void> {
    try {
      const processor = this.getProcessor(task.type);
      await processor.process(task.data);
    } catch (error) {
      if (task.retryCount < task.maxRetries) {
        task.retryCount++;
        await this.queues.get(task.type)?.add(task, { delay: 1000 * task.retryCount });
      } else {
        await this.deadLetterQueue.add(task);
      }
    }
  }
}
```

---

## 5. 安全最佳实践

### 5.1 认证安全

#### 5.1.1 JWT安全配置

```typescript
export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  algorithm: 'HS256',
  issuer: 'hl8-saas',
  audience: 'hl8-saas-users'
};

// JWT验证中间件
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = this.jwtService.verify(token, jwtConfig);
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
```

#### 5.1.2 密码安全

```typescript
export class PasswordService {
  private readonly saltRounds = 12;

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  validatePasswordStrength(password: string): boolean {
    // 密码强度验证
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && 
           hasUpperCase && 
           hasLowerCase && 
           hasNumbers && 
           hasSpecialChar;
  }
}
```

### 5.2 授权安全

#### 5.2.1 权限控制

```typescript
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly permissionService: PermissionService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const requiredPermission = this.getRequiredPermission(context);

    if (!user) {
      return false;
    }

    return await this.permissionService.hasPermission(
      user.id,
      requiredPermission,
      user.tenantId
    );
  }

  private getRequiredPermission(context: ExecutionContext): string {
    const handler = context.getHandler();
    const permission = Reflect.getMetadata('permission', handler);
    return permission;
  }
}

// 权限装饰器
export const RequirePermission = (permission: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('permission', permission, descriptor.value);
  };
};
```

#### 5.2.2 租户隔离

```typescript
export class TenantIsolationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.headers['x-tenant-id'];

    if (!user || !tenantId) {
      return false;
    }

    // 验证用户是否属于该租户
    return user.tenantId === tenantId;
  }
}
```

### 5.3 数据安全

#### 5.3.1 数据加密

```typescript
export class DataEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key = process.env.ENCRYPTION_KEY;

  encrypt(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('hl8-saas', 'utf8'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from('hl8-saas', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

---

## 6. 监控和日志

### 6.1 应用监控

#### 6.1.1 健康检查

```typescript
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly database: DatabaseAdapter,
    private readonly cache: CacheAdapter
  ) {}

  @Get('health')
  async checkHealth(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkCache(),
      this.checkMemory(),
      this.checkDisk()
    ]);

    const results = checks.map((check, index) => ({
      name: ['database', 'cache', 'memory', 'disk'][index],
      status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
      details: check.status === 'fulfilled' ? check.value : check.reason
    }));

    const isHealthy = results.every(result => result.status === 'healthy');

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: results
    };
  }

  private async checkDatabase(): Promise<any> {
    const start = Date.now();
    await this.database.query('SELECT 1');
    const duration = Date.now() - start;
    
    return {
      responseTime: duration,
      status: duration < 1000 ? 'healthy' : 'slow'
    };
  }
}
```

#### 6.1.2 性能监控

```typescript
export class PerformanceMonitor {
  private readonly metrics = new Map<string, MetricData>();

  recordRequest(method: string, route: string, duration: number, status: number): void {
    const key = `${method}:${route}`;
    const metric = this.metrics.get(key) || {
      count: 0,
      totalDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      errorCount: 0
    };

    metric.count++;
    metric.totalDuration += duration;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    
    if (status >= 400) {
      metric.errorCount++;
    }

    this.metrics.set(key, metric);
  }

  getMetrics(): PerformanceMetrics {
    const metrics = Array.from(this.metrics.entries()).map(([route, data]) => ({
      route,
      requests: data.count,
      avgDuration: data.totalDuration / data.count,
      minDuration: data.minDuration,
      maxDuration: data.maxDuration,
      errorRate: data.errorCount / data.count
    }));

    return {
      timestamp: new Date().toISOString(),
      metrics: metrics.sort((a, b) => b.avgDuration - a.avgDuration)
    };
  }
}
```

### 6.2 日志管理

#### 6.2.1 结构化日志

```typescript
export class LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
      ]
    });
  }

  logRequest(method: string, route: string, duration: number, status: number, userId?: string): void {
    this.logger.info('HTTP Request', {
      method,
      route,
      duration,
      status,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  logError(error: Error, context?: any): void {
    this.logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }

  logBusinessEvent(event: string, data: any, userId?: string): void {
    this.logger.info('Business Event', {
      event,
      data,
      userId,
      timestamp: new Date().toISOString()
    });
  }
}
```

#### 6.2.2 审计日志

```typescript
export class AuditService {
  constructor(
    private readonly logger: LoggerService,
    private readonly auditRepository: AuditRepository
  ) {}

  async logUserAction(
    userId: string,
    action: string,
    resource: string,
    details: any
  ): Promise<void> {
    const auditLog = {
      userId,
      action,
      resource,
      details,
      timestamp: new Date(),
      ipAddress: this.getClientIP(),
      userAgent: this.getUserAgent()
    };

    // 记录到数据库
    await this.auditRepository.save(auditLog);

    // 记录到日志
    this.logger.logBusinessEvent('audit', auditLog, userId);
  }

  async getAuditTrail(userId: string, startDate?: Date, endDate?: Date): Promise<AuditLog[]> {
    return await this.auditRepository.findByUserId(userId, startDate, endDate);
  }
}
```

---

## 🎯 总结

Hybrid Architecture 最佳实践和故障排除指南提供了：

1. **最佳实践**: 架构设计、领域建模、CQRS、事件驱动的最佳实践
2. **常见问题**: 架构问题、性能问题、数据一致性问题的解决方案
3. **故障排除**: 启动问题、运行时问题的排查和解决
4. **性能优化**: 数据库优化、缓存优化、异步处理优化
5. **安全最佳实践**: 认证安全、授权安全、数据安全
6. **监控和日志**: 应用监控、性能监控、日志管理

通过遵循这些最佳实践，可以确保基于 Hybrid Architecture 的应用具有高质量、高性能和高安全性。

---

**文档完成**: 至此，Hybrid Architecture 技术设计文档系列已完成，包括：

- [技术设计总览](./01-HYBRID_ARCHITECTURE_OVERVIEW.md)
- [架构模式详细设计](./02-ARCHITECTURE_PATTERNS_DETAIL.md)
- [应用指南](./03-APPLICATION_GUIDE.md)
- [用户管理模块应用示例](./04-USER_MANAGEMENT_EXAMPLE.md)
- [最佳实践和故障排除](./05-BEST_PRACTICES_TROUBLESHOOTING.md)
