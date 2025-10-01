# 基础设施层最佳实践

## 概述

本文档介绍了使用基础设施层的最佳实践，包括架构设计、性能优化、错误处理、安全考虑等方面。

## 架构设计

### 1. 分层架构

#### 正确示例

```typescript
// 应用层
@Injectable()
export class UserService {
  constructor(
    private readonly logger: LoggerPortAdapter,
    private readonly cache: CacheAdapter,
    private readonly database: DatabaseAdapter,
    private readonly eventStore: EventStoreAdapter,
    private readonly messageQueue: MessageQueueAdapter,
  ) {}

  async createUser(userData: CreateUserDto): Promise<User> {
    // 记录日志
    this.logger.info('Creating user', { userData });

    // 创建用户
    const user = await this.database.insert('users', userData);

    // 缓存用户信息
    await this.cache.set(`user:${user.id}`, user, 300);

    // 保存事件
    await this.eventStore.saveEvent({
      aggregateId: user.id,
      eventType: 'UserCreated',
      eventData: user,
    });

    // 发布消息
    await this.messageQueue.publish('user.created', user);

    return user;
  }
}
```

#### 错误示例

```typescript
// ❌ 不要在应用层直接使用基础设施服务
@Injectable()
export class UserService {
  constructor(
    private readonly cacheService: CacheService, // ❌ 直接使用基础设施服务
    private readonly databaseService: DatabaseService, // ❌ 直接使用基础设施服务
  ) {}
}
```

### 2. 依赖注入

#### 正确示例

```typescript
// 使用接口注入
@Injectable()
export class UserService {
  constructor(
    @Inject('ILoggerPort') private readonly logger: ILoggerPort,
    @Inject('ICache') private readonly cache: ICache,
    @Inject('IDatabase') private readonly database: IDatabase,
  ) {}
}
```

#### 错误示例

```typescript
// ❌ 不要直接注入具体实现
@Injectable()
export class UserService {
  constructor(
    private readonly logger: LoggerPortAdapter, // ❌ 直接注入具体实现
    private readonly cache: CacheAdapter, // ❌ 直接注入具体实现
  ) {}
}
```

### 3. 配置管理

#### 正确示例

```typescript
// 使用配置对象
const cacheConfig: Partial<ICacheConfig> = {
  enableMemoryCache: true,
  enableRedisCache: true,
  defaultTtl: 300,
  maxMemoryCacheSize: 1000,
  enableCompression: true,
  enableStatistics: true,
};

const cache = new CacheAdapter(cacheService, logger, cacheConfig);
```

#### 错误示例

```typescript
// ❌ 不要硬编码配置
const cache = new CacheAdapter(cacheService, logger, {
  enableMemoryCache: true, // ❌ 硬编码配置
  defaultTtl: 300, // ❌ 硬编码配置
});
```

## 性能优化

### 1. 缓存策略

#### 多级缓存

```typescript
// 使用多级缓存策略
async getUser(userId: string): Promise<User | null> {
  // 1. 尝试从内存缓存获取
  let user = await this.cache.get<User>(`user:${userId}`, CacheLevel.MEMORY);
  if (user) {
    return user;
  }

  // 2. 尝试从Redis缓存获取
  user = await this.cache.get<User>(`user:${userId}`, CacheLevel.REDIS);
  if (user) {
    // 回填内存缓存
    await this.cache.set(`user:${userId}`, user, 300, CacheLevel.MEMORY);
    return user;
  }

  // 3. 从数据库获取
  user = await this.database.findOne<User>('users', { id: userId });
  if (user) {
    // 缓存到所有级别
    await this.cache.set(`user:${userId}`, user, 300);
  }

  return user;
}
```

#### 缓存预热

```typescript
// 应用启动时预热缓存
async warmupCache(): Promise<void> {
  const users = await this.database.find<User>('users', { active: true });
  const cacheData: Record<string, User> = {};
  
  for (const user of users) {
    cacheData[`user:${user.id}`] = user;
  }
  
  await this.cache.warmup(cacheData, 300);
}
```

#### 缓存失效

```typescript
// 更新用户时清除相关缓存
async updateUser(userId: string, userData: Partial<User>): Promise<User> {
  const user = await this.database.update('users', userData, { id: userId });
  
  // 清除用户缓存
  await this.cache.delete(`user:${userId}`);
  
  // 清除相关缓存
  await this.cache.delete(`users:list`);
  await this.cache.delete(`users:active`);
  
  return user;
}
```

### 2. 数据库优化

#### 查询优化

```typescript
// 使用查询缓存
async getUsers(limit: number = 10, offset: number = 0): Promise<User[]> {
  const users = await this.database.query<User>(
    'SELECT * FROM users LIMIT ? OFFSET ?',
    [limit, offset],
    {
      useCache: true,
      cacheTtl: 60, // 1分钟缓存
      logQuery: true,
      tags: ['user', 'list'],
    }
  );

  return users;
}
```

