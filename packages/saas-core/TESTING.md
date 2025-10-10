# SAAS Core 测试指南

## 🎯 测试策略

本项目采用 **真实数据库集成测试** 策略，而不是使用 Mock 或内存数据库。

### 为什么使用真实数据库？

✅ **验证 ORM 映射** - 确保 MikroORM 实体映射正确  
✅ **测试数据库约束** - 验证唯一约束、外键、检查约束  
✅ **发现性能问题** - 发现 N+1 查询、缺失索引  
✅ **测试事务处理** - 验证真实的事务隔离和回滚  
✅ **验证多租户隔离** - 确保租户数据完全隔离  
✅ **发现并发问题** - 测试锁、死锁等并发场景  

## 🚀 快速开始

### 1. 启动测试数据库

```bash
# 在项目根目录
docker-compose up -d postgres
```

### 2. 创建测试数据库

```bash
cd packages/saas-core

# 赋予脚本执行权限
chmod +x __tests__/scripts/create-test-database.sh

# 执行脚本
./__tests__/scripts/create-test-database.sh
```

### 3. 运行测试

```bash
# 运行所有测试
pnpm test

# 仅运行数据库集成测试
pnpm test --testPathPattern=real-db

# 运行特定测试文件
pnpm test tenant-repository.real-db.spec.ts

# 启用调试日志
TEST_DB_DEBUG=true TEST_DB_LOG=true pnpm test
```

## 📊 测试类型

### 单元测试

测试领域层业务逻辑，不涉及数据库：

```bash
# 运行单元测试（不包含数据库）
pnpm test --testPathPattern=domain
```

### 集成测试（真实数据库）

测试仓储、ORM 映射、数据库约束：

```bash
# 运行数据库集成测试
pnpm test --testPathPattern=real-db
```

### 端到端测试

测试完整的业务流程：

```bash
# 运行 E2E 测试
pnpm test:e2e
```

## 🔧 测试工具

### TestDatabaseHelper

提供数据库测试的完整工具集：

```typescript
import { TestDatabaseHelper } from './__tests__/setup/test-database.helper';

describe('数据库测试', () => {
  beforeAll(async () => {
    await TestDatabaseHelper.setup(); // 初始化数据库
  });

  afterAll(async () => {
    await TestDatabaseHelper.teardown(); // 清理连接
  });

  beforeEach(async () => {
    await TestDatabaseHelper.clearDatabase(); // 清空数据
  });

  it('测试示例', async () => {
    const em = TestDatabaseHelper.fork();
    // 执行测试...
  });
});
```

### 事务测试（推荐）

使用事务自动回滚，速度更快：

```typescript
it('应该在事务中测试', async () => {
  await TestDatabaseHelper.runInTransaction(async (em) => {
    // 测试代码
    // 测试结束后自动回滚
  });
});
```

## 📈 测试覆盖率

当前测试覆盖情况：

| 组件 | 单元测试 | 集成测试 | 状态 |
|-----|---------|---------|-----|
| 租户聚合根 | ✅ 100% | ✅ 完成 | 🟢 |
| 租户仓储 | - | ✅ 完成 | 🟢 |
| 用户聚合根 | ✅ 100% | ⏳ 待实现 | 🟡 |
| 用户仓储 | - | ⏳ 待实现 | 🟡 |
| 组织聚合根 | ✅ 100% | ⏳ 待实现 | 🟡 |
| 部门聚合根 | ✅ 100% | ⏳ 待实现 | 🟡 |

## 🐛 故障排查

### 数据库连接失败

```bash
# 检查 PostgreSQL 是否运行
docker ps | grep postgres

# 如果未运行，启动它
docker-compose up -d postgres

# 检查日志
docker-compose logs postgres
```

### 测试很慢

- ✅ 使用事务自动回滚（最快）
- ✅ 批量插入测试数据
- ✅ 减少 clearDatabase() 调用

### SQL 查询调试

```bash
# 启用 SQL 日志
TEST_DB_DEBUG=true TEST_DB_LOG=true pnpm test
```

## 📚 更多文档

- [详细测试指南](./__tests__/README.md)
- [MikroORM 配置](./src/infrastructure/persistence/mikro-orm.config.ts)
- [Docker Compose 配置](../../docker-compose.yml)

---

**提示**: 首次运行测试前，请确保已经执行 `create-test-database.sh` 创建测试数据库。
