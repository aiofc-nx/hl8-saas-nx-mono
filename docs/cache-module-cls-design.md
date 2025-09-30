# HL8 SAAS平台缓存模块设计方案 (集成nestjs-cls)

## 📋 文档概述

### 设计目标

本文档阐述HL8 SAAS平台缓存模块的完整设计方案，基于Redis和nestjs-cls实现高性能、分布式、多租户的缓存解决方案。通过集成nestjs-cls，大大简化多租户上下文管理，提升开发效率和代码质量。

### 核心特性

- **高性能**: 基于Redis的高性能缓存
- **分布式**: 支持分布式缓存部署
- **多租户**: 基于nestjs-cls的简化多租户支持
- **类型安全**: 完整的TypeScript类型支持
- **策略管理**: 灵活的缓存策略配置
- **监控统计**: 完整的缓存监控和统计
- **上下文透明**: 自动的租户上下文传播

## 🎯 为什么使用nestjs-cls

### 主要优势

1. **简化上下文管理**: 自动处理异步上下文传播，无需手动传递租户ID
2. **类型安全**: 提供完整的TypeScript类型支持
3. **NestJS集成**: 与NestJS依赖注入系统完美集成
4. **性能优化**: 基于AsyncLocalStorage的高性能实现
5. **开发体验**: 大大简化多租户代码的编写

### 对比传统方案

**传统方案** (复杂且易错):

```typescript
// 需要手动传递租户ID
async getUser(tenantId: string, userId: string) {
  const cacheKey = `tenant:${tenantId}:user:${userId}`;
  return this.cacheService.get(cacheKey);
}

// 调用时需要传递租户ID
const user = await userService.getUser('tenant-123', 'user-456');
```

**使用nestjs-cls** (简洁且安全):

```typescript
// 自动获取当前租户上下文
async getUser(userId: string) {
  const tenantId = this.cls.get('tenantId');
  const cacheKey = `tenant:${tenantId}:user:${userId}`;
  return this.cacheService.get(cacheKey);
}

// 调用时无需传递租户ID
const user = await userService.getUser('user-456');
```

## 🏗️ 架构设计

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                   缓存模块架构 (集成nestjs-cls)                │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   接口层    │ │   服务层    │ │   策略层    │ │  存储层  │ │
│  │ (Interface)│ │  (Service)  │ │ (Strategy)  │ │(Storage)│ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              nestjs-cls 上下文层                        │ │
│  │            (Context Management)                        │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 核心组件

#### 1. 接口层 (Interface Layer)

- **缓存装饰器**: @Cacheable, @CacheEvict, @CachePut
- **类型定义**: 完整的TypeScript类型支持
- **配置接口**: 模块配置和选项定义

#### 2. 服务层 (Service Layer)

- **CacheService**: 集成CLS的核心缓存服务
- **CacheManager**: 缓存管理器
- **ClsService**: 上下文管理服务

#### 3. 策略层 (Strategy Layer)

- **TTL策略**: 基于时间的过期策略
- **LRU策略**: 最近最少使用策略
- **LFU策略**: 最少频率使用策略
- **自定义策略**: 可扩展的策略接口

#### 4. 存储层 (Storage Layer)

- **Redis服务**: Redis客户端封装
- **连接管理**: 连接池和健康检查
- **序列化**: 数据序列化和反序列化

#### 5. 上下文层 (Context Layer)

- **ClsService**: 基于AsyncLocalStorage的上下文管理
- **租户中间件**: 自动提取和设置租户上下文
- **上下文传播**: 异步操作中的上下文传递

## 🔧 核心功能设计

### 1. 基础缓存功能 (集成nestjs-cls)

#### 键值操作

```typescript
interface ICacheService {
  // 基础操作 - 自动处理租户上下文
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  
  // 批量操作
  mget<T>(keys: string[]): Promise<(T | null)[]>;
  mset<T>(pairs: Array<{key: string, value: T, ttl?: number}>): Promise<void>;
  mdelete(keys: string[]): Promise<void>;
  
  // 高级操作
  expire(key: string, ttl: number): Promise<void>;
  ttl(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  flush(): Promise<void>;
  
  // 租户上下文操作
  getCurrentTenant(): string | null;
  hasTenantContext(): boolean;
}
```

#### 缓存策略

```typescript
interface ICacheStrategy {
  shouldCache(key: string, value: any): boolean;
  getTTL(key: string): number;
  onHit(key: string): void;
  onMiss(key: string): void;
  onEvict(key: string): void;
}
```

### 2. 上下文管理

#### CLS集成