#### 事务优化

```typescript
// 使用适当的事务隔离级别
async createUserWithProfile(userData: CreateUserDto): Promise<User> {
  return await this.database.transaction(async (transaction) => {
    // 创建用户
    const user = await this.database.insert('users', userData);
    
    // 创建用户配置
    await this.database.insert('user_configs', {
      userId: user.id,
      settings: {},
    });

    return user;
  }, {
    isolationLevel: 'READ_COMMITTED',
    timeout: 30000, // 30秒超时
  });
}
```

#### 批量操作

```typescript
// 使用批量操作提高性能
async createUsers(usersData: CreateUserDto[]): Promise<User[]> {
  const users = await this.database.insert('users', usersData);
  
  // 批量缓存
  const cacheData: Record<string, User> = {};
  for (const user of users) {
    cacheData[`user:${user.id}`] = user;
  }
  await this.cache.mset(cacheData, 300);
  
  return users;
}
```

### 3. 消息队列优化

#### 异步处理

```typescript
// 使用消息队列进行异步处理
async createUser(userData: CreateUserDto): Promise<User> {
  const user = await this.database.insert('users', userData);
  
  // 异步发送欢迎邮件
  await this.messageQueue.publish('user.created', {
    userId: user.id,
    email: user.email,
    timestamp: new Date(),
  });
  
  return user;
}

// 处理用户创建消息
async handleUserCreated(message: any): Promise<void> {
  const { userId, email } = message;
  
  // 发送欢迎邮件
  await this.emailService.sendWelcomeEmail(email);
  
  // 创建用户配置
  await this.database.insert('user_configs', {
    userId,
    settings: { welcomeEmailSent: true },
  });
}
```

#### 消息重试

```typescript
// 配置消息重试
const messageQueueConfig: Partial<IMessageQueueConfig> = {
  enableMessageRetry: true,
  maxRetries: 3,
  retryDelay: 1000,
  enableDeadLetterQueue: true,
};
```

## 错误处理

### 1. 分层错误处理

#### 应用层错误处理

```typescript
@Injectable()
export class UserService {
  constructor(
    private readonly logger: LoggerPortAdapter,
    private readonly cache: CacheAdapter,
    private readonly database: DatabaseAdapter,
  ) {}

  async getUser(userId: string): Promise<User | null> {
    try {
      // 尝试从缓存获取
      const cachedUser = await this.cache.get<User>(`user:${userId}`);
      if (cachedUser) {
        return cachedUser;
      }

      // 从数据库获取
      const user = await this.database.findOne<User>('users', { id: userId });
      if (user) {
        await this.cache.set(`user:${userId}`, user, 300);
      }

      return user;
    } catch (error) {
      this.logger.error('Failed to get user', error, { userId });
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }
}
```

#### 基础设施层错误处理

```typescript
// 缓存适配器错误处理
async get<T = any>(key: string, level?: CacheLevel): Promise<T | null> {
  try {
    let value: T | null = null;

    if (level === CacheLevel.MEMORY || !level) {
      value = await this.getFromMemoryCache<T>(key);
    }

    if (!value && (level === CacheLevel.REDIS || !level)) {
      value = await this.getFromRedisCache<T>(key);
    }

    return value;
  } catch (error) {
    this.logger.error(`Cache get failed for key: ${key}`, error, { key, level });
    return null; // 缓存失败时返回null，不抛出错误
  }
}
```

### 2. 错误分类

#### 业务错误

```typescript
// 业务错误不重试
class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

async getUser(userId: string): Promise<User> {
  const user = await this.database.findOne<User>('users', { id: userId });
  if (!user) {
    throw new UserNotFoundError(userId);
  }
  return user;
}
```

#### 技术错误

```typescript
// 技术错误可以重试
class DatabaseConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseConnectionError';
  }
}

async getUser(userId: string): Promise<User> {
  try {
    return await this.database.findOne<User>('users', { id: userId });
  } catch (error) {
    if (error instanceof DatabaseConnectionError) {
      // 可以重试
      throw error;
    }
    throw error;
  }
}
```

### 3. 错误监控

```typescript
// 使用日志记录错误
async getUser(userId: string): Promise<User | null> {
  try {
    const user = await this.database.findOne<User>('users', { id: userId });
    this.logger.info('User retrieved successfully', { userId });
    return user;
  } catch (error) {
    this.logger.error('Failed to get user', error, { 
      userId, 
      operation: 'getUser',
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}
```

## 安全考虑

### 1. 数据加密

#### 敏感数据加密

```typescript
// 配置缓存加密
const cacheConfig: Partial<ICacheConfig> = {
  enableEncryption: true,
  encryptionKey: process.env.CACHE_ENCRYPTION_KEY,
};

const cache = new CacheAdapter(cacheService, logger, cacheConfig);
```

