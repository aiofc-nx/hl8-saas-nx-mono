# Database 模块配置集成指南

> **版本**: 1.0.0 | **更新**: 2025-10-01

## 📋 概述

本文档说明 Database 模块如何集成 `@hl8/config` 实现类型安全的配置管理。

## ✅ 集成完成情况

### 1. 依赖配置 ✅

**package.json** 已添加必要依赖：

```json
{
  "dependencies": {
    "@hl8/config": "workspace:*",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.2"
  }
}
```

### 2. 配置类定义 ✅

创建了类型安全的配置类：

| 配置类 | 用途 | 验证规则 |
|--------|------|---------|
| `PostgreSQLConfig` | PostgreSQL 连接配置 | host, port, username, password 必填 |
| `MongoDBConfig` | MongoDB 连接配置 | uri, database 必填 |
| `TenantDatabaseConfig` | 租户配置 | 隔离策略枚举验证 |
| `MigrationDatabaseConfig` | 迁移配置 | 路径格式验证 |
| `MonitoringDatabaseConfig` | 监控配置 | 阈值范围验证 |
| `DatabaseConfig` | 根配置类 | 嵌套配置验证 |

### 3. 环境变量配置 ✅

提供了完整的 `.env.example` 配置示例。

## 🔧 使用方式

### 方式 1：直接集成（推荐）

在 `DatabaseModule` 中集成 `TypedConfigModule`：

```typescript
import { Module } from '@nestjs/common';
import { TypedConfigModule, fileLoader, dotenvLoader } from '@hl8/config';
import { DatabaseConfig } from './config/database.config';
import { DatabaseModule } from '@hl8/database';

@Module({
  imports: [
    // 1. 加载数据库配置
    TypedConfigModule.forRoot({
      schema: DatabaseConfig,
      load: [
        dotenvLoader({
          envFilePath: '.env',
          separator: '__',
        }),
      ],
    }),

    // 2. 配置数据库模块
    DatabaseModule.forRootAsync({
      useFactory: (dbConfig: DatabaseConfig) => ({
        mikroORM: {
          entities: [User, Tenant],
          dbName: dbConfig.postgres.database,
          type: 'postgresql',
          host: dbConfig.postgres.host,
          port: dbConfig.postgres.port,
          user: dbConfig.postgres.username,
          password: dbConfig.postgres.password,
        },
        tenant: {
          enableIsolation: dbConfig.tenant.enableIsolation,
          isolationStrategy: dbConfig.tenant.isolationStrategy,
          tenantDatabasePrefix: dbConfig.tenant.tenantDatabasePrefix,
          autoCreateTenantDb: dbConfig.tenant.autoCreateTenantDb,
          autoMigrateTenant: dbConfig.tenant.autoMigrateTenant,
        },
        migration: {
          enableAutoMigration: dbConfig.migration.enableAutoMigration,
          migrationPath: dbConfig.migration.migrationPath,
          tenantMigrationPath: dbConfig.migration.tenantMigrationPath,
          runMigrationsOnStartup: dbConfig.migration.runMigrationsOnStartup,
        },
        monitoring: {
          enableStats: dbConfig.monitoring.enableStats,
          enableHealthCheck: dbConfig.monitoring.enableHealthCheck,
          statsInterval: dbConfig.monitoring.statsInterval,
          slowQueryThreshold: dbConfig.monitoring.slowQueryThreshold,
        },
      }),
      inject: [DatabaseConfig],
    }),
  ],
})
export class AppModule {}
```

### 方式 2：服务注入

在服务中注入配置：

```typescript
import { Injectable } from '@nestjs/common';
import { DatabaseConfig } from '@hl8/database';

@Injectable()
export class SomeService {
  constructor(private readonly dbConfig: DatabaseConfig) {
    // 类型安全的配置访问
    const host = this.dbConfig.postgres.host;
    const port = this.dbConfig.postgres.port;
  }
}
```

## 📝 环境变量配置

### .env 文件示例

```bash
# PostgreSQL 配置
DB_POSTGRES_HOST=localhost
DB_POSTGRES_PORT=5432
DB_POSTGRES_USERNAME=postgres
DB_POSTGRES_PASSWORD=your_password_here
DB_POSTGRES_DATABASE=hl8_saas
DB_POSTGRES_SSL=false
DB_POSTGRES_POOL_SIZE=20

# 租户配置
DB_TENANT_ENABLE_ISOLATION=true
DB_TENANT_ISOLATION_STRATEGY=database
DB_TENANT_DATABASE_PREFIX=hl8_tenant_
DB_TENANT_AUTO_CREATE_DB=false
DB_TENANT_AUTO_MIGRATE=false
DB_TENANT_MAX_CONNECTIONS_PER_TENANT=5
DB_TENANT_MAX_TENANTS=1000

# 迁移配置
DB_MIGRATION_ENABLE_AUTO=false
DB_MIGRATION_PATH=./migrations/postgres
DB_MIGRATION_TENANT_PATH=./migrations/tenant
DB_MIGRATION_RUN_ON_STARTUP=false

# 监控配置
DB_MONITORING_ENABLE_STATS=true
DB_MONITORING_ENABLE_HEALTH_CHECK=true
DB_MONITORING_STATS_INTERVAL=60000
DB_MONITORING_SLOW_QUERY_THRESHOLD=1000
```

### config.yaml 文件示例

