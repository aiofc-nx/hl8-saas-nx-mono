# HL8 SAAS平台缓存模块设计方案 (集成@hl8/multi-tenancy)

## 📋 文档概述

### 设计目标

本文档阐述HL8 SAAS平台缓存模块的完整设计方案，基于Redis和@hl8/multi-tenancy实现高性能、分布式、多租户的缓存解决方案。通过集成专业的multi-tenancy模块，提供企业级的多租户上下文管理和数据隔离。

### 核心特性

- **高性能**: 基于Redis的高性能缓存
- **分布式**: 支持分布式缓存部署
- **多租户**: 集成@hl8/multi-tenancy的专业多租户支持
- **类型安全**: 完整的TypeScript类型支持
- **策略管理**: 灵活的缓存策略配置
- **监控统计**: 完整的缓存监控和统计
- **上下文透明**: 自动的租户上下文传播
- **企业级安全**: 严格的租户数据隔离和安全机制

## 🎯 为什么使用@hl8/multi-tenancy

### 主要优势

1. **企业级多租户**: 专业的多租户基础设施，支持复杂的租户管理需求
2. **高级隔离策略**: 支持多种租户隔离策略（key-prefix、namespace、database等）
3. **安全机制**: 内置的安全检查和访问控制机制
4. **审计日志**: 完整的租户操作审计和日志记录
5. **上下文管理**: 基于AsyncLocalStorage的高性能上下文管理
6. **NestJS集成**: 与NestJS依赖注入系统完美集成
7. **类型安全**: 提供完整的TypeScript类型支持

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

**使用@hl8/multi-tenancy** (简洁且安全):

```typescript
// 自动获取当前租户上下文
async getUser(userId: string) {
  const tenantId = this.tenantContextService.getTenant();
  const cacheKey = await this.tenantIsolationService.getTenantKey(`user:${userId}`, tenantId);
  return this.cacheService.get(cacheKey);
}

// 调用时无需传递租户ID
const user = await userService.getUser('user-456');
```

## 🏗️ 架构设计

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                   缓存模块架构 (集成@hl8/multi-tenancy)        │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   接口层    │ │   服务层    │ │   策略层    │ │  存储层  │ │
│  │ (Interface)│ │  (Service)  │ │ (Strategy)  │ │(Storage)│ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           @hl8/multi-tenancy 多租户基础设施              │ │
│  │      (TenantContextService + TenantIsolationService)   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 核心组件

#### 1. 接口层 (Interface Layer)

- **缓存装饰器**: @Cacheable, @CacheEvict, @CachePut
- **类型定义**: 完整的TypeScript类型支持
- **配置接口**: 模块配置和选项定义

#### 2. 服务层 (Service Layer)

- **CacheService**: 集成multi-tenancy的核心缓存服务
- **RedisService**: Redis客户端服务
- **TenantContextService**: 租户上下文管理服务
- **TenantIsolationService**: 租户隔离服务

#### 3. 策略层 (Strategy Layer)

- **TTL策略**: 基于时间的过期策略
- **LRU策略**: 最近最少使用策略
- **LFU策略**: 最少频率使用策略
- **自定义策略**: 可扩展的策略接口

#### 4. 存储层 (Storage Layer)

- **Redis服务**: Redis客户端封装
- **连接管理**: 连接池和健康检查
- **序列化**: 数据序列化和反序列化

#### 5. 监控层 (Monitoring Layer)

- **CacheMonitorService**: 缓存监控服务
- **CacheStatsService**: 缓存统计服务
- **HealthCheckService**: 健康检查服务

## 🔧 核心功能设计

### 1. 基础缓存功能 (集成@hl8/multi-tenancy)

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

### 2. 多租户管理

#### 租户上下文服务

```typescript
interface ITenantContextService {
  getTenant(): string | null;
  setTenant(tenantId: string): void;
  getUser(): string | null;
  setUser(userId: string): void;
  setRequestId(requestId: string): void;
  getRequestId(): string | null;
  hasTenantContext(): boolean;
  hasUserContext(): boolean;
  hasRequestContext(): boolean;
  clear(): void;
}
```

#### 租户隔离服务

