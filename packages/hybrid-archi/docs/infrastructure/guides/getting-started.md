# 基础设施层使用指南

## 概述

基础设施层是混合架构模式的核心组件，提供统一的业务模块设计范式和通用功能组件。它集成了重构后的基础设施模块，支持多租户、多数据库、多级缓存等高级功能。

## 快速开始

### 1. 安装依赖

```bash
npm install @hl8/hybrid-archi
```

### 2. 基础配置

```typescript
import { Module } from '@nestjs/common';
import {
  InfrastructureFactoriesModule,
  PortAdaptersModule,
  CacheAdaptersModule,
  DatabaseAdaptersModule,
  EventStoreAdaptersModule,
  MessageQueueAdaptersModule,
} from '@hl8/hybrid-archi/infrastructure';

@Module({
  imports: [
    // 基础设施工厂模块
    InfrastructureFactoriesModule.forRoot({
      enableInfrastructureFactory: true,
      enableInfrastructureManager: true,
      enableAutoStart: true,
      enableHealthCheck: true,
      enableStatistics: true,
    }),
    
    // 端口适配器模块
    PortAdaptersModule.forRoot({
      enableLogger: true,
      enableIdGenerator: true,
      enableTimeProvider: true,
      enableValidation: true,
      enableConfiguration: true,
      enableEventBus: true,
    }),
    
    // 缓存适配器模块
    CacheAdaptersModule.forRoot({
      enableCache: true,
      enableMemoryCache: true,
      enableRedisCache: true,
      enableCompression: true,
      enableStatistics: true,
    }),
    
    // 数据库适配器模块
    DatabaseAdaptersModule.forRoot({
      enableDatabase: true,
      enablePostgreSQL: true,
      enableMongoDB: true,
      enableTransaction: true,
      enableQueryCache: true,
    }),
    
    // 事件存储适配器模块
    EventStoreAdaptersModule.forRoot({
      enableEventStore: true,
      enablePostgreSQL: true,
      enableEventSourcing: true,
      enableEventReplay: true,
    }),
    
    // 消息队列适配器模块
    MessageQueueAdaptersModule.forRoot({
      enableMessageQueue: true,
      enableRabbitMQ: true,
      enableRedis: true,
      enableMessagePersistence: true,
    }),
  ],
})
export class AppModule {}
```

### 3. 使用基础设施服务

```typescript
import { Injectable } from '@nestjs/common';
import {
  LoggerPortAdapter,
  CacheAdapter,
  DatabaseAdapter,
  EventStoreAdapter,
  MessageQueueAdapter,
} from '@hl8/hybrid-archi/infrastructure';

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

## 核心组件

### 1. 端口适配器

端口适配器提供应用层与基础设施层之间的接口。

#### 日志端口适配器

```typescript
import { LoggerPortAdapter } from '@hl8/hybrid-archi/infrastructure';

@Injectable()
export class UserService {
  constructor(private readonly logger: LoggerPortAdapter) {}

  async createUser(userData: CreateUserDto): Promise<User> {
    this.logger.info('Creating user', { userData });
    
    try {
      const user = await this.userRepository.create(userData);
      this.logger.info('User created successfully', { userId: user.id });
      return user;
    } catch (error) {
      this.logger.error('Failed to create user', error, { userData });
      throw error;
    }
  }
}
```

#### ID生成器端口适配器

```typescript
import { IdGeneratorPortAdapter } from '@hl8/hybrid-archi/infrastructure';

@Injectable()
export class UserService {
  constructor(private readonly idGenerator: IdGeneratorPortAdapter) {}

  async createUser(userData: CreateUserDto): Promise<User> {
    const userId = this.idGenerator.generate();
    const user = { id: userId, ...userData };
    
    return await this.userRepository.create(user);
  }
}
```

### 2. 缓存适配器

缓存适配器提供多级缓存策略。

```typescript
import { CacheAdapter, CacheLevel } from '@hl8/hybrid-archi/infrastructure';

@Injectable()
export class UserService {
  constructor(private readonly cache: CacheAdapter) {}

  async getUser(userId: string): Promise<User | null> {
    // 尝试从缓存获取
    const cachedUser = await this.cache.get<User>(`user:${userId}`);
    if (cachedUser) {
      return cachedUser;
    }

    // 从数据库获取
    const user = await this.userRepository.findById(userId);
    if (user) {
      // 缓存用户信息
      await this.cache.set(`user:${userId}`, user, 300);
    }

    return user;
  }

  async getUsers(userIds: string[]): Promise<User[]> {
    // 批量获取缓存
    const cacheKeys = userIds.map(id => `user:${id}`);
    const cachedUsers = await this.cache.mget<User>(cacheKeys);
    
    const users: User[] = [];
    const missingIds: string[] = [];
    
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const cachedUser = cachedUsers[`user:${userId}`];
      
      if (cachedUser) {
        users[i] = cachedUser;
      } else {
        missingIds.push(userId);
      }
    }
    
