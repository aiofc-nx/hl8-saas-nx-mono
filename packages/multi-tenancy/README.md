# @hl8/multi-tenancy

多租户基础设施模块 - 为HL8 SAAS平台提供统一的多租户技术支撑。

## 🎯 概述

`@hl8/multi-tenancy` 是多租户架构的基础设施层，提供纯技术性的多租户功能，包括：

- **租户上下文管理**：基于nestjs-cls的透明上下文传递
- **数据隔离**：支持多种隔离策略（键前缀、命名空间、数据库等）
- **中间件系统**：自动的租户识别和验证
- **装饰器系统**：声明式的租户功能注入
- **守卫系统**：基于角色的访问控制

## 📦 安装

```bash
pnpm add @hl8/multi-tenancy
```

## 🚀 快速开始

### 基础配置

```typescript
import { Module } from '@nestjs/common';
import { MultiTenancyModule } from '@hl8/multi-tenancy';

@Module({
  imports: [
    MultiTenancyModule.forRoot({
      context: {
        enableAutoInjection: true,
        contextTimeout: 30000,
        enableAuditLog: true,
        contextStorage: 'memory',
        allowCrossTenantAccess: false
      },
      isolation: {
        strategy: 'key-prefix',
        keyPrefix: 'tenant:',
        namespace: 'tenant-namespace',
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
    })
  ]
})
export class AppModule {}
```

### 在服务中使用

```typescript
import { Injectable } from '@nestjs/common';
import { TenantContextService, TenantIsolationService } from '@hl8/multi-tenancy';

@Injectable()
export class UserService {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService
  ) {}

  async getUserData(userId: string): Promise<any> {
    // 透明获取当前租户ID
    const tenantId = this.tenantContextService.getTenant();
    
    // 生成租户键
    const tenantKey = await this.tenantIsolationService.getTenantKey(`user:${userId}`);
    
    // 使用租户键获取数据
    const userData = await this.dataStore.get(tenantKey);
    
    // 提取纯净的业务数据
    return await this.tenantIsolationService.extractTenantData(userData);
  }
}
```

## ⚙️ 配置选项

### 上下文配置 (context)

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `enableAutoInjection` | boolean | true | 是否启用自动注入 |
| `contextTimeout` | number | 30000 | 上下文超时时间（毫秒） |
| `enableAuditLog` | boolean | true | 是否启用审计日志 |
| `contextStorage` | string | 'memory' | 上下文存储方式 |
| `allowCrossTenantAccess` | boolean | false | 是否允许跨租户访问 |

### 隔离配置 (isolation)

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `strategy` | string | 'key-prefix' | 隔离策略类型 |
| `keyPrefix` | string | 'tenant:' | 键前缀 |
| `namespace` | string | 'tenant-namespace' | 命名空间 |
| `enableIsolation` | boolean | true | 是否启用隔离 |
| `level` | string | 'strict' | 隔离级别 |

### 中间件配置 (middleware)

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `enableTenantMiddleware` | boolean | true | 是否启用租户中间件 |
| `tenantHeader` | string | 'X-Tenant-ID' | 租户ID请求头名称 |
| `tenantQueryParam` | string | 'tenant' | 租户ID查询参数名称 |
| `tenantSubdomain` | boolean | true | 是否支持子域名提取 |
| `validationTimeout` | number | 5000 | 验证超时时间（毫秒） |
| `strictValidation` | boolean | true | 是否启用严格验证 |

### 安全配置 (security)

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `enableSecurityCheck` | boolean | true | 是否启用安全检查 |
| `maxFailedAttempts` | number | 5 | 最大失败尝试次数 |
| `lockoutDuration` | number | 300000 | 锁定持续时间（毫秒） |
| `enableAuditLog` | boolean | true | 是否启用审计日志 |
| `enableIpWhitelist` | boolean | false | 是否启用IP白名单 |
| `ipWhitelist` | string[] | [] | IP白名单 |

## 🔧 高级用法

### 异步配置

