# HL8 SAAS平台缓存模块

基于Redis和多租户基础设施的高性能、企业级缓存解决方案。

## 特性

- 🚀 **高性能**: 基于Redis的高性能缓存存储
- 🏢 **多租户**: 集成@hl8/multi-tenancy的专业多租户支持
- 🔄 **上下文管理**: 基于nestjs-cls的透明上下文管理
- 🎯 **装饰器支持**: 声明式缓存操作，简化开发
- 📊 **监控统计**: 完整的缓存监控和统计功能
- 🛡️ **类型安全**: 完整的TypeScript类型支持
- 🔧 **灵活配置**: 支持多种缓存策略和配置选项
- 🔒 **安全隔离**: 企业级租户数据隔离和安全机制

## 安装

```bash
pnpm add @hl8/cache
```

## 快速开始

### 1. 配置模块

```typescript
import { Module } from '@nestjs/common';
import { CacheModule } from '@hl8/cache';

@Module({
  imports: [
    CacheModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
        password: 'your-password',
        db: 0,
      },
      defaultTTL: 3600,
      keyPrefix: 'hl8:cache:',
      enableTenantIsolation: true, // 保留用于向后兼容
      cls: {
        global: true,
        middleware: {
          mount: true,
          generateId: true,
        },
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
    }),
  ],
})
export class AppModule {}
```

### 2. 使用缓存服务

```typescript
import { Injectable } from '@nestjs/common';
import { CacheService, TenantContextService, TenantIsolationService } from '@hl8/cache';

@Injectable()
export class UserService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService
  ) {}

  async getUser(userId: string): Promise<User> {
    // 尝试从缓存获取（自动处理租户隔离）
    const cached = await this.cacheService.get(`user:${userId}`);
    if (cached) {
      return cached;
    }

    // 从数据库获取
    const user = await this.userRepository.findById(userId);
    
    // 存储到缓存（自动处理租户隔离）
    await this.cacheService.set(`user:${userId}`, user, 3600);
    
    return user;
  }

  // 高级用法：手动控制租户上下文
  async getUserWithTenantContext(userId: string, tenantId: string): Promise<User> {
    return await this.tenantContextService.runWithTenant(tenantId, async () => {
      const cached = await this.cacheService.get(`user:${userId}`);
      if (cached) {
        return cached;
      }

      const user = await this.userRepository.findById(userId);
      await this.cacheService.set(`user:${userId}`, user, 3600);
      
      return user;
    });
  }
}
```

### 3. 使用装饰器

```typescript
import { Injectable } from '@nestjs/common';
import { Cacheable, CacheEvict, CachePut } from '@hl8/cache';

@Injectable()
export class UserService {
  @Cacheable('user', 3600)
  async getUser(userId: string): Promise<User> {
    return await this.userRepository.findById(userId);
  }

  @CacheEvict('user')
  async updateUser(userId: string, userData: any): Promise<void> {
    await this.userRepository.update(userId, userData);
  }

  @CachePut('user', 3600)
  async createUser(userData: any): Promise<User> {
    return await this.userRepository.create(userData);
  }
}
```

## 配置选项

### Redis配置

```typescript
interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
}
```

### 缓存模块配置

```typescript
interface CacheModuleOptions {
  redis: RedisConfig;
  defaultTTL?: number;           // 默认过期时间（秒）
  keyPrefix?: string;            // 键前缀
  enableTenantIsolation?: boolean; // 启用租户隔离（向后兼容）
  strategy?: CacheStrategyConfig; // 缓存策略
  monitoring?: MonitoringConfig;  // 监控配置
  cls?: ClsConfig;               // CLS配置
  multiTenancy?: IMultiTenancyModuleOptions; // 多租户配置（推荐）
}
```

### 多租户配置选项

```typescript
interface IMultiTenancyModuleOptions {
  context: {
    enableAutoInjection: boolean;     // 启用自动注入
    contextTimeout: number;           // 上下文超时时间
    enableAuditLog: boolean;          // 启用审计日志
    contextStorage: string;           // 上下文存储方式
    allowCrossTenantAccess: boolean;  // 允许跨租户访问
  };
  isolation: {
    strategy: string;                 // 隔离策略
    keyPrefix: string;                // 键前缀
    namespace: string;                // 命名空间
    enableIsolation: boolean;         // 启用隔离
    level: string;                    // 隔离级别
  };
  middleware: {
    enableTenantMiddleware: boolean;  // 启用租户中间件
    tenantHeader: string;             // 租户ID请求头
    tenantQueryParam: string;         // 租户ID查询参数
    tenantSubdomain: boolean;         // 支持子域名
    validationTimeout: number;        // 验证超时时间
    strictValidation: boolean;        // 严格验证
  };
  security: {
    enableSecurityCheck: boolean;     // 启用安全检查
    maxFailedAttempts: number;        // 最大失败尝试次数
    lockoutDuration: number;          // 锁定持续时间
    enableAuditLog: boolean;          // 启用审计日志
    enableIpWhitelist: boolean;       // 启用IP白名单
  };
}
```

## 装饰器

### @Cacheable

自动缓存方法返回值：

```typescript
@Cacheable('user', 3600, {
  condition: (result) => result !== null,
  unless: (result) => result.isDeleted
})
async getUser(userId: string): Promise<User> {
  return await this.userRepository.findById(userId);
}
```

### @CacheEvict

清除缓存：

```typescript
@CacheEvict('user', {
  beforeInvocation: true,
  allEntries: false
})
async deleteUser(userId: string): Promise<void> {
  await this.userRepository.delete(userId);
}
```

### @CachePut

更新缓存：

```typescript
@CachePut('user', 3600)
async updateUser(userId: string, userData: any): Promise<User> {
  return await this.userRepository.update(userId, userData);
}
```