```typescript
interface IContextManager {
  setTenant(tenantId: string): void;
  getTenant(): string | null;
  setUser(userId: string): void;
  getUser(): string | null;
  setRequestId(requestId: string): void;
  getRequestId(): string | null;
  clear(): void;
}
```

#### 租户隔离

```typescript
interface ITenantIsolation {
  getTenantKey(key: string): string;
  clearTenantCache(): Promise<void>;
  getTenantStats(): Promise<TenantCacheStats>;
  listTenantKeys(): Promise<string[]>;
}
```

### 3. 缓存装饰器 (集成CLS)

#### 缓存装饰器

```typescript
// 缓存方法结果 - 自动处理租户上下文
@Cacheable('user', 3600)
async getUser(userId: string): Promise<User> {
  // 业务逻辑
}

// 清除缓存 - 自动处理租户上下文
@CacheEvict('user')
async updateUser(userId: string, data: UserData): Promise<void> {
  // 业务逻辑
}

// 更新缓存 - 自动处理租户上下文
@CachePut('user', 3600)
async createUser(data: UserData): Promise<User> {
  // 业务逻辑
}
```

#### 条件缓存

```typescript
@Cacheable('user', 3600, {
  condition: (result) => result !== null,
  unless: (result) => result.isDeleted,
  tenantAware: true // 自动处理租户上下文
})
async getUser(userId: string): Promise<User> {
  // 业务逻辑
}
```

### 4. 监控和统计

#### 缓存统计 (租户级别)

```typescript
interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: number;
  tenantStats: Map<string, TenantCacheStats>;
}

interface TenantCacheStats {
  tenantId: string;
  hits: number;
  misses: number;
  hitRate: number;
  keyCount: number;
  memoryUsage: number;
  lastAccessed: Date;
}
```

#### 健康检查

```typescript
interface CacheHealthCheck {
  isHealthy: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  latency: number;
  errorCount: number;
  lastError?: string;
  tenantContextAvailable: boolean;
}
```

## 📦 模块结构

### 目录结构

```
packages/cache/
├── src/
│   ├── index.ts                    # 主入口文件
│   ├── lib/
│   │   ├── cache.module.ts         # NestJS模块 (集成CLS)
│   │   ├── cache.service.ts        # 缓存服务 (集成CLS)
│   │   ├── redis.service.ts        # Redis服务
│   │   ├── cache.manager.ts        # 缓存管理器
│   │   ├── context.service.ts      # 上下文管理服务
│   │   ├── types/
│   │   │   ├── cache.types.ts      # 缓存类型定义
│   │   │   ├── redis.types.ts      # Redis类型定义
│   │   │   ├── tenant.types.ts     # 租户类型定义
│   │   │   └── context.types.ts    # 上下文类型定义
│   │   ├── strategies/
│   │   │   ├── base.strategy.ts    # 基础策略
│   │   │   ├── ttl.strategy.ts     # TTL策略
│   │   │   ├── lru.strategy.ts     # LRU策略
│   │   │   ├── lfu.strategy.ts     # LFU策略
│   │   │   └── custom.strategy.ts  # 自定义策略
│   │   ├── decorators/
│   │   │   ├── cacheable.decorator.ts
│   │   │   ├── cache-evict.decorator.ts
│   │   │   └── cache-put.decorator.ts
│   │   ├── middleware/
│   │   │   ├── tenant.middleware.ts
│   │   │   └── context.middleware.ts
│   │   ├── utils/
│   │   │   ├── key-generator.util.ts
│   │   │   ├── serializer.util.ts
│   │   │   └── cache-utils.util.ts
│   │   └── monitoring/
│   │       ├── cache-monitor.service.ts
│   │       ├── cache-stats.service.ts
│   │       └── health-check.service.ts
│   └── __tests__/
│       ├── cache.service.spec.ts
│       ├── context.service.spec.ts
│       └── decorators/
│           ├── cacheable.decorator.spec.ts
│           └── cache-evict.decorator.spec.ts
├── package.json
└── README.md
```

### 核心文件说明

#### 1. cache.module.ts (集成CLS)

```typescript
import { ClsModule } from 'nestjs-cls';

@Module({})
export class CacheModule {
  static forRoot(options: CacheModuleOptions): DynamicModule {
    return {
      module: CacheModule,
      imports: [
        ClsModule.forRoot({
          middleware: { mount: true },
          global: true,
        }),
      ],
      providers: [
        {
          provide: CACHE_MODULE_OPTIONS,
          useValue: options,
        },
        RedisService,
        CacheService,
        CacheManager,
        ContextService,
      ],
      exports: [CacheService, CacheManager, ContextService],
    };
  }
}
```

