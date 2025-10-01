# 基础设施层API文档

## 概述

本文档详细介绍了基础设施层的所有API接口，包括端口适配器、缓存适配器、数据库适配器、事件存储适配器、消息队列适配器和基础设施工厂。

## 端口适配器API

### LoggerPortAdapter

日志端口适配器，提供统一的日志记录功能。

#### 构造函数

```typescript
constructor(logger: Logger)
```

#### 方法

##### debug(message: string, context?: Record<string, unknown>): void

记录调试级别日志。

**参数：**

- `message: string` - 日志消息
- `context?: Record<string, unknown>` - 上下文信息

**示例：**

```typescript
logger.debug('User login attempt', { userId: '123', ip: '192.168.1.1' });
```

##### info(message: string, context?: Record<string, unknown>): void

记录信息级别日志。

**参数：**

- `message: string` - 日志消息
- `context?: Record<string, unknown>` - 上下文信息

**示例：**

```typescript
logger.info('User created successfully', { userId: '123', email: 'user@example.com' });
```

##### warn(message: string, context?: Record<string, unknown>): void

记录警告级别日志。

**参数：**

- `message: string` - 日志消息
- `context?: Record<string, unknown>` - 上下文信息

**示例：**

```typescript
logger.warn('High memory usage detected', { usage: '85%', threshold: '80%' });
```

##### error(message: string, error?: Error, context?: Record<string, unknown>): void

记录错误级别日志。

**参数：**

- `message: string` - 日志消息
- `error?: Error` - 错误对象
- `context?: Record<string, unknown>` - 上下文信息

**示例：**

```typescript
logger.error('Database connection failed', error, { host: 'localhost', port: 5432 });
```

##### child(context: string, metadata?: Record<string, unknown>): ILoggerPort

创建子日志记录器。

**参数：**

- `context: string` - 上下文名称
- `metadata?: Record<string, unknown>` - 元数据

**返回值：**

- `ILoggerPort` - 子日志记录器实例

**示例：**

```typescript
const childLogger = logger.child('UserService', { userId: '123' });
childLogger.info('Processing user request');
```

### IdGeneratorPortAdapter

ID生成器端口适配器，提供唯一ID生成功能。

#### 方法

##### generate(): string

生成UUID格式的唯一ID。

**返回值：**

- `string` - UUID格式的唯一ID

**示例：**

```typescript
const id = idGenerator.generate(); // "550e8400-e29b-41d4-a716-446655440000"
```

##### generateNumericId(): number

生成数字格式的唯一ID。

**返回值：**

- `number` - 数字格式的唯一ID

**示例：**

```typescript
const numericId = idGenerator.generateNumericId(); // 1640995200000
```

##### generateShortId(): string

生成短格式的唯一ID。

**返回值：**

- `string` - 短格式的唯一ID

**示例：**

```typescript
const shortId = idGenerator.generateShortId(); // "abc123"
```

### TimeProviderPortAdapter

时间提供器端口适配器，提供时间相关功能。

#### 方法

##### now(): Date

获取当前时间。

**返回值：**

- `Date` - 当前时间对象

**示例：**

```typescript
const now = timeProvider.now(); // 2023-01-01T00:00:00.000Z
```

##### timestamp(): number

获取当前时间戳。

**返回值：**

- `number` - 当前时间戳（毫秒）

**示例：**

```typescript
const timestamp = timeProvider.timestamp(); // 1640995200000
```

##### isoString(): string

获取当前时间的ISO字符串。

**返回值：**

- `string` - ISO格式的时间字符串

**示例：**

```typescript
const isoString = timeProvider.isoString(); // "2023-01-01T00:00:00.000Z"
```

### ValidationPortAdapter

验证端口适配器，提供数据验证功能。

#### 方法

##### validate<T extends object>(schema: IValidationSchema<T>, data: T): Promise<IValidationResult>

验证数据。

**参数：**

- `schema: IValidationSchema<T>` - 验证模式
- `data: T` - 要验证的数据

**返回值：**

- `Promise<IValidationResult>` - 验证结果

**示例：**

```typescript
const result = await validationPort.validate(UserSchema, userData);
if (!result.isValid) {
  console.log('Validation errors:', result.errors);
}
```

### ConfigurationPortAdapter

配置端口适配器，提供配置管理功能。

