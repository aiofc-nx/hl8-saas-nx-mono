# Database 模块异常处理集成指南

> **版本**: 1.0.0 | **更新**: 2025-10-01

## 📋 概述

本文档说明 Database 模块如何集成 `@hl8/common` 的统一异常处理系统，确保数据库操作的错误处理遵循平台统一标准。

## ✅ 集成完成情况

### 1. 依赖配置 ✅

**package.json** 已添加必要依赖：

```json
{
  "dependencies": {
    "@hl8/common": "workspace:*",
    "@hl8/logger": "workspace:*",
    "@hl8/multi-tenancy": "workspace:*",
    "@mikro-orm/core": "^6.0.0",
    "@mikro-orm/nestjs": "^6.0.0",
    "@nestjs/common": "^11.1.6",
    "nestjs-cls": "^5.0.0"
  }
}
```

### 2. 异常类集成 ✅

所有异常类都继承自 `AbstractHttpException`：

| 异常类 | 错误码 | HTTP状态 | 用途 |
|--------|--------|---------|------|
| `DatabaseConnectionException` | `DB_CONNECTION_FAILED` | 503 | 数据库连接失败 |
| `DatabaseQueryException` | `DB_QUERY_FAILED` | 500 | 查询执行失败 |
| `DatabaseTransactionException` | `DB_TRANSACTION_FAILED` | 500 | 事务执行失败 |
| `DatabaseMigrationException` | `DB_MIGRATION_FAILED` | 500 | 迁移执行失败 |
| `TenantNotFoundException` | `DB_TENANT_NOT_FOUND` | 404 | 租户未找到 |

### 3. 常量管理 ✅

使用 `ERROR_CODES` 常量避免硬编码：

```typescript
// constants.ts
export const ERROR_CODES = {
  CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
  QUERY_FAILED: 'DB_QUERY_FAILED',
  TRANSACTION_FAILED: 'DB_TRANSACTION_FAILED',
  MIGRATION_FAILED: 'DB_MIGRATION_FAILED',
  TENANT_NOT_FOUND: 'DB_TENANT_NOT_FOUND',
  // ...
} as const;
```

## 🔧 使用示例

### 1. 基本异常抛出

```typescript
import { DatabaseConnectionException } from '@hl8/database';

export class ConnectionManager {
  async connect(): Promise<Connection> {
    try {
      const connection = await createConnection(this.config);
      return connection;
    } catch (error) {
      throw new DatabaseConnectionException(
        '无法连接到数据库服务器',
        {
          host: this.config.host,
          port: this.config.port,
          database: this.config.database,
        },
        error as Error
      );
    }
  }
}
```

### 2. 查询异常处理

```typescript
import { DatabaseQueryException } from '@hl8/database';

export class DatabaseService {
  async executeQuery<T>(sql: string, params?: unknown[]): Promise<T[]> {
    try {
      const em = await this.getEntityManager();
      return await em.getConnection().execute(sql, params);
    } catch (error) {
      throw new DatabaseQueryException(
        'SQL查询执行失败',
        {
          sql,
          params,
          timestamp: new Date().toISOString(),
        },
        error as Error
      );
    }
  }
}
```

### 3. 事务异常处理

```typescript
import { DatabaseTransactionException } from '@hl8/database';

export class DatabaseService {
  async executeTransaction<T>(
    callback: (em: EntityManager) => Promise<T>
  ): Promise<T> {
    const em = await this.getEntityManager();
    
    try {
      return await em.transactional(callback);
    } catch (error) {
      throw new DatabaseTransactionException(
        '事务执行失败',
        {
          transactionId: `tx-${Date.now()}`,
          timestamp: new Date().toISOString(),
        },
        error as Error
      );
    }
  }
}
```

### 4. 租户异常处理

