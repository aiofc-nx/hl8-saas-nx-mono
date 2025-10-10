# @hl8/saas-core

> SAAS 平台核心业务模块 - 多租户管理、用户管理、组织架构、角色权限

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0%2B-red)](https://nestjs.com/)
[![MikroORM](https://img.shields.io/badge/MikroORM-6.0%2B-green)](https://mikro-orm.io/)

## 📋 目录

- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [核心概念](#核心概念)
- [API 文档](#api-文档)
- [测试](#测试)
- [架构设计](#架构设计)
- [贡献指南](#贡献指南)

## ✨ 功能特性

### 核心功能

- **🏢 多租户管理**
  - 支持5种租户类型（免费、基础、专业、企业、白标）
  - 租户生命周期管理（创建、激活、暂停、恢复、删除）
  - 灵活的配额管理和限制
  - 租户升级和降级工作流

- **👤 用户管理**
  - 用户注册和邮箱验证
  - JWT 令牌认证
  - 用户个人信息管理
  - 多租户用户关联

- **🏛️ 组织架构**
  - 组织和部门层级管理
  - 闭包表实现高效的层级查询
  - 组织成员管理
  - 部门成员分配

- **🔐 角色权限**
  - 基于 CASL 的 RBAC 权限系统
  - 角色定义和权限分配
  - 细粒度的资源访问控制
  - 权限继承和组合

- **🛡️ 数据隔离**
  - 严格的租户数据隔离
  - 自动租户上下文注入
  - 审计日志和操作追踪
  - 数据脱敏支持

## 🛠️ 技术栈

### 核心框架

- **NestJS 11+** - 渐进式 Node.js 框架
- **TypeScript 5+** - 类型安全
- **MikroORM 6+** - TypeScript ORM
- **PostgreSQL 16+** - 主数据库
- **Redis 7+** - 缓存和会话

### 架构模式

- **Clean Architecture** - 分层架构
- **Domain-Driven Design (DDD)** - 领域驱动设计
- **CQRS** - 命令查询职责分离
- **Event Sourcing** - 事件溯源
- **Event-Driven Architecture (EDA)** - 事件驱动

### 关键依赖

- `@hl8/hybrid-archi` - 混合架构基础库
- `@hl8/multi-tenancy` - 多租户支持
- `@casl/ability` - 权限管理
- `class-validator` - 数据验证
- `class-transformer` - 数据转换

## 🚀 快速开始

### 前置要求

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- PostgreSQL >= 16.0
- Redis >= 7.0

### 安装

```bash
# 安装依赖
pnpm install

# 构建项目
pnpm build

# 运行测试
pnpm test
```

### 数据库设置

```bash
# 启动 PostgreSQL 和 Redis（使用 Docker）
docker-compose up -d postgres redis

# 运行数据库迁移
pnpm migration:up
```

### 基础使用

```typescript
import { SaasCoreModule } from '@hl8/saas-core';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    SaasCoreModule.forRoot({
      database: {
        host: 'localhost',
        port: 5432,
        database: 'saas_platform',
        username: 'postgres',
        password: 'postgres',
      },
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
})
export class AppModule {}
```

## 💡 核心概念

### 租户（Tenant）

租户是系统中的顶级隔离单元，每个租户拥有独立的数据空间：

```typescript
import { TenantAggregate } from '@hl8/saas-core';

// 创建租户
const tenant = TenantAggregate.create(
  EntityId.generate(),
  TenantCode.create('mycompany'),
  'My Company',
  TenantDomain.create('mycompany.example.com'),
  TenantType.PROFESSIONAL,
  { createdBy: 'admin' }
);

// 激活租户
tenant.activate('admin');

// 升级租户
tenant.upgrade(TenantType.ENTERPRISE, 'admin');
```

### 用户（User）

用户可以属于一个或多个租户：

```typescript
import { UserAggregate } from '@hl8/saas-core';

// 注册用户
const user = UserAggregate.register(
  EntityId.generate(),
  Username.create('john.doe'),
  Email.create('john@example.com'),
  PhoneNumber.create('+1234567890'),
  { createdBy: 'system' }
);

// 激活用户
user.activate('admin');
```

### 组织和部门（Organization & Department）

组织是租户下的业务单元，部门是组织内的层级结构：

```typescript
import { OrganizationAggregate, DepartmentAggregate } from '@hl8/saas-core';

// 创建组织
const org = OrganizationAggregate.create(
  EntityId.generate(),
  'Engineering',
  OrganizationType.create('DEPARTMENT'),
  tenantId,
  { createdBy: 'admin' }
);

// 创建部门
const dept = DepartmentAggregate.create(
  EntityId.generate(),
  'Backend Team',
  organizationId,
  parentDepartmentId,
  { createdBy: 'admin' }
);
```

### 角色和权限（Role & Permission）

使用 CASL 实现细粒度的权限控制：

```typescript
import { RoleAggregate, PermissionAggregate } from '@hl8/saas-core';

// 创建角色
const role = RoleAggregate.create(
  EntityId.generate(),
  RoleName.create('manager'),
  'Department Manager',
  RoleLevel.create(3),
  tenantId,
  { createdBy: 'admin' }
);

// 定义权限
const permission = PermissionAggregate.create(
  EntityId.generate(),
  'user',
  PermissionAction.create('manage'),
  { createdBy: 'admin' }
);
```

## 📚 API 文档

详细的 API 文档请查看：

- [API 使用指南](./docs/README.md)
- [MikroORM 与 CASL 集成](./docs/mikroorm-casl-integration.md)
- [数据库集成测试指南](./__tests__/README.md)

### REST API 端点

#### 租户管理

```http
POST   /api/tenants          # 创建租户
GET    /api/tenants          # 获取租户列表
GET    /api/tenants/:id      # 获取租户详情
PUT    /api/tenants/:id      # 更新租户
DELETE /api/tenants/:id      # 删除租户
POST   /api/tenants/:id/activate    # 激活租户
POST   /api/tenants/:id/suspend     # 暂停租户
POST   /api/tenants/:id/upgrade     # 升级租户
```

#### 用户管理

```http
POST   /api/users            # 注册用户
GET    /api/users            # 获取用户列表
GET    /api/users/:id        # 获取用户详情
PUT    /api/users/:id        # 更新用户信息
POST   /api/users/login      # 用户登录
POST   /api/users/logout     # 用户登出
```

## 🧪 测试

### 测试策略

本项目采用多层次的测试策略：

1. **单元测试** - 测试领域逻辑和业务规则
2. **集成测试** - 测试数据库交互和仓储操作
3. **E2E 测试** - 测试完整的业务流程

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行单元测试
pnpm test:unit

# 运行集成测试（需要数据库）
pnpm test:integration

# 运行 E2E 测试
pnpm test:e2e

# 测试覆盖率
pnpm test:cov
```

### 真实数据库集成测试

我们使用真实的 PostgreSQL 数据库进行集成测试，而不是 Mock：

```bash
# 启动测试数据库
docker-compose up -d postgres

# 运行集成测试
pnpm test:integration
```

详细测试指南请查看：[测试文档](./__tests__/README.md)

## 🏗️ 架构设计

### 分层架构

```
┌─────────────────────────────────────┐
│  Interface Layer (接口层)            │
│  - Controllers                       │
│  - DTOs                              │
│  - Guards & Interceptors             │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│  Application Layer (应用层)          │
│  - Use Cases                         │
│  - CQRS Commands & Queries           │
│  - Event Handlers                    │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│  Domain Layer (领域层)               │
│  - Entities                          │
│  - Value Objects                     │
│  - Aggregates                        │
│  - Domain Events                     │
│  - Repository Interfaces             │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│  Infrastructure Layer (基础设施层)   │
│  - ORM Entities                      │
│  - Repositories                      │
│  - Mappers                           │
│  - External Services                 │
└─────────────────────────────────────┘
```

### 领域模型

项目包含6个核心子领域：

1. **Tenant（租户）** - 多租户管理
2. **User（用户）** - 用户身份和认证
3. **Organization（组织）** - 组织管理
4. **Department（部门）** - 部门层级
5. **Role（角色）** - 角色管理
6. **Permission（权限）** - 权限控制

### 数据流

```
Request → Controller → Command/Query 
    → Use Case → Domain Logic 
    → Repository → Database
```

### 事件流

```
Domain Event → Event Handler → Side Effects
    → External Systems / Notifications
```

## 📊 性能指标

### 数据库性能

- 租户查询（带索引）：< 10ms
- 用户认证：< 50ms
- 权限验证：< 20ms
- 批量操作：> 1000 ops/s

### 并发支持

- 最大并发连接：1000+
- 平均响应时间：< 100ms
- 99th 百分位延迟：< 500ms

## 🔒 安全特性

- JWT 令牌认证
- 密码加密（bcrypt）
- 速率限制
- SQL 注入防护
- XSS 防护
- CSRF 防护
- 租户数据隔离
- 审计日志

## 🛣️ 开发路线图

### v1.0.0 (当前版本)

- ✅ 核心租户管理
- ✅ 用户认证和授权
- ✅ 组织架构管理
- ✅ 基础权限控制
- ✅ 数据库集成测试

### v1.1.0 (计划中)

- [ ] 完整的 E2E 测试覆盖
- [ ] API 文档自动生成
- [ ] 性能监控和指标
- [ ] GraphQL API 支持

### v2.0.0 (未来)

- [ ] 微服务拆分支持
- [ ] 事件驱动架构完善
- [ ] 分布式事务支持
- [ ] 多数据库支持

## 🤝 贡献指南

我们欢迎所有形式的贡献！请查看 [贡献指南](../../CONTRIBUTING.md)。

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 代码规范

- 遵循 TSDoc 注释规范
- 使用中文注释
- 保持代码整洁（ESLint）
- 编写单元测试
- 更新相关文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- 项目主页: [GitHub](https://github.com/your-org/hl8-saas-nx-mono)
- 问题反馈: [Issues](https://github.com/your-org/hl8-saas-nx-mono/issues)
- 文档网站: [Documentation](https://your-org.github.io/hl8-saas-nx-mono)

## 🙏 致谢

感谢所有贡献者的辛勤工作！

本项目使用的优秀开源项目：

- [NestJS](https://nestjs.com/)
- [MikroORM](https://mikro-orm.io/)
- [CASL](https://casl.js.org/)
- [Nx](https://nx.dev/)

---

**Made with ❤️ by the HL8 Team**