#### 方法

##### get<T>(key: string, defaultValue?: T): T

获取配置值。

**参数：**

- `key: string` - 配置键
- `defaultValue?: T` - 默认值

**返回值：**

- `T` - 配置值

**示例：**

```typescript
const port = configPort.get('PORT', 3000);
const dbUrl = configPort.get('DATABASE_URL');
```

##### getSync<T>(key: string, defaultValue?: T): T

同步获取配置值。

**参数：**

- `key: string` - 配置键
- `defaultValue?: T` - 默认值

**返回值：**

- `T` - 配置值

**示例：**

```typescript
const port = configPort.getSync('PORT', 3000);
```

### EventBusPortAdapter

事件总线端口适配器，提供事件发布功能。

#### 方法

##### publish<TEvent extends object>(event: TEvent): Promise<void>

发布事件。

**参数：**

- `event: TEvent` - 事件对象

**返回值：**

- `Promise<void>` - 发布结果

**示例：**

```typescript
await eventBus.publish({
  type: 'UserCreated',
  data: { userId: '123', email: 'user@example.com' },
  timestamp: new Date(),
});
```

##### publishAll<TEvent extends object>(events: TEvent[]): Promise<void>

批量发布事件。

**参数：**

- `events: TEvent[]` - 事件对象数组

**返回值：**

- `Promise<void>` - 发布结果

**示例：**

```typescript
await eventBus.publishAll([
  { type: 'UserCreated', data: user1 },
  { type: 'UserCreated', data: user2 },
]);
```

## 缓存适配器API

### CacheAdapter

缓存适配器，提供多级缓存策略。

#### 构造函数

```typescript
constructor(
  cacheService: CacheService,
  logger: Logger,
  config?: Partial<ICacheConfig>
)
```

#### 方法

##### get<T = any>(key: string, level?: CacheLevel): Promise<T | null>

获取缓存值。

**参数：**

- `key: string` - 缓存键
- `level?: CacheLevel` - 缓存级别

**返回值：**

- `Promise<T | null>` - 缓存值

**示例：**

```typescript
const user = await cache.get<User>('user:123');
const userFromMemory = await cache.get<User>('user:123', CacheLevel.MEMORY);
```

##### set<T = any>(key: string, value: T, ttl?: number, level?: CacheLevel): Promise<void>

设置缓存值。

**参数：**

- `key: string` - 缓存键
- `value: T` - 缓存值
- `ttl?: number` - 生存时间（秒）
- `level?: CacheLevel` - 缓存级别

**返回值：**

- `Promise<void>` - 设置结果

**示例：**

```typescript
await cache.set('user:123', user, 300);
await cache.set('user:123', user, 300, CacheLevel.MEMORY);
```

##### delete(key: string, level?: CacheLevel): Promise<void>

删除缓存。

**参数：**

- `key: string` - 缓存键
- `level?: CacheLevel` - 缓存级别

**返回值：**

- `Promise<void>` - 删除结果

**示例：**

```typescript
await cache.delete('user:123');
await cache.delete('user:123', CacheLevel.MEMORY);
```

##### exists(key: string, level?: CacheLevel): Promise<boolean>

检查缓存是否存在。

**参数：**

- `key: string` - 缓存键
- `level?: CacheLevel` - 缓存级别

**返回值：**

- `Promise<boolean>` - 是否存在

**示例：**

```typescript
const exists = await cache.exists('user:123');
```

##### mget<T = any>(keys: string[], level?: CacheLevel): Promise<Record<string, T | null>>

批量获取缓存。

**参数：**

- `keys: string[]` - 缓存键数组
- `level?: CacheLevel` - 缓存级别

**返回值：**

- `Promise<Record<string, T | null>>` - 缓存值映射

**示例：**

```typescript
const users = await cache.mget<User>(['user:123', 'user:456']);
```

##### mset<T = any>(data: Record<string, T>, ttl?: number, level?: CacheLevel): Promise<void>

批量设置缓存。

**参数：**

- `data: Record<string, T>` - 缓存数据映射
- `ttl?: number` - 生存时间（秒）
- `level?: CacheLevel` - 缓存级别

**返回值：**

- `Promise<void>` - 设置结果

**示例：**

```typescript
await cache.mset({
  'user:123': user1,
  'user:456': user2,
}, 300);
```