```typescript
interface ITenantIsolationService {
  getTenantKey(key: string, tenantId?: string): Promise<string>;
  getTenantKeys(keys: string[], tenantId?: string): Promise<string[]>;
  getCurrentTenant(): string | null;
  clearTenantCache(tenantId?: string): Promise<void>;
  getTenantStats(tenantId?: string): Promise<TenantCacheStats>;
  listTenantKeys(tenantId?: string): Promise<string[]>;
  getTenantNamespace(tenantId?: string): string;
  isolateData<T>(data: T, tenantId?: string): Promise<T>;
  extractTenantData<T>(data: T, tenantId?: string): Promise<T>;
  validateTenantAccess(tenantId: string): Promise<boolean>;
}
```

### 3. 缓存装饰器 (集成@hl8/multi-tenancy)

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
│   │   ├── cache.module.ts         # NestJS模块 (集成@hl8/multi-tenancy)
│   │   ├── cache.service.ts        # 缓存服务 (集成@hl8/multi-tenancy)
│   │   ├── redis.service.ts        # Redis服务
│   │   ├── types/
│   │   │   ├── cache.types.ts      # 缓存类型定义
│   │   │   └── redis.types.ts      # Redis类型定义
│   │   ├── decorators/
│   │   │   ├── cacheable.decorator.ts
│   │   │   ├── cache-evict.decorator.ts
│   │   │   └── cache-put.decorator.ts
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
│       └── utils/
│           └── serializer.util.spec.ts
├── package.json
└── README.md
```

### 核心文件说明

#### 1. cache.module.ts (集成@hl8/multi-tenancy)

```typescript
import { MultiTenancyModule, TenantContextService, TenantIsolationService } from '@hl8/multi-tenancy';

@Module({})
export class CacheModule {
  static forRoot(options: CacheModuleOptions): DynamicModule {
    return {
      module: CacheModule,
      imports: [
        // 集成 multi-tenancy 模块
        MultiTenancyModule.forRoot(options.multiTenancy || {
          context: {
            enableAutoInjection: true,
            contextTimeout: 30000,
            enableAuditLog: true,
            contextStorage: 'memory',
            allowCrossTenantAccess: false,
          },
          isolation: {
            strategy: 'key-prefix',
            keyPrefix: options.keyPrefix || 'hl8:cache:',
            namespace: 'cache-namespace',
            enableIsolation: options.enableTenantIsolation !== false,
            level: 'strict',
          },
          middleware: {
            enableTenantMiddleware: true,
            tenantHeader: 'X-Tenant-ID',
            tenantQueryParam: 'tenant',
            tenantSubdomain: true,
            validationTimeout: 5000,
            strictValidation: true,
          },
          security: {
            enableSecurityCheck: true,
            maxFailedAttempts: 5,
            lockoutDuration: 300000,
            enableAuditLog: true,
            enableIpWhitelist: false,
          },
        }),
      ],
      providers: [
        {
          provide: CACHE_MODULE_OPTIONS,
          useValue: options,
        },
        RedisService,
        CacheService,
        CacheMonitorService,
        CacheStatsService,
        HealthCheckService,
      ],
      exports: [
        CacheService,
        TenantContextService,
        TenantIsolationService,
        CacheMonitorService,
        CacheStatsService,
        HealthCheckService,
      ],
    };
  }
}
```

#### 2. cache.service.ts (集成@hl8/multi-tenancy)

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { TenantContextService, TenantIsolationService } from '@hl8/multi-tenancy';

@Injectable()
export class CacheService implements ICacheService {
  constructor(
    private readonly redisService: RedisService,
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService,
    @Inject(CACHE_MODULE_OPTIONS)
    private readonly options: CacheModuleOptions
  ) {}

  // 自动处理租户上下文
  private async getTenantKey(key: string, tenantId?: string): Promise<string> {
    try {
      const currentTenantId = tenantId || this.tenantContextService.getTenant();
      
      if (currentTenantId) {
        return await this.tenantIsolationService.getTenantKey(key, currentTenantId);
      }
      
      // 如果没有租户上下文，使用默认键前缀
      const keyPrefix = this.options.keyPrefix || 'hl8:cache:';
      return `${keyPrefix}${key}`;
    } catch (error) {
      // 回退到简单的键前缀方式
      const keyPrefix = this.options.keyPrefix || 'hl8:cache:';
      return `${keyPrefix}${key}`;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const tenantKey = await this.getTenantKey(key);
    return this.redisService.get(tenantKey);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const tenantKey = await this.getTenantKey(key);
    return this.redisService.set(tenantKey, value, ttl);
  }

  async delete(key: string): Promise<void> {
    const tenantKey = await this.getTenantKey(key);
    return this.redisService.delete(tenantKey);
  }

  // 批量操作也自动处理租户上下文
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const tenantKeys = await Promise.all(keys.map(key => this.getTenantKey(key)));
    return this.redisService.mget(tenantKeys);
  }

  async mset<T>(pairs: Array<{key: string, value: T, ttl?: number}>): Promise<void> {
    const tenantPairs = await Promise.all(pairs.map(async ({key, value, ttl}) => ({
      key: await this.getTenantKey(key),
      value,
      ttl
    })));
    return this.redisService.mset(tenantPairs);
  }

  getCurrentTenant(): string | null {
    return this.tenantContextService.getTenant();
  }

  hasTenantContext(): boolean {
    return this.tenantContextService.getTenant() !== null;
  }
}
```