    // 获取缺失的用户
    if (missingIds.length > 0) {
      const missingUsers = await this.userRepository.findByIds(missingIds);
      const userMap = new Map(missingUsers.map(user => [user.id, user]));
      
      // 缓存缺失的用户
      const cacheData: Record<string, User> = {};
      for (const user of missingUsers) {
        cacheData[`user:${user.id}`] = user;
      }
      await this.cache.mset(cacheData, 300);
      
      // 填充结果
      for (let i = 0; i < userIds.length; i++) {
        if (!users[i]) {
          users[i] = userMap.get(userIds[i])!;
        }
      }
    }
    
    return users;
  }
}
```

### 3. 数据库适配器

数据库适配器提供多数据库策略。

```typescript
import { DatabaseAdapter, DatabaseType } from '@hl8/hybrid-archi/infrastructure';

@Injectable()
export class UserService {
  constructor(private readonly database: DatabaseAdapter) {}

  async createUser(userData: CreateUserDto): Promise<User> {
    // 使用事务创建用户
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
      timeout: 30000,
    });
  }

  async getUser(userId: string): Promise<User | null> {
    // 使用查询缓存
    const user = await this.database.findOne<User>(
      'users',
      { id: userId },
      {
        useCache: true,
        cacheTtl: 300,
        logQuery: true,
        tags: ['user', 'read'],
      }
    );

    return user;
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    // 更新用户
    const result = await this.database.update(
      'users',
      userData,
      { id: userId },
      {
        logQuery: true,
        tags: ['user', 'update'],
      }
    );

    // 清除相关缓存
    this.database.clearQueryCache();

    return result;
  }
}
```

### 4. 事件存储适配器

事件存储适配器提供事件溯源功能。

```typescript
import { EventStoreAdapter } from '@hl8/hybrid-archi/infrastructure';

@Injectable()
export class UserService {
  constructor(private readonly eventStore: EventStoreAdapter) {}

  async createUser(userData: CreateUserDto): Promise<User> {
    const user = await this.userRepository.create(userData);
    
    // 保存领域事件
    await this.eventStore.saveEvent({
      aggregateId: user.id,
      eventType: 'UserCreated',
      eventData: user,
      metadata: {
        userId: user.id,
        timestamp: new Date(),
      },
    });

    return user;
  }

  async getUserEvents(userId: string): Promise<DomainEvent[]> {
    return await this.eventStore.getEvents(userId);
  }

  async replayUserEvents(userId: string): Promise<User> {
    const events = await this.eventStore.getEvents(userId);
    return this.replayEvents(events);
  }
}
```

### 5. 消息队列适配器

消息队列适配器提供消息发布和订阅功能。

```typescript
import { MessageQueueAdapter } from '@hl8/hybrid-archi/infrastructure';

@Injectable()
export class UserService {
  constructor(private readonly messageQueue: MessageQueueAdapter) {}

  async createUser(userData: CreateUserDto): Promise<User> {
    const user = await this.userRepository.create(userData);
    
    // 发布用户创建消息
    await this.messageQueue.publish('user.created', {
      userId: user.id,
      userData: user,
      timestamp: new Date(),
    });

    return user;
  }

  async subscribeToUserEvents(): Promise<void> {
    // 订阅用户事件
    await this.messageQueue.subscribe('user.created', async (message) => {
      console.log('User created:', message);
      // 处理用户创建事件
    });

    await this.messageQueue.subscribe('user.updated', async (message) => {
      console.log('User updated:', message);
      // 处理用户更新事件
    });
  }
}
```

## 高级功能

### 1. 基础设施工厂

基础设施工厂提供动态创建基础设施服务的能力。

```typescript
import { InfrastructureFactory, InfrastructureServiceType } from '@hl8/hybrid-archi/infrastructure';

@Injectable()
export class InfrastructureService {
  constructor(private readonly infrastructureFactory: InfrastructureFactory) {}

  async createUserInfrastructure(): Promise<void> {
    // 创建用户相关的基础设施服务
    const loggerPort = this.infrastructureFactory.createService({
      serviceName: 'UserLoggerPort',
      serviceType: InfrastructureServiceType.PORT_ADAPTER,
      enabled: true,
      options: { adapterType: 'logger' },
      dependencies: [],
      priority: 1,
      singleton: true,
    });

    const cacheAdapter = this.infrastructureFactory.createService({
      serviceName: 'UserCacheAdapter',
      serviceType: InfrastructureServiceType.CACHE_ADAPTER,
      enabled: true,
      options: {
        enableMemoryCache: true,
        enableRedisCache: true,
        defaultTtl: 300,
        enableCompression: true,
        enableStatistics: true,
      },
      dependencies: [],
      priority: 2,
      singleton: true,
    });

    const databaseAdapter = this.infrastructureFactory.createService({
      serviceName: 'UserDatabaseAdapter',
      serviceType: InfrastructureServiceType.DATABASE_ADAPTER,
      enabled: true,
      options: {
        enablePostgreSQL: true,
        enableMongoDB: true,
        enableTransaction: true,
        enableQueryCache: true,
        enableQueryLogging: true,
      },
      dependencies: [],
      priority: 3,
      singleton: true,
    });
  }
}
```

### 2. 基础设施管理器

基础设施管理器提供基础设施服务的统一管理。

```typescript
import { InfrastructureManager } from '@hl8/hybrid-archi/infrastructure';