## 租户隔离

缓存模块集成了@hl8/multi-tenancy的专业多租户支持，提供企业级的数据隔离：

### 自动租户隔离

```typescript
// 租户上下文会自动添加到缓存键中
await this.cacheService.set('data', value);
// 实际键: hl8:cache:tenant:tenant-123:data

// 获取数据时也会自动处理租户隔离
const data = await this.cacheService.get('data');
// 只会获取当前租户的数据
```

### 多层级隔离支持

```typescript
// 支持租户、组织、部门等多层级隔离
const userData = await this.cacheService.get('user:profile');
// 实际键: hl8:cache:tenant:tenant-123:org:org-456:dept:dept-789:user:profile
```

### 手动租户上下文控制

```typescript
// 在特定租户上下文中执行操作
await this.tenantContextService.runWithTenant('tenant-456', async () => {
  const data = await this.cacheService.get('shared-data');
  await this.cacheService.set('processed-data', processedData);
});
```

## 监控和统计

### 获取统计信息

```typescript
const stats = this.cacheService.getStats();
console.log('命中率:', stats.hitRate);
console.log('总请求数:', stats.hits + stats.misses);
```

### 健康检查

```typescript
const health = await this.cacheService.getHealthStatus();
console.log('缓存健康状态:', health.isHealthy);
```

## 批量操作

```typescript
// 批量获取
const values = await this.cacheService.mget(['key1', 'key2', 'key3']);

// 批量设置
await this.cacheService.mset([
  { key: 'key1', value: 'value1', ttl: 3600 },
  { key: 'key2', value: 'value2', ttl: 3600 },
]);

// 批量删除
await this.cacheService.mdelete(['key1', 'key2', 'key3']);
```

## 工具函数

### 键生成器

```typescript
import { KeyGenerators } from '@hl8/cache';

// 基于第一个参数
const keyGen1 = KeyGenerators.firstArg;

// 基于对象属性
const keyGen2 = KeyGenerators.objectProps(['id', 'type']);

// 基于哈希
const keyGen3 = KeyGenerators.hash;
```

### 序列化器

```typescript
import { SerializerFactory } from '@hl8/cache';

// JSON序列化器
const jsonSerializer = SerializerFactory.createJsonSerializer();

// 压缩JSON序列化器
const compressedSerializer = SerializerFactory.createCompressedJsonSerializer();

// 安全序列化器（处理循环引用）
const safeSerializer = SerializerFactory.createSafeJsonSerializer();
```

## 最佳实践

### 1. 键命名规范

```typescript
// 使用清晰的命名空间
const key = `user:${userId}:profile`;
const key = `tenant:${tenantId}:settings`;
const key = `cache:${module}:${action}:${params}`;
```

### 2. TTL设置

```typescript
// 根据数据特性设置合适的TTL
await this.cacheService.set('user:profile', data, 3600);  // 用户资料：1小时
await this.cacheService.set('user:session', data, 1800);  // 会话：30分钟
await this.cacheService.set('system:config', data, 86400); // 系统配置：24小时
```

### 3. 错误处理

```typescript
try {
  const cached = await this.cacheService.get(key);
  return cached;
} catch (error) {
  // 缓存失败时回退到数据库
  console.warn('缓存获取失败，回退到数据库:', error);
  return await this.databaseService.get(key);
}
```

### 4. 缓存预热

```typescript
@OnModuleInit()
async onModuleInit() {
  // 预加载热点数据
  const hotUsers = await this.userRepository.findHotUsers();
  for (const user of hotUsers) {
    await this.cacheService.set(`user:${user.id}`, user, 3600);
  }
}
```

## 迁移指南

### 从旧版本迁移

如果你正在从旧版本的cache模块迁移，请注意以下变化：

#### 1. 依赖更新

```bash
# 新增依赖
pnpm add @hl8/multi-tenancy
```

#### 2. 配置更新

```typescript
// 旧配置
CacheModule.forRoot({
  enableTenantIsolation: true,
  // ... 其他配置
});

// 新配置（推荐）
CacheModule.forRoot({
  enableTenantIsolation: true, // 保留用于向后兼容
  multiTenancy: {
    // 新的多租户配置
    context: { /* ... */ },
    isolation: { /* ... */ },
    middleware: { /* ... */ },
    security: { /* ... */ }
  }
});
```

#### 3. 服务注入更新

```typescript
// 旧方式
constructor(
  private readonly cacheService: CacheService,
  private readonly contextService: ContextService // 已废弃
) {}

// 新方式
constructor(
  private readonly cacheService: CacheService,
  private readonly tenantContextService: TenantContextService,
  private readonly tenantIsolationService: TenantIsolationService
) {}
```

## 故障排除

### 常见问题

1. **Redis连接失败**
   - 检查Redis服务器是否运行
   - 验证连接配置（主机、端口、密码）
   - 检查网络连接

2. **租户上下文丢失**
   - 确保@hl8/multi-tenancy正确配置
   - 检查中间件是否已挂载
   - 验证租户ID是否正确设置

3. **缓存未命中**
   - 检查键命名是否正确
   - 验证TTL设置是否合理
   - 确认租户隔离配置

4. **多租户配置问题**
   - 检查multiTenancy配置是否完整
   - 验证隔离策略是否正确
   - 确认安全配置是否合理

### 调试模式

```typescript
// 启用详细日志
CacheModule.forRoot({
  // ... 其他配置
  monitoring: {
    enableStats: true,
    enableHealthCheck: true,
    statsInterval: 5000, // 5秒统计间隔
  },
  multiTenancy: {
    context: {
      enableAuditLog: true, // 启用审计日志
    },
    security: {
      enableAuditLog: true, // 启用安全审计
    }
  }
});
```

## 许可证

MIT License