```typescript
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MultiTenancyModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        return {
          context: {
            enableAutoInjection: true,
            contextTimeout: configService.get('TENANT_CONTEXT_TIMEOUT', 30000),
            enableAuditLog: configService.get('TENANT_AUDIT_LOG', true),
            contextStorage: configService.get('TENANT_CONTEXT_STORAGE', 'memory'),
            allowCrossTenantAccess: configService.get('TENANT_CROSS_ACCESS', false)
          },
          isolation: {
            strategy: configService.get('TENANT_ISOLATION_STRATEGY', 'key-prefix'),
            keyPrefix: configService.get('TENANT_KEY_PREFIX', 'tenant:'),
            namespace: configService.get('TENANT_NAMESPACE', 'tenant-namespace'),
            enableIsolation: configService.get('TENANT_ISOLATION_ENABLED', true),
            level: configService.get('TENANT_ISOLATION_LEVEL', 'strict')
          },
          middleware: {
            enableTenantMiddleware: configService.get('TENANT_MIDDLEWARE_ENABLED', true),
            tenantHeader: configService.get('TENANT_HEADER', 'X-Tenant-ID'),
            tenantQueryParam: configService.get('TENANT_QUERY_PARAM', 'tenant'),
            tenantSubdomain: configService.get('TENANT_SUBDOMAIN', true),
            validationTimeout: configService.get('TENANT_VALIDATION_TIMEOUT', 5000),
            strictValidation: configService.get('TENANT_STRICT_VALIDATION', true)
          },
          security: {
            enableSecurityCheck: configService.get('TENANT_SECURITY_ENABLED', true),
            maxFailedAttempts: configService.get('TENANT_MAX_FAILED_ATTEMPTS', 5),
            lockoutDuration: configService.get('TENANT_LOCKOUT_DURATION', 300000),
            enableAuditLog: configService.get('TENANT_SECURITY_AUDIT', true),
            enableIpWhitelist: configService.get('TENANT_IP_WHITELIST_ENABLED', false),
            ipWhitelist: configService.get('TENANT_IP_WHITELIST', [])
          }
        };
      },
      inject: [ConfigService]
    })
  ]
})
export class AppModule {}
```

### 自定义上下文

```typescript
@Injectable()
export class CustomService {
  constructor(private readonly tenantContextService: TenantContextService) {}

  async setCustomContext(): Promise<void> {
    // 设置自定义上下文
    await this.tenantContextService.setCustomContext('feature-flag', 'enabled');
    await this.tenantContextService.setCustomContext('region', 'us-east-1');
    await this.tenantContextService.setCustomContext('version', '1.0.0');

    // 获取自定义上下文
    const featureFlag = this.tenantContextService.getCustomContext('feature-flag');
    const region = this.tenantContextService.getCustomContext('region');
    const version = this.tenantContextService.getCustomContext('version');
  }
}
```

### 批量操作

```typescript
@Injectable()
export class BatchService {
  constructor(private readonly tenantIsolationService: TenantIsolationService) {}

  async batchGetUserData(userIds: string[]): Promise<any[]> {
    // 批量生成租户键
    const keys = userIds.map(id => `user:${id}`);
    const tenantKeys = await this.tenantIsolationService.getTenantKeys(keys);

    // 批量获取数据
    const userDataList = await Promise.all(
      tenantKeys.map(key => this.dataStore.get(key))
    );

    // 批量提取数据
    const cleanDataList = await Promise.all(
      userDataList.map(data => this.tenantIsolationService.extractTenantData(data))
    );

    return cleanDataList;
  }
}
```

## 🔗 与其他模块集成

### 与Cache模块集成

```typescript
@Injectable()
export class CacheService {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService
  ) {}

  async get<T>(key: string): Promise<T> {
    const tenantKey = await this.tenantIsolationService.getTenantKey(key);
    return await this.redis.get(tenantKey);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const tenantKey = await this.tenantIsolationService.getTenantKey(key);
    const isolatedValue = await this.tenantIsolationService.isolateData(value);
    await this.redis.set(tenantKey, isolatedValue, ttl);
  }
}
```

### 与Database模块集成

```typescript
@Injectable()
export class DatabaseService {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService
  ) {}

  async findOne(entity: string, id: string): Promise<any> {
    const namespace = await this.tenantIsolationService.getTenantNamespace();
    const query = `SELECT * FROM ${namespace}.${entity} WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return await this.tenantIsolationService.extractTenantData(result.rows[0]);
  }
}
```

## 📊 性能考虑

- **上下文管理**：使用nestjs-cls的异步上下文，性能开销极小
- **键生成**：租户键生成结果可以被缓存以提高性能
- **批量操作**：支持批量键生成和数据隔离，减少重复计算
- **隔离策略**：可以根据业务需求选择最适合的隔离策略

## 🔒 安全特性

- **数据隔离**：确保不同租户的数据完全隔离
- **权限控制**：支持细粒度的权限检查和访问控制
- **审计日志**：记录所有租户相关的操作和访问
- **IP白名单**：支持IP白名单功能，限制访问来源

## 📝 注意事项

1. **租户ID格式**：租户ID必须符合预定义的格式规范
2. **上下文生命周期**：租户上下文与请求生命周期绑定
3. **隔离策略**：选择合适的隔离策略以平衡性能和隔离性
4. **配置验证**：模块初始化时会验证配置的有效性

## 🧪 测试

```bash
# 运行单元测试
pnpm exec nx test multi-tenancy

# 运行lint检查
pnpm exec nx lint multi-tenancy

# 构建项目
pnpm exec nx build multi-tenancy
```

## 📚 相关文档

- [多租户模块设计文档](../../docs/multi-tenancy-final-design.md)
- [多租户架构图](../../docs/multi-tenancy-architecture-diagram.md)
- [Cache模块](../../packages/cache/README.md)
- [Logger模块](../../packages/logger/README.md)

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个模块。

## 📄 许可证

MIT License