##### clear(level?: CacheLevel): Promise<void>

清除所有缓存。

**参数：**

- `level?: CacheLevel` - 缓存级别

**返回值：**

- `Promise<void>` - 清除结果

**示例：**

```typescript
await cache.clear();
await cache.clear(CacheLevel.MEMORY);
```

##### getStatistics(): ICacheStatistics

获取缓存统计信息。

**返回值：**

- `ICacheStatistics` - 缓存统计信息

**示例：**

```typescript
const stats = cache.getStatistics();
console.log('Hit rate:', stats.hitRate);
```

##### resetStatistics(): void

重置统计信息。

**示例：**

```typescript
cache.resetStatistics();
```

##### warmup<T = any>(data: Record<string, T>, ttl?: number): Promise<void>

预热缓存。

**参数：**

- `data: Record<string, T>` - 预热数据
- `ttl?: number` - 生存时间（秒）

**返回值：**

- `Promise<void>` - 预热结果

**示例：**

```typescript
await cache.warmup({
  'user:123': user1,
  'user:456': user2,
}, 300);
```

## 数据库适配器API

### DatabaseAdapter

数据库适配器，提供多数据库策略。

#### 构造函数

```typescript
constructor(
  databaseService: DatabaseService,
  logger: Logger,
  config?: Partial<IDatabaseConfig>
)
```

#### 方法

##### query<T = any>(query: string, params: any[] = [], options?: IQueryOptions): Promise<T[]>

执行查询。

**参数：**

- `query: string` - 查询语句
- `params: any[]` - 查询参数
- `options?: IQueryOptions` - 查询选项

**返回值：**

- `Promise<T[]>` - 查询结果

**示例：**

```typescript
const users = await database.query<User>(
  'SELECT * FROM users WHERE age > ?',
  [18],
  { useCache: true, cacheTtl: 300 }
);
```

##### transaction<T>(callback: (transaction: any) => Promise<T>, options?: ITransactionOptions): Promise<T>

执行事务。

**参数：**

- `callback: (transaction: any) => Promise<T>` - 事务回调函数
- `options?: ITransactionOptions` - 事务选项

**返回值：**

- `Promise<T>` - 事务结果

**示例：**

```typescript
const result = await database.transaction(async (transaction) => {
  const user = await database.insert('users', userData);
  await database.insert('user_configs', { userId: user.id, settings: {} });
  return user;
}, {
  isolationLevel: 'READ_COMMITTED',
  timeout: 30000,
});
```

##### insert<T = any>(table: string, data: T | T[], options?: IQueryOptions): Promise<any>

插入数据。

**参数：**

- `table: string` - 表名
- `data: T | T[]` - 数据
- `options?: IQueryOptions` - 查询选项

**返回值：**

- `Promise<any>` - 插入结果

**示例：**

```typescript
const user = await database.insert('users', userData);
const users = await database.insert('users', [user1, user2]);
```

##### update<T = any>(table: string, data: Partial<T>, where: any, options?: IQueryOptions): Promise<any>

更新数据。

**参数：**

- `table: string` - 表名
- `data: Partial<T>` - 更新数据
- `where: any` - 条件
- `options?: IQueryOptions` - 查询选项

**返回值：**

- `Promise<any>` - 更新结果

**示例：**

```typescript
const result = await database.update(
  'users',
  { name: 'New Name' },
  { id: '123' }
);
```

##### delete(table: string, where: any, options?: IQueryOptions): Promise<any>

删除数据。

**参数：**

- `table: string` - 表名
- `where: any` - 条件
- `options?: IQueryOptions` - 查询选项

**返回值：**

- `Promise<any>` - 删除结果

**示例：**

```typescript
const result = await database.delete('users', { id: '123' });
```

##### find<T = any>(table: string, where: any = {}, options?: IQueryOptions): Promise<T[]>

查找数据。

**参数：**

- `table: string` - 表名
- `where: any` - 条件
- `options?: IQueryOptions` - 查询选项

**返回值：**

- `Promise<T[]>` - 查找结果

**示例：**

```typescript
const users = await database.find<User>('users', { active: true });
```

##### findOne<T = any>(table: string, where: any = {}, options?: IQueryOptions): Promise<T | null>

查找单条数据。

**参数：**