```yaml
database:
  postgres:
    host: localhost
    port: 5432
    username: postgres
    password: password
    database: hl8_saas
    ssl: false
    poolSize: 20

  tenant:
    enableIsolation: true
    isolationStrategy: database
    tenantDatabasePrefix: hl8_tenant_
    autoCreateTenantDb: false
    autoMigrateTenant: false
    maxConnectionsPerTenant: 5
    maxTenants: 1000

  migration:
    enableAutoMigration: false
    migrationPath: ./migrations/postgres
    tenantMigrationPath: ./migrations/tenant
    runMigrationsOnStartup: false

  monitoring:
    enableStats: true
    enableHealthCheck: true
    statsInterval: 60000
    slowQueryThreshold: 1000
```

## 🎯 配置验证

### 自动验证

配置在应用启动时自动验证：

```typescript
// ✅ 验证通过 - 应用正常启动
DB_POSTGRES_HOST=localhost
DB_POSTGRES_PORT=5432

// ❌ 验证失败 - 应用启动失败
DB_POSTGRES_PORT=99999  // 超出端口范围
DB_TENANT_ISOLATION_STRATEGY=invalid  // 无效的隔离策略
```

### 验证规则

```typescript
PostgreSQL 配置：
- ✅ host: 非空字符串
- ✅ port: 1-65535 之间的数字
- ✅ username: 非空字符串
- ✅ password: 非空字符串
- ✅ database: 非空字符串
- ✅ poolSize: 1-100 之间的数字

租户配置：
- ✅ isolationStrategy: 'database' | 'schema' | 'table'
- ✅ tenantDatabasePrefix: 非空字符串
- ✅ maxConnectionsPerTenant: 1-20 之间
- ✅ maxTenants: ≥1 的数字

监控配置：
- ✅ statsInterval: ≥1000 毫秒
- ✅ slowQueryThreshold: ≥100 毫秒
```

## 🌟 集成优势

### 1. 类型安全 ✅

```typescript
// ✅ 编译时类型检查
const host: string = dbConfig.postgres.host;  // OK
const port: number = dbConfig.postgres.port;  // OK

// ❌ 编译时错误
const invalid = dbConfig.postgres.invalidProperty;  // Error
```

### 2. 智能提示 ✅

```typescript
// IDE 自动补全
dbConfig.postgres.  // ← 自动提示: host, port, username, password, database...
```

### 3. 配置验证 ✅

```typescript
// 启动时自动验证
- 缺少必填配置 → 启动失败，明确提示
- 类型错误 → 启动失败，类型提示
- 范围错误 → 启动失败，范围提示
```

### 4. 多环境支持 ✅

```bash
# 开发环境
.env.development

# 测试环境
.env.test

# 生产环境
.env.production
```

### 5. 敏感信息保护 ✅

```typescript
// ✅ 密码存储在环境变量
DB_POSTGRES_PASSWORD=secret

// ❌ 避免硬编码在代码中
const password = 'my-password';  // 不推荐
```

## 📊 配置结构

```
配置层次结构：
DatabaseConfig
├── postgres: PostgreSQLConfig
│   ├── host
│   ├── port
│   ├── username
│   ├── password
│   ├── database
│   ├── ssl
│   └── poolSize
├── mongodb?: MongoDBConfig (可选)
│   ├── uri
│   ├── database
│   ├── minPoolSize
│   └── maxPoolSize
├── tenant: TenantDatabaseConfig
│   ├── enableIsolation
│   ├── isolationStrategy
│   ├── tenantDatabasePrefix
│   ├── autoCreateTenantDb
│   ├── autoMigrateTenant
│   ├── maxConnectionsPerTenant
│   └── maxTenants
├── migration: MigrationDatabaseConfig
│   ├── enableAutoMigration
│   ├── migrationPath
│   ├── tenantMigrationPath
│   └── runMigrationsOnStartup
└── monitoring: MonitoringDatabaseConfig
    ├── enableStats
    ├── enableHealthCheck
    ├── statsInterval
    └── slowQueryThreshold
```

## ✅ 集成验证清单

- [x] ✅ 添加 @hl8/config 依赖
- [x] ✅ 添加 class-transformer 依赖
- [x] ✅ 添加 class-validator 依赖
- [x] ✅ 创建 DatabaseConfig 配置类
- [x] ✅ 创建 PostgreSQLConfig 子配置
- [x] ✅ 创建 MongoDBConfig 子配置
- [x] ✅ 创建 TenantDatabaseConfig 子配置
- [x] ✅ 创建 MigrationDatabaseConfig 子配置
- [x] ✅ 创建 MonitoringDatabaseConfig 子配置
- [x] ✅ 添加完整的验证规则
- [x] ✅ 提供 .env.example 示例
- [x] ✅ 创建集成文档

## 🎉 集成完成

Database 模块已完全集成 `@hl8/config` 类型安全配置系统！

### 集成优势

1. **类型安全**: 编译时类型检查，IDE 智能提示
2. **自动验证**: 启动时验证配置完整性和正确性
3. **多源支持**: 支持 .env、.yaml、远程配置
4. **环境隔离**: 支持多环境配置切换
5. **敏感保护**: 敏感信息存储在环境变量
6. **统一标准**: 与其他模块保持一致

---

**🚀 现在可以使用类型安全的方式管理 Database 模块的所有配置了！**