```typescript
import { TenantNotFoundException } from '@hl8/database';

export class TenantDatabaseService {
  async getTenantConnection(tenantId: string): Promise<Connection> {
    const connection = this.tenantConnections.get(tenantId);
    
    if (!connection) {
      throw new TenantNotFoundException(
        `租户数据库连接未找到: ${tenantId}`,
        {
          tenantId,
          availableTenants: Array.from(this.tenantConnections.keys()),
        }
      );
    }
    
    return connection;
  }
}
```

### 5. 迁移异常处理

```typescript
import { DatabaseMigrationException } from '@hl8/database';

export class MigrationService {
  async runMigrations(): Promise<void> {
    try {
      const migrator = this.orm.getMigrator();
      await migrator.up();
    } catch (error) {
      throw new DatabaseMigrationException(
        '数据库迁移执行失败',
        {
          pendingMigrations: await this.listPendingMigrations(),
          timestamp: new Date().toISOString(),
        },
        error as Error
      );
    }
  }
}
```

## 🎯 异常处理最佳实践

### 1. 统一错误响应格式

所有数据库异常都会自动转换为 RFC7807 标准的错误响应：

```json
{
  "type": "about:blank",
  "title": "数据库连接失败",
  "status": 503,
  "detail": "无法连接到数据库服务器",
  "instance": "/api/users",
  "errorCode": "DB_CONNECTION_FAILED",
  "timestamp": "2025-10-01T12:00:00.000Z",
  "requestId": "req-123456",
  "data": {
    "host": "localhost",
    "port": 5432,
    "database": "hl8_saas"
  }
}
```

### 2. 日志集成

异常会自动通过 `@hl8/logger` 记录：

```typescript
// 自动记录的日志格式
{
  "level": "error",
  "message": "Database connection failed",
  "errorCode": "DB_CONNECTION_FAILED",
  "exception": {
    "title": "数据库连接失败",
    "detail": "无法连接到数据库服务器",
    "status": 503,
    "data": { ... }
  },
  "request": {
    "id": "req-123456",
    "method": "GET",
    "url": "/api/users"
  },
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```

### 3. 异常链追踪

支持完整的异常链追踪：

```typescript
try {
  await this.connectionManager.connect();
} catch (error) {
  // 错误链：原始错误 -> DatabaseConnectionException
  throw new DatabaseConnectionException(
    '数据库初始化失败',
    { service: 'DatabaseService' },
    error as Error  // 保留原始错误
  );
}
```

### 4. 租户上下文

异常自动包含租户上下文信息：

```typescript
// 通过 nestjs-cls 自动获取租户ID
const tenantId = this.cls.get('tenantId');

throw new DatabaseQueryException(
  'Tenant query failed',
  {
    tenantId,  // 自动包含租户信息
    sql,
    params,
  },
  error as Error
);
```

## 📊 异常处理流程

```
业务代码抛出异常
       ↓
Database 异常类
 (继承 AbstractHttpException)
       ↓
AnyExceptionFilter 捕获
       ↓
日志记录 (@hl8/logger)
       ↓
转换为 ErrorResponse (RFC7807)
       ↓
返回客户端
```

## ✅ 集成验证清单

- [x] ✅ 添加 @hl8/common 依赖
- [x] ✅ 添加 @hl8/logger 依赖
- [x] ✅ 创建 5 个数据库异常类
- [x] ✅ 所有异常继承 AbstractHttpException
- [x] ✅ 使用 ERROR_CODES 常量
- [x] ✅ 包含完整的 TSDoc 注释
- [x] ✅ 包含业务规则说明
- [x] ✅ 包含使用示例
- [x] ✅ 统一导出到 exceptions/index.ts

## 🎉 集成完成

Database 模块已完全集成 `@hl8/common` 的统一异常处理系统！

### 集成优势

1. **统一标准**: 所有数据库错误遵循 RFC7807 标准
2. **类型安全**: 完整的 TypeScript 类型支持
3. **日志集成**: 自动记录结构化日志
4. **租户支持**: 自动包含租户上下文
5. **可追踪**: 完整的异常链追踪
6. **易调试**: 详细的错误信息和根本原因

---

**🚀 现在可以在 Database 模块的所有服务中使用这些异常类了！**