- `table: string` - 表名
- `where: any` - 条件
- `options?: IQueryOptions` - 查询选项

**返回值：**

- `Promise<T | null>` - 查找结果

**示例：**

```typescript
const user = await database.findOne<User>('users', { id: '123' });
```

##### count(table: string, where: any = {}, options?: IQueryOptions): Promise<number>

计数。

**参数：**

- `table: string` - 表名
- `where: any` - 条件
- `options?: IQueryOptions` - 查询选项

**返回值：**

- `Promise<number>` - 计数结果

**示例：**

```typescript
const count = await database.count('users', { active: true });
```

##### getDatabaseStatistics(): any

获取数据库统计信息。

**返回值：**

- `any` - 数据库统计信息

**示例：**

```typescript
const stats = database.getDatabaseStatistics();
console.log('Total queries:', stats.totalQueries);
```

##### resetStatistics(): void

重置统计信息。

**示例：**

```typescript
database.resetStatistics();
```

##### clearQueryCache(): void

清除查询缓存。

**示例：**

```typescript
database.clearQueryCache();
```

## 事件存储适配器API

### EventStoreAdapter

事件存储适配器，提供事件溯源功能。

#### 构造函数

```typescript
constructor(
  databaseService: DatabaseService,
  logger: Logger,
  config?: Partial<IEventStoreConfig>
)
```

#### 方法

##### saveEvent(event: IDomainEvent): Promise<void>

保存领域事件。

**参数：**

- `event: IDomainEvent` - 领域事件

**返回值：**

- `Promise<void>` - 保存结果

**示例：**

```typescript
await eventStore.saveEvent({
  aggregateId: 'user:123',
  eventType: 'UserCreated',
  eventData: userData,
  metadata: { userId: '123', timestamp: new Date() },
});
```

##### getEvents(aggregateId: string): Promise<IDomainEvent[]>

获取聚合根的所有事件。

**参数：**

- `aggregateId: string` - 聚合根ID

**返回值：**

- `Promise<IDomainEvent[]>` - 事件列表

**示例：**

```typescript
const events = await eventStore.getEvents('user:123');
```

##### getEventsByType(eventType: string): Promise<IDomainEvent[]>

根据事件类型获取事件。

**参数：**

- `eventType: string` - 事件类型

**返回值：**

- `Promise<IDomainEvent[]>` - 事件列表

**示例：**

```typescript
const events = await eventStore.getEventsByType('UserCreated');
```

##### replayEvents(aggregateId: string): Promise<any>

重放聚合根的所有事件。

**参数：**

- `aggregateId: string` - 聚合根ID

**返回值：**

- `Promise<any>` - 重放结果

**示例：**

```typescript
const user = await eventStore.replayEvents('user:123');
```

## 消息队列适配器API

### MessageQueueAdapter

消息队列适配器，提供消息发布和订阅功能。

#### 构造函数

```typescript
constructor(
  eventService: EventService,
  logger: Logger,
  config?: Partial<IMessageQueueConfig>
)
```

#### 方法

##### publish<TMessage extends object>(message: TMessage): Promise<void>

发布消息。

**参数：**

- `message: TMessage` - 消息对象

**返回值：**

- `Promise<void>` - 发布结果

**示例：**

```typescript
await messageQueue.publish({
  type: 'UserCreated',
  data: { userId: '123', email: 'user@example.com' },
  timestamp: new Date(),
});
```

##### subscribe<TMessage extends object>(topic: string, handler: (message: TMessage) => Promise<void>): Promise<void>

订阅消息。

**参数：**

- `topic: string` - 主题
- `handler: (message: TMessage) => Promise<void>` - 消息处理器

**返回值：**

- `Promise<void>` - 订阅结果

**示例：**

```typescript
await messageQueue.subscribe('user.created', async (message) => {
  console.log('User created:', message);
  // 处理用户创建消息
});
```

##### unsubscribe(topic: string): Promise<void>

取消订阅。

**参数：**

- `topic: string` - 主题

**返回值：**

- `Promise<void>` - 取消订阅结果

**示例：**

```typescript
await messageQueue.unsubscribe('user.created');
```

## 基础设施工厂API

### InfrastructureFactory

基础设施工厂，提供基础设施服务的动态创建和管理。

#### 构造函数