#### 数据库加密

```typescript
// 配置数据库加密
const databaseConfig: Partial<IDatabaseConfig> = {
  enableEncryption: true,
  encryptionKey: process.env.DATABASE_ENCRYPTION_KEY,
};
```

### 2. 访问控制

#### 权限检查

```typescript
// 在服务层进行权限检查
async getUser(userId: string, requesterId: string): Promise<User | null> {
  // 检查权限
  if (userId !== requesterId) {
    const hasPermission = await this.checkPermission(requesterId, 'read:user');
    if (!hasPermission) {
      throw new Error('Insufficient permissions');
    }
  }

  return await this.database.findOne<User>('users', { id: userId });
}
```

#### 数据隔离

```typescript
// 使用租户隔离
async getUser(userId: string): Promise<User | null> {
  const tenantId = this.tenantContextService.getCurrentTenantId();
  return await this.database.findOne<User>('users', { 
    id: userId, 
    tenantId 
  });
}
```

### 3. 输入验证

#### 数据验证

```typescript
// 使用验证端口适配器
async createUser(userData: CreateUserDto): Promise<User> {
  // 验证输入数据
  const validationResult = await this.validationPort.validate(UserSchema, userData);
  if (!validationResult.isValid) {
    throw new ValidationError('Invalid user data', validationResult.errors);
  }

  return await this.database.insert('users', userData);
}
```

#### SQL注入防护

```typescript
// 使用参数化查询
async getUser(userId: string): Promise<User | null> {
  // ✅ 使用参数化查询
  return await this.database.query<User>(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );
}

// ❌ 不要使用字符串拼接
async getUser(userId: string): Promise<User | null> {
  return await this.database.query<User>(
    `SELECT * FROM users WHERE id = '${userId}'` // ❌ SQL注入风险
  );
}
```

## 监控和日志

### 1. 性能监控

#### 缓存监控

```typescript
// 监控缓存性能
async getUser(userId: string): Promise<User | null> {
  const startTime = Date.now();
  
  try {
    const user = await this.cache.get<User>(`user:${userId}`);
    const duration = Date.now() - startTime;
    
    if (user) {
      this.logger.info('Cache hit', { userId, duration });
    } else {
      this.logger.info('Cache miss', { userId, duration });
    }
    
    return user;
  } catch (error) {
    const duration = Date.now() - startTime;
    this.logger.error('Cache error', error, { userId, duration });
    throw error;
  }
}
```

#### 数据库监控

```typescript
// 监控数据库性能
async getUser(userId: string): Promise<User | null> {
  const startTime = Date.now();
  
  try {
    const user = await this.database.findOne<User>('users', { id: userId });
    const duration = Date.now() - startTime;
    
    this.logger.info('Database query completed', { 
      userId, 
      duration,
      query: 'findOne',
      table: 'users',
    });
    
    return user;
  } catch (error) {
    const duration = Date.now() - startTime;
    this.logger.error('Database query failed', error, { 
      userId, 
      duration,
      query: 'findOne',
      table: 'users',
    });
    throw error;
  }
}
```

### 2. 业务监控

#### 业务指标

```typescript
// 记录业务指标
async createUser(userData: CreateUserDto): Promise<User> {
  const startTime = Date.now();
  
  try {
    const user = await this.database.insert('users', userData);
    const duration = Date.now() - startTime;
    
    this.logger.info('User created successfully', {
      userId: user.id,
      email: user.email,
      duration,
      operation: 'createUser',
    });
    
    return user;
  } catch (error) {
    const duration = Date.now() - startTime;
    this.logger.error('User creation failed', error, {
      userData,
      duration,
      operation: 'createUser',
    });
    throw error;
  }
}
```

#### 错误率监控

```typescript
// 监控错误率
async getUser(userId: string): Promise<User | null> {
  try {
    return await this.database.findOne<User>('users', { id: userId });
  } catch (error) {
    // 记录错误指标
    this.metricsService.incrementCounter('user.get.error', {
      errorType: error.constructor.name,
      userId,
    });
    
    throw error;
  }
}
```

## 测试策略

### 1. 单元测试

#### 测试适配器

```typescript
describe('CacheAdapter', () => {
  let adapter: CacheAdapter;
  let mockCacheService: jest.Mocked<CacheService>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheAdapter,
        {
          provide: CacheService,
          useValue: createMockCacheService(),
        },
        {
          provide: Logger,
          useValue: createMockLogger(),
        },
      ],
    }).compile();

    adapter = module.get<CacheAdapter>(CacheAdapter);
    mockCacheService = module.get<CacheService>(CacheService) as jest.Mocked<CacheService>;
    mockLogger = module.get<Logger>(Logger) as jest.Mocked<Logger>;
  });

  it('should get value from cache', async () => {
    const key = 'test-key';
    const value = { data: 'test' };

    mockCacheService.get.mockResolvedValue(value);

    const result = await adapter.get(key);

    expect(mockCacheService.get).toHaveBeenCalledWith(`hybrid-archi:${key}`);
    expect(result).toEqual(value);
  });
});
```

