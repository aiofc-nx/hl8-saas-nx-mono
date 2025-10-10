# SAAS Core 数据库集成测试指南

## 📋 概述

本测试套件使用 **真实的 PostgreSQL 数据库** 进行集成测试，而不是使用 Mock 或内存数据库。

### 为什么使用真实数据库？

| 优势 | 说明 |
|-----|------|
| **ORM 映射验证** | 验证 MikroORM 实体映射的正确性 |
| **数据库约束** | 测试唯一约束、外键、检查约束 |
| **查询性能** | 发现 N+1 查询、索引问题 |
| **事务处理** | 测试真实的事务隔离级别 |
| **多租户隔离** | 验证租户数据隔离的正确性 |
| **并发问题** | 发现锁、死锁等并发问题 |

## 🚀 快速开始

### 1. 启动测试数据库

使用项目根目录的 `docker-compose.yml` 启动 PostgreSQL：

```bash
# 在项目根目录下
cd /home/arligle/aiofix-ai/hl8-saas-nx-mono

# 启动 PostgreSQL（如果未运行）
docker-compose up -d postgres

# 验证 PostgreSQL 是否运行
docker ps | grep postgres
```

### 2. 配置测试环境变量

测试默认使用以下配置（与 docker-compose.yml 一致）：

```
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=saas_core_test
TEST_DB_USER=aiofix_user
TEST_DB_PASSWORD=aiofix_password
```

如需修改，可以设置环境变量或在测试配置文件中修改。

### 3. 运行测试

```bash
# 在 saas-core 目录下
cd packages/saas-core

# 运行所有测试（包括数据库集成测试）
pnpm test

# 仅运行数据库集成测试
pnpm test --testPathPattern=real-db

# 运行特定的测试文件
pnpm test tenant-repository.real-db.spec.ts

# 启用数据库日志（调试用）
TEST_DB_DEBUG=true TEST_DB_LOG=true pnpm test
```

### 4. 查看测试结果

测试会自动：

- ✅ 连接到测试数据库
- ✅ 创建 Schema（表结构）
- ✅ 运行测试
- ✅ 清理数据
- ✅ 关闭连接

## 📁 测试结构

```
__tests__/
├── setup/                              # 测试环境配置
│   ├── test-database.config.ts         # 数据库配置
│   ├── test-database.helper.ts         # 数据库辅助工具
│   ├── jest-global-setup.ts            # Jest 全局设置
│   └── jest-global-teardown.ts         # Jest 全局清理
│
├── integration/                        # 集成测试（使用真实数据库）
│   ├── tenant-repository.real-db.spec.ts      # 租户仓储测试
│   ├── user-repository.real-db.spec.ts        # 用户仓储测试（待创建）
│   └── organization-repository.real-db.spec.ts # 组织仓储测试（待创建）
│
└── e2e/                                # 端到端测试
    └── ...
```

## 🔧 测试工具类使用

### TestDatabaseHelper

提供数据库初始化、清理和管理功能。

#### 基础使用

```typescript
import { TestDatabaseHelper } from '../setup/test-database.helper';

describe('我的数据库测试', () => {
  // 全局设置：初始化数据库
  beforeAll(async () => {
    await TestDatabaseHelper.setup();
  });

  // 全局清理：关闭连接
  afterAll(async () => {
    await TestDatabaseHelper.teardown();
  });

  // 每个测试前清空数据
  beforeEach(async () => {
    await TestDatabaseHelper.clearDatabase();
  });

  it('应该执行数据库操作', async () => {
    const em = TestDatabaseHelper.fork();
    // 执行测试...
  });
});
```

#### 使用事务（推荐）

使用事务可以自动回滚，速度更快：

```typescript
it('应该在事务中测试', async () => {
  await TestDatabaseHelper.runInTransaction(async (em) => {
    // 在事务中执行操作
    const user = new User(...);
    await em.persistAndFlush(user);
    
    // 测试断言
    expect(user.id).toBeDefined();
    
    // 测试结束后自动回滚，不污染数据库
  });
});
```

#### 执行原始 SQL

```typescript
const result = await TestDatabaseHelper.executeQuery(
  'SELECT * FROM tenants WHERE type = $1',
  ['FREE']
);
```

## 📊 测试最佳实践

### 1. 数据隔离

每个测试应该独立，不依赖其他测试的数据：