```typescript
constructor(
  logger: Logger,
  cacheService: CacheService,
  databaseService: DatabaseService,
  eventService: EventService,
  tenantContextService: TenantContextService
)
```

#### 方法

##### createService(config: IInfrastructureServiceConfig): any

创建基础设施服务。

**参数：**

- `config: IInfrastructureServiceConfig` - 服务配置

**返回值：**

- `any` - 服务实例

**示例：**

```typescript
const cache = infrastructureFactory.createService({
  serviceName: 'UserCache',
  serviceType: InfrastructureServiceType.CACHE_ADAPTER,
  enabled: true,
  options: { enableMemoryCache: true, defaultTtl: 300 },
  dependencies: [],
  priority: 1,
  singleton: true,
});
```

##### getService(serviceName: string): any | null

获取基础设施服务。

**参数：**

- `serviceName: string` - 服务名称

**返回值：**

- `any | null` - 服务实例

**示例：**

```typescript
const cache = infrastructureFactory.getService('UserCache');
```

##### getOrCreateService(config: IInfrastructureServiceConfig): any

获取或创建基础设施服务。

**参数：**

- `config: IInfrastructureServiceConfig` - 服务配置

**返回值：**

- `any` - 服务实例

**示例：**

```typescript
const cache = infrastructureFactory.getOrCreateService({
  serviceName: 'UserCache',
  serviceType: InfrastructureServiceType.CACHE_ADAPTER,
  enabled: true,
  options: { enableMemoryCache: true, defaultTtl: 300 },
  dependencies: [],
  priority: 1,
  singleton: true,
});
```

## 基础设施管理器API

### InfrastructureManager

基础设施管理器，提供基础设施服务的统一管理。

#### 构造函数

```typescript
constructor(
  logger: Logger,
  infrastructureFactory: InfrastructureFactory,
  config?: Partial<IInfrastructureManagerConfig>
)
```

#### 方法

##### createService(config: IInfrastructureServiceConfig): any

创建基础设施服务。

**参数：**

- `config: IInfrastructureServiceConfig` - 服务配置

**返回值：**

- `any` - 服务实例

**示例：**

```typescript
const cache = infrastructureManager.createService({
  serviceName: 'UserCache',
  serviceType: InfrastructureServiceType.CACHE_ADAPTER,
  enabled: true,
  options: { enableMemoryCache: true, defaultTtl: 300 },
  dependencies: [],
  priority: 1,
  singleton: true,
});
```

##### getService(serviceName: string): any | null

获取基础设施服务。

**参数：**

- `serviceName: string` - 服务名称

**返回值：**

- `any | null` - 服务实例

**示例：**

```typescript
const cache = infrastructureManager.getService('UserCache');
```

##### startAllServices(): Promise<void>

启动所有服务。

**返回值：**

- `Promise<void>` - 启动结果

**示例：**

```typescript
await infrastructureManager.startAllServices();
```

##### stopAllServices(): Promise<void>

停止所有服务。

**返回值：**

- `Promise<void>` - 停止结果

**示例：**

```typescript
await infrastructureManager.stopAllServices();
```

##### restartAllServices(): Promise<void>

重启所有服务。

**返回值：**

- `Promise<void>` - 重启结果

**示例：**

```typescript
await infrastructureManager.restartAllServices();
```

##### getManagerStatus(): any

获取管理器状态。

**返回值：**

- `any` - 管理器状态

**示例：**

```typescript
const status = infrastructureManager.getManagerStatus();
console.log('Manager status:', status);
```

##### getServiceStatistics(): any

获取服务统计信息。

**返回值：**

- `any` - 服务统计信息

**示例：**

```typescript
const stats = infrastructureManager.getServiceStatistics();
console.log('Service statistics:', stats);
```

##### healthCheckAllServices(): Promise<Record<string, any>>

健康检查所有服务。

**返回值：**

- `Promise<Record<string, any>>` - 健康检查结果

**示例：**

```typescript
const healthResults = await infrastructureManager.healthCheckAllServices();
console.log('Health results:', healthResults);
```

## 类型定义

### 接口类型

#### ICacheConfig

缓存配置接口。

```typescript
interface ICacheConfig {
  enableMemoryCache: boolean;
  enableRedisCache: boolean;
  enableDistributedCache: boolean;
  defaultTtl: number;
  maxMemoryCacheSize: number;
  enableCompression: boolean;
  enableEncryption: boolean;
  enableStatistics: boolean;
  keyPrefix: string;
  enableWarmup: boolean;
}
```

