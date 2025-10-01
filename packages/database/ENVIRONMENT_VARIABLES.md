# Database 模块环境变量配置

> **版本**: 1.0.0 | **更新**: 2025-10-01

## 📋 环境变量列表

### PostgreSQL 配置

| 变量名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `DB_POSTGRES_HOST` | string | ✅ | - | 数据库主机地址 |
| `DB_POSTGRES_PORT` | number | ✅ | 5432 | 数据库端口 |
| `DB_POSTGRES_USERNAME` | string | ✅ | - | 数据库用户名 |
| `DB_POSTGRES_PASSWORD` | string | ✅ | - | 数据库密码 |
| `DB_POSTGRES_DATABASE` | string | ✅ | - | 数据库名称 |
| `DB_POSTGRES_SSL` | boolean | ❌ | false | 是否启用 SSL |
| `DB_POSTGRES_POOL_SIZE` | number | ❌ | 20 | 连接池大小 |

### MongoDB 配置（可选）

| 变量名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `DB_MONGODB_URI` | string | ⚠️ | - | MongoDB 连接 URI |
| `DB_MONGODB_DATABASE` | string | ⚠️ | - | 数据库名称 |
| `DB_MONGODB_MIN_POOL_SIZE` | number | ❌ | 5 | 最小连接池大小 |
| `DB_MONGODB_MAX_POOL_SIZE` | number | ❌ | 20 | 最大连接池大小 |

### 租户配置

| 变量名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `DB_TENANT_ENABLE_ISOLATION` | boolean | ✅ | - | 是否启用租户隔离 |
| `DB_TENANT_ISOLATION_STRATEGY` | enum | ✅ | - | 隔离策略：database/schema/table |
| `DB_TENANT_DATABASE_PREFIX` | string | ✅ | - | 租户数据库前缀 |
| `DB_TENANT_AUTO_CREATE_DB` | boolean | ❌ | false | 是否自动创建租户数据库 |
| `DB_TENANT_AUTO_MIGRATE` | boolean | ❌ | false | 是否自动迁移租户数据库 |
| `DB_TENANT_MAX_CONNECTIONS_PER_TENANT` | number | ❌ | 5 | 每个租户的最大连接数 |
| `DB_TENANT_MAX_TENANTS` | number | ❌ | 1000 | 最大租户数量 |

### 迁移配置

| 变量名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `DB_MIGRATION_ENABLE_AUTO` | boolean | ✅ | - | 是否启用自动迁移 |
| `DB_MIGRATION_PATH` | string | ✅ | - | 迁移文件路径 |
| `DB_MIGRATION_TENANT_PATH` | string | ❌ | - | 租户迁移文件路径 |
| `DB_MIGRATION_RUN_ON_STARTUP` | boolean | ❌ | false | 启动时是否运行迁移 |

### 监控配置

| 变量名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `DB_MONITORING_ENABLE_STATS` | boolean | ✅ | - | 是否启用统计功能 |
| `DB_MONITORING_ENABLE_HEALTH_CHECK` | boolean | ✅ | - | 是否启用健康检查 |
| `DB_MONITORING_STATS_INTERVAL` | number | ✅ | - | 统计收集间隔（毫秒） |
| `DB_MONITORING_SLOW_QUERY_THRESHOLD` | number | ✅ | - | 慢查询阈值（毫秒） |

## 📝 配置文件示例

### 开发环境 (.env.development)

```bash
DB_POSTGRES_HOST=localhost
DB_POSTGRES_PORT=5432
DB_POSTGRES_USERNAME=dev_user
DB_POSTGRES_PASSWORD=dev_password
DB_POSTGRES_DATABASE=hl8_saas_dev
DB_POSTGRES_SSL=false
DB_POSTGRES_POOL_SIZE=10

DB_TENANT_ENABLE_ISOLATION=true
DB_TENANT_ISOLATION_STRATEGY=schema
DB_TENANT_DATABASE_PREFIX=dev_tenant_
DB_TENANT_AUTO_CREATE_DB=true
DB_TENANT_AUTO_MIGRATE=true

DB_MIGRATION_ENABLE_AUTO=true
DB_MIGRATION_PATH=./migrations/postgres
DB_MIGRATION_RUN_ON_STARTUP=true

DB_MONITORING_ENABLE_STATS=true
DB_MONITORING_ENABLE_HEALTH_CHECK=true
DB_MONITORING_STATS_INTERVAL=30000
DB_MONITORING_SLOW_QUERY_THRESHOLD=500
```

### 生产环境 (.env.production)

```bash
DB_POSTGRES_HOST=prod-db.example.com
DB_POSTGRES_PORT=5432
DB_POSTGRES_USERNAME=${VAULT_DB_USERNAME}
DB_POSTGRES_PASSWORD=${VAULT_DB_PASSWORD}
DB_POSTGRES_DATABASE=hl8_saas_prod
DB_POSTGRES_SSL=true
DB_POSTGRES_POOL_SIZE=50

DB_TENANT_ENABLE_ISOLATION=true
DB_TENANT_ISOLATION_STRATEGY=database
DB_TENANT_DATABASE_PREFIX=prod_tenant_
DB_TENANT_AUTO_CREATE_DB=false
DB_TENANT_AUTO_MIGRATE=false

DB_MIGRATION_ENABLE_AUTO=false
DB_MIGRATION_PATH=./migrations/postgres
DB_MIGRATION_RUN_ON_STARTUP=false

DB_MONITORING_ENABLE_STATS=true
DB_MONITORING_ENABLE_HEALTH_CHECK=true
DB_MONITORING_STATS_INTERVAL=60000
DB_MONITORING_SLOW_QUERY_THRESHOLD=1000
```

## 🔒 安全最佳实践

### 1. 敏感信息管理

```bash
# ✅ 使用密钥管理服务
DB_POSTGRES_PASSWORD=${VAULT_DB_PASSWORD}

# ✅ 使用环境变量
export DB_POSTGRES_PASSWORD="secret"

# ❌ 不要硬编码在代码中
const password = "my-password";  // 禁止
```

### 2. 环境隔离

```bash
# 开发环境
.env.development  ← 使用弱密码、自动迁移

# 生产环境
.env.production   ← 使用强密码、禁用自动迁移
```

### 3. 配置文件安全

```bash
# .gitignore
.env
.env.local
.env.*.local
config/*.local.yaml
```

## 📚 相关文档

- [Config 模块文档](../config/README.md)
- [Database 模块设计](../../docs/database-module-design.md)
- [多租户配置指南](../multi-tenancy/CONFIGURATION_ANALYSIS.md)

---

**🚀 使用类型安全的配置让 Database 模块更安全、更可靠！**