### 2. 集成测试

#### 测试服务协作

```typescript
describe('UserService Integration', () => {
  let userService: UserService;
  let cache: CacheAdapter;
  let database: DatabaseAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CacheAdaptersModule.forRoot({
          enableCache: true,
          enableMemoryCache: true,
        }),
        DatabaseAdaptersModule.forRoot({
          enableDatabase: true,
          enablePostgreSQL: true,
        }),
      ],
      providers: [UserService],
    }).compile();

    userService = module.get<UserService>(UserService);
    cache = module.get<CacheAdapter>('ICache');
    database = module.get<DatabaseAdapter>('IDatabase');
  });

  it('should create user and cache it', async () => {
    const userData = { name: 'John', email: 'john@example.com' };
    
    const user = await userService.createUser(userData);
    
    expect(user).toBeDefined();
    expect(user.name).toBe(userData.name);
    
    const cachedUser = await cache.get(`user:${user.id}`);
    expect(cachedUser).toEqual(user);
  });
});
```

### 3. 端到端测试

#### 测试完整流程

```typescript
describe('User Management E2E', () => {
  let app: INestApplication;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        InfrastructureFactoriesModule.forRoot(),
        PortAdaptersModule.forRoot(),
        CacheAdaptersModule.forRoot(),
        DatabaseAdaptersModule.forRoot(),
        EventStoreAdaptersModule.forRoot(),
        MessageQueueAdaptersModule.forRoot(),
      ],
      providers: [UserService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    userService = module.get<UserService>(UserService);
  });

  it('should handle complete user lifecycle', async () => {
    // 创建用户
    const user = await userService.createUser({
      name: 'John',
      email: 'john@example.com',
    });

    expect(user).toBeDefined();

    // 获取用户
    const retrievedUser = await userService.getUser(user.id);
    expect(retrievedUser).toEqual(user);

    // 更新用户
    const updatedUser = await userService.updateUser(user.id, {
      name: 'John Updated',
    });
    expect(updatedUser.name).toBe('John Updated');

    // 删除用户
    await userService.deleteUser(user.id);
    const deletedUser = await userService.getUser(user.id);
    expect(deletedUser).toBeNull();
  });
});
```

## 部署和运维

### 1. 环境配置

#### 开发环境

```typescript
// 开发环境配置
const devConfig = {
  cache: {
    enableMemoryCache: true,
    enableRedisCache: false,
    defaultTtl: 60,
  },
  database: {
    enablePostgreSQL: true,
    enableMongoDB: false,
    enableQueryLogging: true,
  },
  logging: {
    level: 'debug',
    enableConsole: true,
  },
};
```

#### 生产环境

```typescript
// 生产环境配置
const prodConfig = {
  cache: {
    enableMemoryCache: true,
    enableRedisCache: true,
    defaultTtl: 300,
    enableCompression: true,
    enableEncryption: true,
  },
  database: {
    enablePostgreSQL: true,
    enableMongoDB: true,
    enableQueryLogging: false,
    enableSlowQueryMonitoring: true,
  },
  logging: {
    level: 'info',
    enableConsole: false,
  },
};
```

### 2. 健康检查

#### 服务健康检查

```typescript
// 实现健康检查
@Controller('health')
export class HealthController {
  constructor(
    private readonly infrastructureManager: InfrastructureManager,
  ) {}

  @Get()
  async getHealth(): Promise<any> {
    const status = this.infrastructureManager.getManagerStatus();
    const healthResults = await this.infrastructureManager.healthCheckAllServices();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: healthResults,
      statistics: status.statistics,
    };
  }
}
```

### 3. 监控和告警

#### 性能监控

```typescript
// 实现性能监控
@Injectable()
export class PerformanceMonitor {
  constructor(private readonly logger: LoggerPortAdapter) {}

  async monitorOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      this.logger.info('Operation completed', {
        operation: operationName,
        duration,
        status: 'success',
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error('Operation failed', error, {
        operation: operationName,
        duration,
        status: 'error',
      });
      
      throw error;
    }
  }
}
```

## 总结

本文档介绍了使用基础设施层的最佳实践，包括架构设计、性能优化、错误处理、安全考虑、监控和日志、测试策略、部署和运维等方面。通过遵循这些最佳实践，可以构建高性能、高可扩展性、高可靠性的业务系统。

更多详细信息请参考：

- [使用指南](../guides/getting-started.md)
- [API文档](../api/README.md)
- [示例代码](../examples/README.md)
