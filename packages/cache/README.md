# HL8 SAAS平台缓存模块

基于Redis和nestjs-cls的高性能、多租户缓存解决方案。

## 特性

- 🚀 **高性能**: 基于Redis的高性能缓存存储
- 🏢 **多租户**: 支持租户隔离的缓存命名空间
- 🔄 **上下文管理**: 基于nestjs-cls的透明上下文管理
- 🎯 **装饰器支持**: 声明式缓存操作，简化开发
- 📊 **监控统计**: 完整的缓存监控和统计功能
- 🛡️ **类型安全**: 完整的TypeScript类型支持
- 🔧 **灵活配置**: 支持多种缓存策略和配置选项

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
      enableTenantIsolation: true,
      cls: {
        global: true,
        middleware: {
          mount: true,
          generateId: true,
        },
      },
    }),
  ],
})
export class AppModule {}
```

### 2. 使用缓存服务

```typescript
import { Injectable } from '@nestjs/common';
import { CacheService } from '@hl8/cache';

@Injectable()
export class UserService {
  constructor(private readonly cacheService: CacheService) {}

  async getUser(userId: string): Promise<User> {
    // 尝试从缓存获取
    const cached = await this.cacheService.get(`user:${userId}`);
    if (cached) {
      return cached;
    }

    // 从数据库获取
    const user = await this.userRepository.findById(userId);
    
    // 存储到缓存
    await this.cacheService.set(`user:${userId}`, user, 3600);
    
    return user;
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
  enableTenantIsolation?: boolean; // 启用租户隔离
  strategy?: CacheStrategyConfig; // 缓存策略
  monitoring?: MonitoringConfig;  // 监控配置
  cls?: ClsConfig;               // CLS配置
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

缓存模块支持自动租户隔离，基于nestjs-cls实现：

```typescript
// 租户上下文会自动添加到缓存键中
await this.cacheService.set('data', value);
// 实际键: hl8:cache:tenant:tenant-123:data
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

## 故障排除

### 常见问题

1. **Redis连接失败**
   - 检查Redis服务器是否运行
   - 验证连接配置（主机、端口、密码）
   - 检查网络连接

2. **租户上下文丢失**
   - 确保nestjs-cls正确配置
   - 检查中间件是否已挂载
   - 验证租户ID是否正确设置

3. **缓存未命中**
   - 检查键命名是否正确
   - 验证TTL设置是否合理
   - 确认租户隔离配置

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
});
```

## 许可证

MIT License