#### 2. cache.service.ts (集成CLS)

```typescript
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class CacheService implements ICacheService {
  constructor(
    private readonly redisService: RedisService,
    private readonly cls: ClsService,
  ) {}

  // 自动处理租户上下文
  private getTenantKey(key: string): string {
    const tenantId = this.cls.get('tenantId');
    if (!tenantId) {
      throw new Error('No tenant context found');
    }
    return `tenant:${tenantId}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const tenantKey = this.getTenantKey(key);
    return this.redisService.get(tenantKey);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const tenantKey = this.getTenantKey(key);
    return this.redisService.set(tenantKey, value, ttl);
  }

  async delete(key: string): Promise<void> {
    const tenantKey = this.getTenantKey(key);
    return this.redisService.delete(tenantKey);
  }

  // 批量操作也自动处理租户上下文
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const tenantKeys = keys.map(key => this.getTenantKey(key));
    return this.redisService.mget(tenantKeys);
  }

  async mset<T>(pairs: Array<{key: string, value: T, ttl?: number}>): Promise<void> {
    const tenantPairs = pairs.map(({key, value, ttl}) => ({
      key: this.getTenantKey(key),
      value,
      ttl
    }));
    return this.redisService.mset(tenantPairs);
  }

  getCurrentTenant(): string | null {
    return this.cls.get('tenantId');
  }

  hasTenantContext(): boolean {
    return !!this.cls.get('tenantId');
  }
}
```

#### 3. context.service.ts

```typescript
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class ContextService implements IContextManager {
  constructor(private readonly cls: ClsService) {}

  setTenant(tenantId: string): void {
    this.cls.set('tenantId', tenantId);
  }

  getTenant(): string | null {
    return this.cls.get('tenantId');
  }

  setUser(userId: string): void {
    this.cls.set('userId', userId);
  }

  getUser(): string | null {
    return this.cls.get('userId');
  }

  setRequestId(requestId: string): void {
    this.cls.set('requestId', requestId);
  }

  getRequestId(): string | null {
    return this.cls.get('requestId');
  }

  clear(): void {
    this.cls.clear();
  }
}
```

#### 4. tenant.middleware.ts

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly cls: ClsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // 从请求中提取租户ID
    const tenantId = req.headers['x-tenant-id'] || 
                    req.params.tenantId || 
                    req.query.tenantId;
    
    if (tenantId) {
      // 设置到CLS上下文中
      this.cls.set('tenantId', tenantId);
    }

    // 设置请求ID用于日志追踪
    const requestId = req.headers['x-request-id'] || 
                     req.headers['x-correlation-id'] ||
                     this.generateRequestId();
    
    this.cls.set('requestId', requestId);

    next();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

#### 5. cacheable.decorator.ts (集成CLS)

```typescript
import { ClsService } from 'nestjs-cls';

export function Cacheable(keyPrefix: string, ttl?: number, options?: CacheableOptions) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cls = this.cls as ClsService;
      const tenantId = cls.get('tenantId');
      
      if (!tenantId) {
        throw new Error('No tenant context found');
      }

      const cacheKey = `tenant:${tenantId}:${keyPrefix}:${JSON.stringify(args)}`;
      
      // 尝试从缓存获取
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      // 执行原方法
      const result = await method.apply(this, args);
      
      // 检查缓存条件
      if (options?.condition && !options.condition(result)) {
        return result;
      }
      
      if (options?.unless && options.unless(result)) {
        return result;
      }
      
      // 缓存结果
      await this.cacheService.set(cacheKey, result, ttl);
      
      return result;
    };
  };
}
```

## 🔧 配置和选项

### 模块配置

```typescript
interface CacheModuleOptions {
  redis: RedisConfig;
  defaultTTL?: number;
  keyPrefix?: string;
  enableTenantIsolation?: boolean;
  strategy?: CacheStrategyConfig;
  monitoring?: MonitoringConfig;
  cls?: ClsConfig;
}

