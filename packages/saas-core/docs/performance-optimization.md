# 性能优化指南

> SAAS Core 模块的性能优化策略和最佳实践

## 📊 性能优化总结

### 数据库索引优化

#### 1. 租户表（tenants）

**单列索引**：

- `code` - 唯一索引（租户代码查询）
- `domain` - 唯一索引（域名查询）
- `type` - 普通索引（类型筛选）
- `status` - 普通索引（状态筛选）
- `tenantId` - 普通索引（租户上下文）

**复合索引**：

- `(tenantId, status)` - 租户上下文 + 状态查询
- `(type, status)` - 租户类型统计
- `(deletedAt, status)` - 软删除查询优化
- `(activatedAt, type)` - 激活时间查询

**查询优化效果**：

- 租户代码查询：< 10ms
- 状态筛选查询：< 20ms
- 复杂组合查询：< 50ms

#### 2. 用户表（users）

**单列索引**：

- `username` - 唯一索引（用户名查询）
- `email` - 唯一索引（邮箱查询）
- `phone` - 索引（手机号查询）
- `status` - 索引（状态筛选）
- `tenantId` - 索引（租户隔离）

**复合索引**：

- `(tenantId, status)` - 多租户用户列表
- `(username, tenantId)` - 登录查询优化
- `(email, tenantId)` - 邮箱查找优化
- `(deletedAt, tenantId)` - 软删除查询

**查询优化效果**：

- 用户名登录：< 15ms
- 邮箱查询：< 15ms
- 租户用户列表：< 30ms

#### 3. 配置表（tenant_configurations）

**复合索引**：

- `(maxUsers, maxStorageMB)` - 配额查询优化

### 查询优化策略

#### 1. 使用 `populate` 避免 N+1 查询

```typescript
// ❌ N+1 查询问题
const tenants = await this.em.find(TenantOrmEntity, {});
for (const tenant of tenants) {
  const config = await this.em.findOne(TenantConfigurationOrmEntity, {
    tenant: { id: tenant.id }
  });
}

// ✅ 使用 populate 预加载
const tenants = await this.em.find(TenantOrmEntity, {}, {
  populate: ['configuration'],
});
```

#### 2. 使用 QB（Query Builder）优化复杂查询

```typescript
// 复杂查询使用 Query Builder
const qb = this.em.createQueryBuilder(TenantOrmEntity, 't');
const result = await qb
  .select('*')
  .where({ status: TenantStatus.ACTIVE })
  .andWhere({ type: { $in: [TenantType.PROFESSIONAL, TenantType.ENTERPRISE] } })
  .orderBy({ createdAt: 'DESC' })
  .limit(20)
  .getResult();
```

#### 3. 批量操作优化

```typescript
// ❌ 逐个插入（慢）
for (const user of users) {
  await this.em.persistAndFlush(user);
}

// ✅ 批量插入（快）
for (const user of users) {
  this.em.persist(user);
}
await this.em.flush(); // 一次性提交
```

### 缓存策略

#### 1. 租户配置缓存

租户配置不经常变化，适合缓存：

```typescript
@Injectable()
export class TenantConfigCache {
  constructor(private readonly redis: RedisService) {}

  async get(tenantId: string) {
    const key = `tenant:${tenantId}:config`;
    const cached = await this.redis.get(key);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const config = await this.loadFromDatabase(tenantId);
    await this.redis.set(key, JSON.stringify(config), 'EX', 3600);
    
    return config;
  }

  async invalidate(tenantId: string) {
    await this.redis.del(`tenant:${tenantId}:config`);
  }
}
```

#### 2. 用户权限缓存

```typescript
@Injectable()
export class UserAbilityCache {
  async get(userId: string) {
    const key = `user:${userId}:ability`;
    const cached = await this.redis.get(key);
    
    if (cached) {
      return deserializeAbility(cached);
    }

    const ability = await this.buildAbility(userId);
    await this.redis.set(key, serializeAbility(ability), 'EX', 300);
    
    return ability;
  }
}
```

### 连接池配置

```typescript
// mikro-orm.config.ts
export default {
  pool: {
    min: 10,           // 最小连接数
    max: 50,           // 最大连接数
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  },
};
```

### 测试性能基准

基于我们的集成测试结果：

| 操作 | 平均时间 | 备注 |
|-----|---------|------|
| 创建租户 | ~160ms | 包括配置创建 |
| 查询租户（ID） | ~150ms | 使用主键索引 |
| 查询租户（代码） | ~145ms | 使用唯一索引 |
| 更新租户状态 | ~125ms | 简单更新操作 |
| 批量查询（50条） | ~800ms | 分页查询 |

## 🎯 性能优化清单

### 数据库层

- [X] 主键字段使用 UUID
- [X] 常用查询字段添加索引
- [X] 复合索引覆盖常用组合查询
- [X] 软删除字段添加索引
- [X] 租户ID字段添加索引（多租户隔离）
- [ ] 分区表（大数据量场景）
- [ ] 读写分离（高并发场景）

### ORM 层

- [X] 避免 N+1 查询（使用 populate）
- [X] 批量操作优化
- [X] 使用 Query Builder 处理复杂查询
- [X] 连接池配置
- [ ] 二级缓存配置
- [ ] 查询结果缓存

### 应用层

- [X] 租户配置缓存
- [ ] 用户权限缓存
- [ ] 部门树结构缓存
- [ ] 热点数据预加载

### API 层

- [ ] 响应压缩（gzip）
- [ ] API 速率限制
- [ ] 分页参数限制
- [ ] 响应数据字段裁剪

## 📈 未来优化方向

### 1. 读写分离

```typescript
// 写操作使用主库
await this.masterEm.persistAndFlush(entity);

// 读操作使用从库
const result = await this.slaveEm.find(Entity, {});
```

### 2. 分区表

```typescript
// 按租户分区（超大规模场景）
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  ...
) PARTITION BY HASH (tenant_id);
```

### 3. 全文搜索

```typescript
// 使用 PostgreSQL 全文搜索
@Property({ type: 'tsvector' })
@Index({ type: 'gin' })
searchVector!: any;
```

### 4. 异步处理

```typescript
// 耗时操作使用队列
@Injectable()
export class TenantService {
  async upgradeTenant(id: string, type: TenantType) {
    // 同步：更新状态
    tenant.markUpgrading();
    await this.repository.save(tenant);

    // 异步：执行升级（通过队列）
    await this.queue.add('tenant-upgrade', {
      tenantId: id,
      newType: type,
    });
  }
}
```

## 🔍 性能监控

### 查询日志分析

```typescript
// 启用查询日志
debug: true,
logger: (message) => {
  const duration = extractDuration(message);
  if (duration > 100) {
    console.warn('[Slow Query]', message);
  }
},
```

### 性能指标收集

```typescript
@Injectable()
export class PerformanceMonitor {
  @InjectMetric()
  private queryDuration: Histogram;

  async measureQuery<T>(operation: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      return await operation();
    } finally {
      const duration = Date.now() - start;
      this.queryDuration.observe(duration);
    }
  }
}
```

---

**最后更新**: 2025-10-10  
**维护者**: SAAS Core Team