```typescript
// ✅ 好的做法
beforeEach(async () => {
  await TestDatabaseHelper.clearDatabase();
  // 每个测试前清空数据
});

// ❌ 不好的做法
beforeAll(async () => {
  // 创建共享测试数据
  // 多个测试共享数据可能导致相互影响
});
```

### 2. 使用工厂函数

创建辅助函数来生成测试数据：

```typescript
function createTestTenant(overrides = {}) {
  return TenantAggregate.create(
    EntityId.generate(),
    TenantCode.create('test001'),
    '测试租户',
    TenantDomain.create('test.example.com'),
    TenantType.FREE,
    { createdBy: 'system' },
    ...overrides
  );
}
```

### 3. 测试数据库约束

```typescript
it('应该拒绝重复的租户代码', async () => {
  // 创建第一个租户
  const tenant1 = createTestTenant({ code: 'duplicate' });
  await repository.save(tenant1);
  await em.flush();

  // 尝试创建相同代码的租户
  const tenant2 = createTestTenant({ code: 'duplicate' });
  await repository.save(tenant2);

  // 应该抛出唯一约束错误
  await expect(em.flush()).rejects.toThrow();
});
```

### 4. 测试事务

```typescript
it('应该在失败时回滚事务', async () => {
  await expect(
    em.transactional(async (txEm) => {
      const tenant = createTestTenant();
      await repository.save(tenant);
      throw new Error('模拟失败');
    })
  ).rejects.toThrow();

  // 验证数据已回滚
  const count = await em.count(TenantOrmEntity, {});
  expect(count).toBe(0);
});
```

### 5. 测试查询性能

```typescript
it('应该快速查询（验证索引）', async () => {
  // 创建大量数据
  for (let i = 0; i < 100; i++) {
    await repository.save(createTestTenant({ code: `perf${i}` }));
  }
  await em.flush();

  // 测试查询速度
  const startTime = Date.now();
  const tenant = await repository.findByCode(
    TenantCode.create('perf50')
  );
  const queryTime = Date.now() - startTime;

  expect(tenant).toBeDefined();
  expect(queryTime).toBeLessThan(50); // 应该很快
});
```

## 🐛 常见问题

### Q: 测试失败，提示"数据库连接失败"

**A:** 检查 PostgreSQL 是否运行：

```bash
docker ps | grep postgres
# 或者
docker-compose up -d postgres
```

### Q: 测试很慢

**A:** 有几个优化策略：

1. **使用事务自动回滚**（最快）：

   ```typescript
   await TestDatabaseHelper.runInTransaction(async (em) => {
     // 测试代码，自动回滚
   });
   ```

2. **批量创建测试数据**：

   ```typescript
   for (const data of testDataArray) {
     em.persist(data);
   }
   await em.flush(); // 一次性提交
   ```

3. **减少 `clearDatabase()` 调用**：
   - 对于只读测试，可以共享数据

### Q: 如何调试 SQL 查询？

**A:** 启用数据库日志：

```bash
TEST_DB_DEBUG=true TEST_DB_LOG=true pnpm test
```

或者在测试代码中：

```typescript
process.env['TEST_DB_DEBUG'] = 'true';
process.env['TEST_DB_LOG'] = 'true';
```

### Q: 如何在测试中使用真实的租户过滤器？

**A:** 待实现（需要配置 MikroORM 过滤器）

## 🔗 相关文档

- [MikroORM 文档](https://mikro-orm.io/)
- [Jest 文档](https://jestjs.io/)
- [项目 Docker Compose 配置](../../../docker-compose.yml)
- [MikroORM 配置](../src/infrastructure/persistence/mikro-orm.config.ts)

## 📝 待办事项

- [ ] 添加用户仓储数据库集成测试
- [ ] 添加组织仓储数据库集成测试
- [ ] 添加部门仓储数据库集成测试
- [ ] 测试租户过滤器
- [ ] 测试软删除过滤器
- [ ] 性能基准测试
- [ ] 并发测试
- [ ] 迁移脚本测试

## 🎯 测试覆盖目标

| 组件 | 目标覆盖率 | 当前状态 |
|-----|----------|---------|
| 租户仓储 | 80%+ | ✅ 已实现 |
| 用户仓储 | 80%+ | ⏳ 待实现 |
| 组织仓储 | 80%+ | ⏳ 待实现 |
| 部门仓储 | 80%+ | ⏳ 待实现 |
| 角色仓储 | 80%+ | ⏳ 待实现 |
| 权限仓储 | 80%+ | ⏳ 待实现 |

---

**最后更新**: 2025-10-10  
**维护者**: SAAS Core Team