#### 3. redis.service.ts

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;

  constructor(@Inject(CACHE_MODULE_OPTIONS) private options: CacheModuleOptions) {}

  async onModuleInit() {
    this.redis = new Redis({
      host: this.options.redis.host,
      port: this.options.redis.port,
      password: this.options.redis.password,
      db: this.options.redis.db || 0,
      retryDelayOnFailover: this.options.redis.retryDelayOnFailover || 100,
      maxRetriesPerRequest: this.options.redis.maxRetriesPerRequest || 3,
      lazyConnect: this.options.redis.lazyConnect || true,
    });

    // 测试连接
    await this.redis.ping();
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    if (ttl) {
      await this.redis.setex(key, ttl, serializedValue);
    } else {
      await this.redis.set(key, serializedValue);
    }
  }

  async delete(key: string): Promise<number> {
    return this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  // 其他Redis操作方法...
}
```

#### 4. cacheable.decorator.ts

```typescript
import { SetMetadata } from '@nestjs/common';
import { CacheableOptions } from '../types/cache.types';

export const CACHEABLE_METADATA = 'cacheable';

/**
 * 缓存方法结果装饰器
 *
 * @description 自动缓存方法的返回值，支持租户上下文
 *
 * @param keyPrefix 缓存键前缀
 * @param ttl 缓存过期时间（秒）
 * @param options 缓存选项
 */