#### IDatabaseConfig

数据库配置接口。

```typescript
interface IDatabaseConfig {
  enablePostgreSQL: boolean;
  enableMongoDB: boolean;
  enableTransaction: boolean;
  enableConnectionPool: boolean;
  poolSize: number;
  enableQueryCache: boolean;
  queryCacheTtl: number;
  enableQueryLogging: boolean;
  enableSlowQueryMonitoring: boolean;
  slowQueryThreshold: number;
  enableMigration: boolean;
  enableBackup: boolean;
}
```

#### IInfrastructureServiceConfig

基础设施服务配置接口。

```typescript
interface IInfrastructureServiceConfig {
  serviceName: string;
  serviceType: InfrastructureServiceType;
  enabled: boolean;
  options: Record<string, any>;
  dependencies: string[];
  priority: number;
  singleton: boolean;
}
```

### 枚举类型

#### CacheLevel

缓存级别枚举。

```typescript
enum CacheLevel {
  MEMORY = 'memory',
  REDIS = 'redis',
  DISTRIBUTED = 'distributed',
}
```

#### DatabaseType

数据库类型枚举。

```typescript
enum DatabaseType {
  POSTGRESQL = 'postgresql',
  MONGODB = 'mongodb',
}
```

#### InfrastructureServiceType

基础设施服务类型枚举。

```typescript
enum InfrastructureServiceType {
  PORT_ADAPTER = 'port_adapter',
  REPOSITORY_ADAPTER = 'repository_adapter',
  DOMAIN_SERVICE_ADAPTER = 'domain_service_adapter',
  EVENT_STORE_ADAPTER = 'event_store_adapter',
  MESSAGE_QUEUE_ADAPTER = 'message_queue_adapter',
  CACHE_ADAPTER = 'cache_adapter',
  DATABASE_ADAPTER = 'database_adapter',
}
```

## 错误处理

### 常见错误类型

#### ValidationError

验证错误。

```typescript
class ValidationError extends Error {
  constructor(message: string, public errors: ValidationError[]) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

#### CacheError

缓存错误。

```typescript
class CacheError extends Error {
  constructor(message: string, public key: string) {
    super(message);
    this.name = 'CacheError';
  }
}
```

#### DatabaseError

数据库错误。

```typescript
class DatabaseError extends Error {
  constructor(message: string, public query: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}
```

### 错误处理最佳实践

```typescript
try {
  const user = await cache.get<User>('user:123');
  if (!user) {
    throw new Error('User not found');
  }
  return user;
} catch (error) {
  if (error instanceof CacheError) {
    logger.error('Cache error', error, { key: 'user:123' });
    // 尝试从数据库获取
    return await database.findOne<User>('users', { id: '123' });
  }
  throw error;
}
```

## 性能优化

### 缓存优化

```typescript
// 使用批量操作
const users = await cache.mget<User>(['user:123', 'user:456']);

// 使用适当的TTL
await cache.set('user:123', user, 300); // 5分钟

// 使用压缩
const config: Partial<ICacheConfig> = {
  enableCompression: true,
  enableStatistics: true,
};
```

### 数据库优化

```typescript
// 使用查询缓存
const users = await database.query<User>(
  'SELECT * FROM users WHERE age > ?',
  [18],
  { useCache: true, cacheTtl: 300 }
);

// 使用事务
await database.transaction(async (transaction) => {
  // 多个操作
});
```

### 消息队列优化

```typescript
// 批量发布消息
await messageQueue.publishAll([
  { type: 'UserCreated', data: user1 },
  { type: 'UserCreated', data: user2 },
]);

// 异步处理
await messageQueue.subscribe('user.created', async (message) => {
  // 异步处理逻辑
});
```

## 总结

本文档详细介绍了基础设施层的所有API接口，包括端口适配器、缓存适配器、数据库适配器、事件存储适配器、消息队列适配器和基础设施工厂。通过合理使用这些API，可以构建高性能、高可扩展性的业务系统。

更多详细信息请参考：

- [使用指南](../guides/getting-started.md)
- [最佳实践](../best-practices/README.md)
- [示例代码](../examples/README.md)