@Injectable()
export class InfrastructureManagementService {
  constructor(private readonly infrastructureManager: InfrastructureManager) {}

  async initializeInfrastructure(): Promise<void> {
    // 启动所有基础设施服务
    await this.infrastructureManager.startAllServices();
  }

  async getInfrastructureStatus(): Promise<any> {
    // 获取基础设施状态
    const status = this.infrastructureManager.getManagerStatus();
    const statistics = this.infrastructureManager.getServiceStatistics();
    const healthResults = await this.infrastructureManager.healthCheckAllServices();

    return {
      status,
      statistics,
      healthResults,
    };
  }

  async restartInfrastructure(): Promise<void> {
    // 重启所有基础设施服务
    await this.infrastructureManager.restartAllServices();
  }
}
```

## 最佳实践

### 1. 服务依赖管理

```typescript
// 正确：按依赖关系创建服务
const services = [
  {
    serviceName: 'DatabaseAdapter',
    serviceType: InfrastructureServiceType.DATABASE_ADAPTER,
    dependencies: [],
    priority: 1,
  },
  {
    serviceName: 'EventStoreAdapter',
    serviceType: InfrastructureServiceType.EVENT_STORE_ADAPTER,
    dependencies: ['DatabaseAdapter'], // 依赖数据库适配器
    priority: 2,
  },
  {
    serviceName: 'MessageQueueAdapter',
    serviceType: InfrastructureServiceType.MESSAGE_QUEUE_ADAPTER,
    dependencies: [],
    priority: 3,
  },
];
```

### 2. 错误处理

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
        // 缓存用户信息
        await this.cache.set(`user:${userId}`, user, 300);
      }

      return user;
    } catch (error) {
      this.logger.error('Failed to get user', error, { userId });
      throw error;
    }
  }
}
```

### 3. 性能优化

```typescript
@Injectable()
export class UserService {
  constructor(
    private readonly cache: CacheAdapter,
    private readonly database: DatabaseAdapter,
  ) {}

  async getUsers(userIds: string[]): Promise<User[]> {
    // 使用批量操作提高性能
    const cacheKeys = userIds.map(id => `user:${id}`);
    const cachedUsers = await this.cache.mget<User>(cacheKeys);
    
    const users: User[] = [];
    const missingIds: string[] = [];
    
    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const cachedUser = cachedUsers[`user:${userId}`];
      
      if (cachedUser) {
        users[i] = cachedUser;
      } else {
        missingIds.push(userId);
      }
    }
    
    // 批量获取缺失的用户
    if (missingIds.length > 0) {
      const missingUsers = await this.database.find<User>('users', {
        id: { $in: missingIds }
      });
      
      // 批量缓存
      const cacheData: Record<string, User> = {};
      for (const user of missingUsers) {
        cacheData[`user:${user.id}`] = user;
      }
      await this.cache.mset(cacheData, 300);
      
      // 填充结果
      const userMap = new Map(missingUsers.map(user => [user.id, user]));
      for (let i = 0; i < userIds.length; i++) {
        if (!users[i]) {
          users[i] = userMap.get(userIds[i])!;
        }
      }
    }
    
    return users;
  }
}
```

## 故障排除

### 1. 常见问题

#### 服务启动失败

```typescript
// 检查服务依赖
const serviceRegistration = infrastructureManager.getServiceRegistration('ServiceName');
console.log('Dependencies:', serviceRegistration?.config.dependencies);

// 检查服务状态
const healthResults = await infrastructureManager.healthCheckAllServices();
console.log('Health Results:', healthResults);
```

#### 缓存问题

```typescript
// 检查缓存统计
const stats = cacheAdapter.getStatistics();
console.log('Cache Statistics:', stats);

// 清除缓存
await cacheAdapter.clear();
```

#### 数据库连接问题

```typescript
// 检查数据库统计
const stats = databaseAdapter.getDatabaseStatistics();
console.log('Database Statistics:', stats);

// 重置统计信息
databaseAdapter.resetStatistics();
```

### 2. 调试技巧

```typescript
// 启用详细日志
const logger = new LoggerPortAdapter();
logger.debug('Debug message', { context: 'debug' });

// 监控性能
const startTime = Date.now();
await someOperation();
const duration = Date.now() - startTime;
logger.info('Operation completed', { duration });
```

## 总结

基础设施层提供了完整的通用功能组件，支持多租户、多数据库、多级缓存等高级功能。通过合理使用这些组件，可以构建高性能、高可扩展性的业务系统。

更多详细信息请参考：

- [API文档](./api/README.md)
- [最佳实践](./best-practices/README.md)
- [示例代码](./examples/README.md)