interface ClsConfig {
  global?: boolean;
  middleware?: {
    mount?: boolean;
    generateId?: boolean;
  };
  interceptor?: {
    mount?: boolean;
  };
}

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
}
```

### 使用示例

```typescript
// 模块配置
@Module({
  imports: [
    CacheModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
        password: 'password',
        db: 0
      },
      defaultTTL: 3600,
      keyPrefix: 'hl8:cache:',
      enableTenantIsolation: true,
      strategy: {
        type: 'ttl',
        options: { defaultTTL: 3600 }
      },
      monitoring: {
        enableStats: true,
        enableHealthCheck: true,
        statsInterval: 60000
      },
      cls: {
        global: true,
        middleware: { mount: true, generateId: true },
        interceptor: { mount: true }
      }
    })
  ]
})
export class AppModule {}
```

## 🚀 使用示例

### 1. 基础服务使用

```typescript
// user.service.ts
@Injectable()
export class UserService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly cls: ClsService,
  ) {}

  // 使用装饰器 - 自动处理租户上下文
  @Cacheable('user', 3600)
  async getUser(userId: string): Promise<User> {
    // 业务逻辑
    return this.userRepository.findById(userId);
  }

  // 直接使用缓存服务 - 自动处理租户上下文
  async getUserProfile(userId: string): Promise<UserProfile> {
    const cacheKey = `user:profile:${userId}`;
    
    // 自动添加租户前缀
    const cached = await this.cacheService.get<UserProfile>(cacheKey);
    if (cached) {
      return cached;
    }

    const profile = await this.userRepository.findProfile(userId);
    
    // 自动添加租户前缀
    await this.cacheService.set(cacheKey, profile, 3600);
    
    return profile;
  }

  // 清除缓存 - 自动处理租户上下文
  async updateUser(userId: string, data: UserData): Promise<void> {
    await this.userRepository.update(userId, data);
    
    // 清除相关缓存
    await this.cacheService.delete(`user:${userId}`);
    await this.cacheService.delete(`user:profile:${userId}`);
  }
}
```

### 2. 中间件配置

```typescript
// app.module.ts
@Module({
  imports: [CacheModule.forRoot(options)],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*');
  }
}
```

### 3. 测试示例

```typescript
// user.service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let clsService: ClsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, CacheService, ClsService],
    }).compile();

    service = module.get<UserService>(UserService);
    clsService = module.get<ClsService>(ClsService);
  });

  it('should cache user data with tenant context', async () => {
    // 设置租户上下文
    clsService.set('tenantId', 'tenant-123');
    
    // 执行测试
    const user = await service.getUser('user-456');
    
    // 验证缓存
    expect(user).toBeDefined();
  });
});
```

## 📊 性能优化

### 1. 上下文管理优化

- **零开销**: AsyncLocalStorage性能优异
- **内存效率**: 上下文自动清理
- **并发安全**: 天然支持并发请求

### 2. 缓存策略优化

- **智能预热**: 基于访问模式的智能预加载
- **批量操作**: 减少Redis网络往返
- **连接池**: 高效的连接管理

### 3. 租户隔离优化

- **命名空间**: 高效的租户隔离
- **键生成**: 优化的缓存键生成策略
- **批量清理**: 高效的租户缓存清理

## 🔒 安全考虑

### 1. 数据隔离

- **租户数据完全隔离**: 基于CLS的自动隔离
- **命名空间管理**: 安全的租户命名空间
- **权限控制**: 基于上下文的权限验证

### 2. 上下文安全

- **上下文验证**: 确保租户上下文存在
- **上下文清理**: 防止上下文泄露
- **错误处理**: 优雅的上下文错误处理

## 📈 监控和运维

### 1. 上下文监控

- **租户上下文可用性**: 监控上下文设置情况
- **上下文传播**: 监控上下文在异步操作中的传播
- **上下文清理**: 监控上下文的清理情况

### 2. 缓存监控

- **租户级别统计**: 每个租户的缓存使用情况
- **性能监控**: 缓存操作的性能指标
- **健康检查**: 包含上下文状态的健康检查

## 🚀 实施计划

### 第一阶段：基础集成

- 集成nestjs-cls
- 实现基础缓存服务
- 实现租户中间件

### 第二阶段：高级功能

- 实现缓存装饰器
- 实现上下文管理服务
- 完善类型定义

### 第三阶段：监控和优化

- 实现监控和统计
- 性能优化
- 安全加固

### 第四阶段：生产就绪

- 完善测试覆盖
- 文档完善
- 运维工具

## 📝 总结

集成nestjs-cls的缓存模块设计方案为HL8 SAAS平台提供了一个简化、高效、安全的多租户缓存解决方案。通过AsyncLocalStorage的透明上下文管理，大大简化了多租户应用的开发复杂度，提升了代码的可维护性和开发效率。

该方案的核心优势：

- **开发效率**: 自动的租户上下文管理，减少样板代码
- **类型安全**: 完整的TypeScript类型支持
- **性能优异**: 基于AsyncLocalStorage的高性能实现
- **易于测试**: 可以轻松模拟和验证租户上下文
- **生产就绪**: 完善的监控、安全和运维支持

这个方案为SAAS平台的多租户缓存需求提供了最佳的解决方案。