export function Cacheable(
  keyPrefix: string,
  ttl?: number,
  options?: CacheableOptions
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    // 设置元数据，由拦截器处理实际的缓存逻辑
    SetMetadata(CACHEABLE_METADATA, {
      keyPrefix,
      ttl,
      ...options,
    })(target, propertyName, descriptor);

    return descriptor;
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
  enableTenantIsolation?: boolean; // 保留用于向后兼容
  strategy?: CacheStrategyConfig;
  monitoring?: MonitoringConfig;
  cls?: ClsConfig; // 保留用于向后兼容
  multiTenancy?: IMultiTenancyModuleOptions; // 新增多租户配置
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
      enableTenantIsolation: true, // 保留用于向后兼容
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
      },
      // 新增：多租户配置（推荐使用）
      multiTenancy: {
        context: {
          enableAutoInjection: true,
          contextTimeout: 30000,
          enableAuditLog: true,
          contextStorage: 'memory',
          allowCrossTenantAccess: false
        },
        isolation: {
          strategy: 'key-prefix',
          keyPrefix: 'hl8:cache:',
          namespace: 'cache-namespace',
          enableIsolation: true,
          level: 'strict'
        },
        middleware: {
          enableTenantMiddleware: true,
          tenantHeader: 'X-Tenant-ID',
          tenantQueryParam: 'tenant',
          tenantSubdomain: true,
          validationTimeout: 5000,
          strictValidation: true
        },
        security: {
          enableSecurityCheck: true,
          maxFailedAttempts: 5,
          lockoutDuration: 300000,
          enableAuditLog: true,
          enableIpWhitelist: false
        }
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
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService,
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

  // 高级用法：手动控制租户上下文
  async getUserWithTenant(tenantId: string, userId: string): Promise<User> {
    return this.tenantContextService.runWithTenant(tenantId, async () => {
      return this.getUser(userId);
    });
  }
}
```

### 2. 中间件配置

```typescript
// app.module.ts
@Module({
  imports: [
    CacheModule.forRoot({
      // ... 其他配置
      multiTenancy: {
        middleware: {
          enableTenantMiddleware: true,
          tenantHeader: 'X-Tenant-ID',
          tenantQueryParam: 'tenant',
          tenantSubdomain: true,
          validationTimeout: 5000,
          strictValidation: true
        }
      }
    })
  ],
})
export class AppModule {}
```

### 3. 测试示例

```typescript
// user.service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let tenantContextService: TenantContextService;
  let tenantIsolationService: TenantIsolationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService, 
        CacheService, 
        TenantContextService,
        TenantIsolationService
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    tenantContextService = module.get<TenantContextService>(TenantContextService);
    tenantIsolationService = module.get<TenantIsolationService>(TenantIsolationService);
  });

  it('should cache user data with tenant context', async () => {
    // 设置租户上下文
    tenantContextService.setTenant('tenant-123');
    
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

## 🔄 迁移指南

### 从旧版本迁移

如果您正在从使用nestjs-cls的旧版本迁移到使用@hl8/multi-tenancy的新版本，请参考以下迁移步骤：

#### 1. 依赖更新

```bash
# 移除旧的依赖
pnpm remove nestjs-cls

# 添加新的依赖
pnpm add @hl8/multi-tenancy
```

#### 2. 配置更新

**旧配置**:

```typescript
CacheModule.forRoot({
  // ... 其他配置
  cls: {
    global: true,
    middleware: { mount: true, generateId: true },
    interceptor: { mount: true }
  }
})
```

**新配置**:

```typescript
CacheModule.forRoot({
  // ... 其他配置
  cls: {
    global: true,
    middleware: { mount: true, generateId: true },
    interceptor: { mount: true }
  },
  multiTenancy: {
    context: {
      enableAutoInjection: true,
      contextTimeout: 30000,
      enableAuditLog: true,
      contextStorage: 'memory',
      allowCrossTenantAccess: false
    },
    isolation: {
      strategy: 'key-prefix',
      keyPrefix: 'hl8:cache:',
      namespace: 'cache-namespace',
      enableIsolation: true,
      level: 'strict'
    },
    middleware: {
      enableTenantMiddleware: true,
      tenantHeader: 'X-Tenant-ID',
      tenantQueryParam: 'tenant',
      tenantSubdomain: true,
      validationTimeout: 5000,
      strictValidation: true
    },
    security: {
      enableSecurityCheck: true,
      maxFailedAttempts: 5,
      lockoutDuration: 300000,
      enableAuditLog: true,
      enableIpWhitelist: false
    }
  }
})
```

#### 3. 服务注入更新

**旧的服务注入**:

```typescript
constructor(
  private readonly cacheService: CacheService,
  private readonly cls: ClsService,
) {}
```

**新的服务注入**:

```typescript
constructor(
  private readonly cacheService: CacheService,
  private readonly tenantContextService: TenantContextService,
  private readonly tenantIsolationService: TenantIsolationService,
) {}
```

#### 4. 上下文访问更新

**旧的上下文访问**:

```typescript
const tenantId = this.cls.get('tenantId');
```

**新的上下文访问**:

```typescript
const tenantId = this.tenantContextService.getTenant();
```

#### 5. 向后兼容性

新版本保持了向后兼容性：

- 旧的`enableTenantIsolation`配置仍然有效
- 旧的`cls`配置仍然有效
- 旧的API调用方式仍然有效

### 最佳实践

1. **逐步迁移**: 建议逐步迁移，先添加新的配置，然后逐步更新服务注入
2. **测试验证**: 在迁移过程中，确保所有测试都能通过
3. **监控观察**: 迁移后密切监控系统性能和行为
4. **文档更新**: 更新相关的API文档和使用说明

## 📝 总结

集成@hl8/multi-tenancy的缓存模块设计方案为HL8 SAAS平台提供了一个企业级、高效、安全的多租户缓存解决方案。通过专业的多租户基础设施，提供了完整的租户管理、数据隔离、安全机制和审计功能。

该方案的核心优势：

- **企业级多租户**: 专业的多租户基础设施，支持复杂的租户管理需求
- **高级隔离策略**: 支持多种租户隔离策略（key-prefix、namespace、database等）
- **安全机制**: 内置的安全检查和访问控制机制
- **审计日志**: 完整的租户操作审计和日志记录
- **开发效率**: 自动的租户上下文管理，减少样板代码
- **类型安全**: 完整的TypeScript类型支持
- **性能优异**: 基于AsyncLocalStorage的高性能实现
- **易于测试**: 可以轻松模拟和验证租户上下文
- **生产就绪**: 完善的监控、安全和运维支持

这个方案为SAAS平台的多租户缓存需求提供了企业级的最佳解决方案。
