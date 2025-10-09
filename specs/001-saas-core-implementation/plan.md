# Implementation Plan: SAAS Core 核心业务模块实现

**Branch**: `001-saas-core-implementation` | **Date**: 2025-10-08 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-saas-core-implementation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

SAAS Core (saas-core) 是 HL8 SAAS 平台的核心业务模块，基于 @hl8/hybrid-archi 架构基础开发，遵循 Clean Architecture + DDD + CQRS + Event Sourcing + Event-Driven Architecture 混合架构模式。

本模块包含六大核心子领域：租户管理（Tenant）、组织管理（Organization）、部门管理（Department）、用户管理（User）、角色管理（Role）、权限管理（Permission），负责提供多租户数据隔离、身份认证、权限控制等基础业务能力，为人力资源、财务管理等上层业务模块提供必需的核心服务。

**技术方案**: 使用 NestJS 11+ 作为后端框架，TypeScript 5+ 作为开发语言，MikroORM 作为 ORM，PostgreSQL 作为主数据库，Redis 作为缓存。严格遵循 `docs/06-DOMAIN_LAYER_DEVELOPMENT_GUIDE.md` 的要求，实现实体与聚合根分离，聚合根作为管理者协调内部实体，实体作为被管理者执行具体业务操作。完全基于 @hl8/hybrid-archi 提供的架构组件和基础设施服务，确保架构一致性和代码复用。

## Technical Context

**Language/Version**: TypeScript 5+  
**Primary Dependencies**:

- @hl8/hybrid-archi (架构基础，必须依赖)
  - 提供架构组件：BaseAggregateRoot, TenantAwareAggregateRoot, BaseEntity, BaseValueObject, BaseDomainEvent
  - 提供通用值对象：Email, Username, Password, TenantId, UserId等
  - 提供基础设施服务：Logger, Config, Cache, Database, MultiTenancy等
- @hl8/common (通用工具，必须依赖)
  - 提供统一异常处理：AbstractHttpException, GeneralNotFoundException等
  - 提供异常过滤器：AnyExceptionFilter, HttpExceptionFilter
  - 提供错误响应格式：遵循 RFC7807 标准
- NestJS 11+ (后端框架)
- @mikro-orm/core 6+ (ORM核心)
- @mikro-orm/nestjs 6+ (NestJS集成)
- @mikro-orm/postgresql 6+ (PostgreSQL驱动)
- @casl/ability 6+ (权限管理，注意：不使用 @casl/prisma)
- class-validator 0.14+ (数据验证)
- class-transformer 0.5+ (数据转换)

**Storage**:

- PostgreSQL 16+ (主数据库，默认行级隔离)
- Redis 7+ (缓存，权限缓存/租户配置缓存)
- Event Store (事件存储，基于 PostgreSQL)

**Testing**:

- Jest (单元测试和集成测试)
- Supertest (API 测试)
- 测试覆盖率目标：核心业务逻辑 ≥ 80%，关键路径 ≥ 90%

**Target Platform**: Linux Server / Docker容器

**Project Type**: NestJS Library (packages/saas-core/)

**Performance Goals**:

- 租户数据查询响应时间 < 1秒
- 权限验证响应时间 < 100ms
- 支持 1000+ 活跃租户同时运行
- 单租户支持 10,000+ 用户

**Constraints**:

- 必须基于 @hl8/hybrid-archi 开发，不得偏离
- 必须遵循混合架构模式（Clean Architecture + DDD + CQRS + ES + EDA）
- 必须实现严格的租户数据隔离（默认行级隔离，其他级别隔离暂不考虑）
- 必须使用 @hl8/hybrid-archi 提供的基类：
  - 多租户聚合根：继承 TenantAwareAggregateRoot（提供租户验证、租户事件、租户日志）
  - 非多租户聚合根：继承 BaseAggregateRoot（如系统配置等全局聚合根）
  - 实体：继承 BaseEntity（已内置 tenantId: EntityId 字段）
  - 值对象：继承 BaseValueObject
  - 领域事件：继承 BaseDomainEvent（已内置 tenantId: EntityId 字段）
- 必须使用统一业务术语（docs/definition-of-terms.mdc）
- 所有代码注释必须使用中文，遵循 TSDoc 规范

**Scale/Scope**:

- 6个核心子领域（Tenant, Organization, Department, User, Role, Permission）
- 约 40个功能需求（FR-001 至 FR-040）
- 7个优先级用户故事（P1: 2个, P2: 3个, P3: 2个）
- 支持 5种租户类型（FREE/BASIC/PROFESSIONAL/ENTERPRISE/CUSTOM）
- 支持 8层以上部门嵌套

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 核心原则验证

#### ✅ I. 中文优先原则 (NON-NEGOTIABLE)

- **Status**: PASS
- **Evidence**: 所有技术文档、代码注释计划使用中文，遵循 TSDoc 规范
- **Action**: 确保所有代码注释、错误消息、日志使用中文

#### ✅ II. 代码即文档原则

- **Status**: PASS
- **Evidence**: 计划为所有公共 API、类、方法添加完整的 TSDoc 注释，包含业务规则和业务逻辑
- **Action**: 参考 .cursor/constitutions/code-comment-standards.md 编写注释

#### ✅ III. 混合架构模式

- **Status**: PASS
- **Evidence**: 完全基于 @hl8/hybrid-archi 开发，遵循 Clean Architecture + DDD + CQRS + ES + EDA 模式
- **Action**:
  - 严格执行实体与聚合根分离（参考 `docs/06-DOMAIN_LAYER_DEVELOPMENT_GUIDE.md`）
  - 聚合根作为管理者：使用 TenantAggregate, OrganizationAggregate, DepartmentAggregate, UserAggregate
  - 实体作为被管理者：Tenant, Organization, Department, User（内部实体）
  - 使用 BaseValueObject 实现值对象（TenantId, TenantCode, Email, Username 等）
  - 聚合根通过指令模式控制实体（方法调用指令）
  - 使用 CommandBus/QueryBus 实现 CQRS
  - 实现领域事件（UserCreatedEvent, TenantCreatedEvent 等），只由聚合根发布
  - 实现事件溯源能力（fromEvents, toSnapshot, apply）

#### ✅ IV. 多租户架构

- **Status**: PASS
- **Evidence**: 核心功能就是多租户管理，将实现租户创建、数据隔离、租户上下文管理
- **Action**:
  - 继承 TenantAwareAggregateRoot（来自 @hl8/hybrid-archi v1.1.0+）
  - TenantAwareAggregateRoot 提供：
    - ensureTenantContext()：自动验证租户上下文
    - ensureSameTenant()：验证跨实体的租户一致性
    - publishTenantEvent()：简化租户事件创建和发布
    - logTenantOperation()：记录包含租户信息的日志
  - 实现租户上下文过滤
  - 采用行级隔离策略（所有ORM实体包含tenantId字段）
  - 使用 MikroORM Global Filters 自动注入租户过滤条件

**注意**: TenantAwareAggregateRoot 继承自 BaseAggregateRoot，专为多租户SAAS应用设计。BaseEntity 提供 `tenantId: EntityId` 字段，TenantAwareAggregateRoot 提供租户业务逻辑支持（验证、事件、日志）。

#### ✅ V. Nx Monorepo 管理

- **Status**: PASS
- **Evidence**: 项目位于 packages/saas-core/，使用 Nx 管理构建和测试
- **Action**: 配置 packages/saas-core/project.json，定义 build/test/lint 任务

#### ✅ VI. 分层测试架构

- **Status**: PASS
- **Evidence**: 计划实施单元测试（就近原则）+ 集成测试（**tests**/integration/）+ E2E测试（**tests**/e2e/）
- **Action**:
  - 单元测试：与被测试文件同目录，命名 *.spec.ts
  - 集成测试：放置在 **tests**/integration/
  - 测试覆盖率：核心业务逻辑 ≥ 80%

#### ✅ VII. 事件驱动设计

- **Status**: PASS
- **Evidence**: 聚合根将发布领域事件，使用 EventBus 进行模块间通信
- **Action**:
  - 定义领域事件（TenantCreatedEvent, UserCreatedEvent, RoleAssignedEvent 等）
  - 实现事件处理器
  - 使用 @hl8/hybrid-archi 的 EventBus

#### ✅ VIII. 统一业务术语

- **Status**: PASS
- **Evidence**: 严格遵循 docs/definition-of-terms.mdc 定义的业务术语
- **Action**:
  - 使用 Platform, Tenant, Organization, Department, User, Role, Permission
  - 避免混用"组织"和"部门"
  - 代码命名与业务术语一致

### 架构约束验证

#### ✅ 统一架构基础 (NON-NEGOTIABLE)

- **Status**: PASS
- **Evidence**: 完全依赖 @hl8/hybrid-archi，使用其提供的所有基类和基础设施服务
- **Dependencies**:
  - @hl8/hybrid-archi (核心依赖)
  - packages/hybrid-archi/ (源码位置)

#### ✅ 核心业务模块定位

- **Status**: PASS
- **Evidence**: saas-core 定位为核心业务模块，为其他业务模块提供基础能力
- **Dependencies**:
  - 依赖层次：业务模块（HR/财务等）→ saas-core → hybrid-archi

### 技术栈验证

- ✅ **运行时环境**: Node.js 20+
- ✅ **编程语言**: TypeScript 5+
- ✅ **后端框架**: NestJS 11+
- ✅ **架构基础**: @hl8/hybrid-archi (必须)
- ✅ **核心业务**: @hl8/saas-core (本项目)
- ✅ **数据库**: PostgreSQL
- ✅ **ORM**: MikroORM
- ✅ **缓存**: Redis 7+
- ✅ **测试框架**: Jest

### 质量要求验证

- ✅ **ESLint检查**: 将配置 ESLint，扩展根目录配置
- ✅ **TypeScript类型检查**: strict模式
- ✅ **测试覆盖率**: 核心业务逻辑 ≥ 80%，关键路径 ≥ 90%
- ✅ **TSDoc注释**: 所有公共 API 完整注释

### 结论

**✅ 所有宪章检查通过**

项目完全符合宪章要求，可以进入 Phase 0 研究阶段。

## Project Structure

### Documentation (this feature)

```
specs/001-saas-core-implementation/
├── spec.md              # 功能规格说明
├── plan.md              # 本文件 (实施计划)
├── research.md          # Phase 0 输出 (技术研究)
├── data-model.md        # Phase 1 输出 (数据模型)
├── quickstart.md        # Phase 1 输出 (快速开始)
├── contracts/           # Phase 1 输出 (API契约)
│   ├── tenant.openapi.yaml
│   ├── user.openapi.yaml
│   ├── organization.openapi.yaml
│   ├── department.openapi.yaml
│   ├── role.openapi.yaml
│   └── permission.openapi.yaml
├── checklists/          # 质量检查清单
│   └── requirements.md
└── tasks.md             # Phase 2 输出 (/speckit.tasks 命令生成)
```

### Source Code (repository root)

```
packages/saas-core/
├── src/
│   ├── domain/                    # 领域层（纯业务逻辑，无技术依赖）
│   │   ├── tenant/                # 租户子领域
│   │   │   ├── aggregates/        # 聚合根（管理者）
│   │   │   │   ├── tenant.aggregate.ts
│   │   │   │   └── tenant.aggregate.spec.ts
│   │   │   ├── entities/          # 内部实体（被管理者）
│   │   │   │   ├── tenant.entity.ts
│   │   │   │   ├── tenant.entity.spec.ts
│   │   │   │   ├── tenant-configuration.entity.ts
│   │   │   │   └── tenant-quota.entity.ts
│   │   │   ├── value-objects/     # 值对象（saas-core特有）
│   │   │   │   ├── tenant-code.vo.ts        # 租户代码（特有）
│   │   │   │   ├── tenant-domain.vo.ts      # 租户域名（特有）
│   │   │   │   └── tenant-quota.vo.ts       # 租户配额（特有）
│   │   │   │   # 注意：TenantId, TenantStatus 从 @hl8/hybrid-archi 导入
│   │   │   ├── events/            # 领域事件
│   │   │   │   ├── tenant-created.event.ts
│   │   │   │   ├── tenant-upgraded.event.ts
│   │   │   │   └── tenant-activated.event.ts
│   │   │   ├── repositories/      # 仓储接口
│   │   │   │   └── tenant-aggregate.repository.interface.ts
│   │   │   ├── services/          # 领域服务
│   │   │   │   └── tenant-upgrade.service.ts
│   │   │   └── rules/             # 业务规则
│   │   │       └── tenant-quota.rule.ts
│   │   │
│   │   ├── organization/          # 组织子领域
│   │   │   ├── aggregates/
│   │   │   │   ├── organization.aggregate.ts
│   │   │   │   └── organization.aggregate.spec.ts
│   │   │   ├── entities/
│   │   │   │   ├── organization.entity.ts
│   │   │   │   └── organization.entity.spec.ts
│   │   │   ├── value-objects/     # 值对象（部分从hybrid-archi复用）
│   │   │   │   ├── organization-id.vo.ts     # 组织ID（特有）
│   │   │   │   └── organization-type.vo.ts   # 组织类型（特有）
│   │   │   │   # 注意：OrganizationStatus 从 @hl8/hybrid-archi 导入
│   │   │   ├── events/
│   │   │   ├── repositories/
│   │   │   └── services/
│   │   │
│   │   ├── department/            # 部门子领域
│   │   │   ├── aggregates/
│   │   │   │   ├── department.aggregate.ts
│   │   │   │   └── department.aggregate.spec.ts
│   │   │   ├── entities/
│   │   │   │   ├── department.entity.ts
│   │   │   │   ├── department.entity.spec.ts
│   │   │   │   └── department-closure.entity.ts
│   │   │   ├── value-objects/     # 值对象（saas-core特有）
│   │   │   │   ├── department-id.vo.ts       # 部门ID（特有）
│   │   │   │   ├── department-level.vo.ts    # 部门层级（特有）
│   │   │   │   ├── department-path.vo.ts     # 部门路径（特有）
│   │   │   │   └── department-status.vo.ts   # 部门状态（特有）
│   │   │   ├── events/
│   │   │   ├── repositories/
│   │   │   └── services/
│   │   │       └── department-hierarchy.service.ts
│   │   │
│   │   ├── user/                  # 用户子领域
│   │   │   ├── aggregates/
│   │   │   │   ├── user.aggregate.ts
│   │   │   │   └── user.aggregate.spec.ts
│   │   │   ├── entities/
│   │   │   │   ├── user.entity.ts
│   │   │   │   ├── user.entity.spec.ts
│   │   │   │   ├── user-profile.entity.ts
│   │   │   │   └── user-permission.entity.ts
│   │   │   ├── value-objects/     # 值对象（大部分从hybrid-archi复用）
│   │   │   │   # 注意：UserId, Email, Username, Password, UserStatus
│   │   │   │   # 都从 @hl8/hybrid-archi 导入，不需要创建
│   │   │   ├── events/
│   │   │   │   ├── user-created.event.ts
│   │   │   │   ├── user-activated.event.ts
│   │   │   │   └── user-permission-assigned.event.ts
│   │   │   ├── repositories/
│   │   │   ├── services/
│   │   │   └── rules/
│   │   │
│   │   ├── role/                  # 角色子领域
│   │   │   ├── aggregates/
│   │   │   │   ├── role.aggregate.ts
│   │   │   │   └── role.aggregate.spec.ts
│   │   │   ├── entities/
│   │   │   │   ├── role.entity.ts
│   │   │   │   └── role.entity.spec.ts
│   │   │   ├── value-objects/     # 值对象（saas-core特有）
│   │   │   │   ├── role-id.vo.ts             # 角色ID（特有）
│   │   │   │   ├── role-level.vo.ts          # 角色层级（特有）
│   │   │   │   └── role-name.vo.ts           # 角色名称（特有）
│   │   │   ├── events/
│   │   │   ├── repositories/
│   │   │   └── services/
│   │   │
│   │   └── permission/            # 权限子领域
│   │       ├── aggregates/
│   │       │   ├── permission.aggregate.ts
│   │       │   └── permission.aggregate.spec.ts
│   │       ├── entities/
│   │       │   ├── permission.entity.ts
│   │       │   └── permission.entity.spec.ts
│   │       ├── value-objects/     # 值对象（部分从hybrid-archi复用）
│   │       │   ├── permission-id.vo.ts       # 权限ID（特有）
│   │       │   └── permission-action.vo.ts   # 权限操作（特有）
│   │       │   # 注意：PermissionDefinitions 从 @hl8/hybrid-archi 导入
│   │       ├── events/
│   │       ├── repositories/
│   │       └── services/
│   │           └── permission-inheritance.service.ts
│   │
│   ├── application/               # 应用层（用例为中心，协调领域对象）
│   │   ├── use-cases/             # 用例（核心组件）
│   │   │   ├── base/
│   │   │   │   └── use-case.interface.ts
│   │   │   ├── tenant/
│   │   │   │   ├── create-tenant.use-case.ts
│   │   │   │   ├── create-tenant.use-case.spec.ts
│   │   │   │   ├── upgrade-tenant.use-case.ts
│   │   │   │   └── activate-tenant.use-case.ts
│   │   │   ├── user/
│   │   │   │   ├── create-user.use-case.ts
│   │   │   │   ├── activate-user.use-case.ts
│   │   │   │   └── assign-role.use-case.ts
│   │   │   ├── organization/
│   │   │   │   ├── create-organization.use-case.ts
│   │   │   │   └── assign-user.use-case.ts
│   │   │   └── department/
│   │   │       ├── create-department.use-case.ts
│   │   │       └── move-department.use-case.ts
│   │   │
│   │   ├── cqrs/                  # CQRS系统
│   │   │   ├── commands/          # 命令端（写操作）
│   │   │   │   ├── tenant/
│   │   │   │   │   ├── create-tenant.command.ts
│   │   │   │   │   ├── create-tenant.handler.ts
│   │   │   │   │   └── upgrade-tenant.command.ts
│   │   │   │   ├── user/
│   │   │   │   └── organization/
│   │   │   ├── queries/           # 查询端（读操作）
│   │   │   │   ├── tenant/
│   │   │   │   │   ├── get-tenant.query.ts
│   │   │   │   │   ├── get-tenant.handler.ts
│   │   │   │   │   └── list-tenants.query.ts
│   │   │   │   ├── user/
│   │   │   │   └── organization/
│   │   │   └── events/            # 事件处理器
│   │   │       ├── tenant/
│   │   │       │   ├── tenant-created.handler.ts
│   │   │       │   └── tenant-upgraded.handler.ts
│   │   │       └── user/
│   │   │
│   │   ├── ports/                 # 输出端口（依赖倒置）
│   │   │   ├── email.port.ts
│   │   │   ├── cache.port.ts
│   │   │   └── notification.port.ts
│   │   │
│   │   └── services/              # 应用服务（协调多个用例）
│   │       └── tenant-management.service.ts
│   │
│   ├── infrastructure/            # 基础设施层（技术实现，实现领域定义的接口）
│   │   ├── adapters/              # 适配器（端口实现）
│   │   │   ├── repositories/      # 仓储适配器
│   │   │   │   ├── tenant-aggregate.repository.ts
│   │   │   │   ├── tenant-aggregate.repository.spec.ts
│   │   │   │   ├── user-aggregate.repository.ts
│   │   │   │   ├── organization-aggregate.repository.ts
│   │   │   │   └── department-aggregate.repository.ts
│   │   │   ├── cache/             # 缓存适配器
│   │   │   │   ├── permission-cache.adapter.ts
│   │   │   │   └── tenant-config-cache.adapter.ts
│   │   │   └── email/             # 邮件适配器
│   │   │       └── email.adapter.ts
│   │   │
│   │   ├── event-sourcing/        # 事件溯源实现
│   │   │   ├── event-store.adapter.ts
│   │   │   ├── snapshot-store.adapter.ts
│   │   │   └── event-serializer.ts
│   │   │
│   │   ├── persistence/           # 持久化层
│   │   │   ├── entities/          # MikroORM实体（ORM关注）
│   │   │   │   ├── tenant.orm-entity.ts
│   │   │   │   ├── user.orm-entity.ts
│   │   │   │   ├── organization.orm-entity.ts
│   │   │   │   ├── department.orm-entity.ts
│   │   │   │   ├── department-closure.orm-entity.ts
│   │   │   │   ├── role.orm-entity.ts
│   │   │   │   ├── permission.orm-entity.ts
│   │   │   │   └── event-store.orm-entity.ts
│   │   │   └── migrations/        # 数据库迁移
│   │   │       └── Migration001_InitialSchema.ts
│   │   │
│   │   ├── mappers/               # 映射器（领域模型 ↔ ORM实体）
│   │   │   ├── tenant.mapper.ts
│   │   │   ├── user.mapper.ts
│   │   │   ├── organization.mapper.ts
│   │   │   └── department.mapper.ts
│   │   │
│   │   └── factories/             # 基础设施工厂
│   │       └── infrastructure.factory.ts
│   │
│   ├── interface/                 # 接口层（协议适配，安全控制）
│   │   ├── controllers/           # REST控制器
│   │   │   ├── tenant.controller.ts
│   │   │   ├── tenant.controller.spec.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── organization.controller.ts
│   │   │   ├── department.controller.ts
│   │   │   ├── role.controller.ts
│   │   │   └── permission.controller.ts
│   │   │
│   │   ├── dtos/                  # 数据传输对象
│   │   │   ├── tenant/
│   │   │   │   ├── create-tenant.dto.ts
│   │   │   │   ├── update-tenant.dto.ts
│   │   │   │   ├── tenant-response.dto.ts
│   │   │   │   └── tenant-list-response.dto.ts
│   │   │   ├── user/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   ├── user-response.dto.ts
│   │   │   │   └── authenticate-user.dto.ts
│   │   │   └── organization/
│   │   │       ├── create-organization.dto.ts
│   │   │       └── organization-response.dto.ts
│   │   │
│   │   # 注意：guards/、decorators/、middleware/、pipes/ 大部分组件
│   │   # 已由 @hl8/hybrid-archi 提供，saas-core 直接导入使用即可
│   │   # 
│   │   # ✅ 使用 @hl8/hybrid-archi 提供的组件：
│   │   #   - JwtAuthGuard, TenantIsolationGuard, PermissionGuard
│   │   #   - @CurrentUser(), @TenantContext(), @RequirePermissions()
│   │   #   - LoggingMiddleware, TenantContextMiddleware, PerformanceMiddleware
│   │   #   - ValidationPipe
│   │   # 
│   │   # ✅ 使用 @hl8/common 提供的异常处理：
│   │   #   - AnyExceptionFilter
│   │   # 
│   │   # ⏳ saas-core 只需创建特定的守卫/装饰器（如需要）：
│   │   #   - rate-limit.guard.ts（可选，建议移到 hybrid-archi）
│   │
│   ├── constants/                 # 常量管理（按领域分类）
│   │   ├── index.ts               # 统一导出
│   │   ├── tenant.constants.ts    # 租户相关常量
│   │   ├── user.constants.ts      # 用户相关常量
│   │   ├── organization.constants.ts  # 组织相关常量
│   │   ├── department.constants.ts    # 部门相关常量
│   │   ├── role.constants.ts      # 角色相关常量
│   │   ├── permission.constants.ts    # 权限相关常量
│   │   └── common.constants.ts    # 通用常量
│   │
│   ├── saas-core.module.ts        # 主模块
│   └── index.ts                   # 导出接口
│   
│   # 注意：不需要创建 exceptions/ 目录
│   # 统一使用 @hl8/common/exceptions 提供的异常处理机制
│
├── __tests__/
│   ├── integration/               # 集成测试
│   │   ├── tenant-management.integration.spec.ts
│   │   ├── user-management.integration.spec.ts
│   │   └── permission-check.integration.spec.ts
│   │
│   └── e2e/                       # 端到端测试
│       └── saas-core.e2e.spec.ts
│
├── docs/                          # 文档
│   ├── mikroorm-casl-integration.md
│   └── README.md
│
├── project.json                   # Nx 项目配置
├── tsconfig.json                  # TypeScript 配置
├── tsconfig.lib.json
├── tsconfig.spec.json
├── jest.config.ts                 # Jest 配置
├── package.json                   # 依赖配置
└── README.md                      # 项目说明
```

**Structure Decision**:

选择 NestJS 库项目结构，位于 `packages/saas-core/`。

理由：

1. **Monorepo 管理**: 使用 Nx monorepo 管理，与其他包（hybrid-archi）平级
2. **Clean Architecture 分层**: 严格遵循四层架构（domain/application/infrastructure/interface）
3. **DDD 领域划分**: 按子领域组织代码（tenant/user/organization/department/role/permission）
4. **实体与聚合根分离**:
   - aggregates/ 目录：存放聚合根（管理者），负责协调内部实体、发布事件、管理一致性边界
   - entities/ 目录：存放内部实体（被管理者），负责执行具体业务操作、维护自身状态
   - 聚合根通过指令模式控制内部实体
   - 只有聚合根通过仓储进行持久化
5. **领域模型纯净**:
   - 领域层（domain/）完全不依赖技术框架（MikroORM、NestJS等）
   - 值对象、实体、聚合根都是纯TypeScript类
   - 持久化逻辑完全在 infrastructure/persistence/ 中
6. **测试分离**:
   - 单元测试就近放置（*.spec.ts）
   - 集成测试统一在 `__tests__/integration/`
   - 端到端测试在 `__tests__/e2e/`
7. **扩展性**: 每个子领域独立，便于后续微服务拆分

### 关键设计决策

**领域层组织**（参考 `docs/06-DOMAIN_LAYER_DEVELOPMENT_GUIDE.md`）：

- 每个子领域包含：aggregates（聚合根）+ entities（实体）+ value-objects（值对象）
- 聚合根管理一致性边界，实体执行具体业务
- 领域事件只由聚合根发布
- 仓储接口定义在domain，实现在infrastructure

**值对象复用策略**（参考 `packages/hybrid-archi/src/domain/value-objects/`）：

- **优先复用 hybrid-archi 提供的通用值对象**：
  - Email, Username, Password（身份相关）
  - TenantId, UserId, EntityId（ID相关）
  - TenantStatus, UserStatus, OrganizationStatus（状态相关）
  - PasswordPolicy, MfaType, AuditEventType, PermissionDefinitions（安全审计相关）
- **按需创建 saas-core 特定值对象**：
  - TenantCode, TenantDomain, TenantQuota（租户特定）
  - OrganizationType（组织特定）
  - DepartmentLevel, DepartmentPath（部门特定）
  - RoleLevel, RoleName（角色特定）

**异常处理策略**（参考 `packages/common/src/exceptions/`）：

- **使用 @hl8/common 提供的统一异常**：
  - GeneralNotFoundException（所有资源未找到场景）
  - GeneralBadRequestException（所有输入验证失败、业务规则违反场景）
  - GeneralInternalServerException（所有系统错误场景）
  - AnyExceptionFilter（全局异常过滤器）
- **不创建自定义异常类**：
  - 不创建 TenantNotFoundException、UserNotFoundException 等
  - 通过 detail 和 metadata 参数传递具体错误信息

**常量集中管理策略**（参考 TypeScript const assertions）：

- **按领域分类管理常量**：
  - constants/tenant.constants.ts（租户配额、规则）
  - constants/user.constants.ts（用户验证规则、会话配置）
  - constants/organization.constants.ts（组织规则）
  - constants/department.constants.ts（部门层级限制）
  - constants/role.constants.ts（角色规则）
  - constants/permission.constants.ts（权限定义）
  - constants/common.constants.ts（缓存TTL、分页、API配置）
- **使用 TypeScript const assertions**：
  - 所有常量对象使用 `as const` 确保不可变性
  - 避免硬编码魔法数字和字符串
  - 提供类型安全和自动完成支持
- **应用场景**：
  - 值对象验证（长度、格式、范围）
  - DTO验证装饰器参数
  - 业务规则判断（配额检查、权限判断）
  - 缓存配置（TTL、键前缀）

**应用层组织**（参考 `docs/07-APPLICATION_LAYER_DEVELOPMENT_GUIDE.md`）：

- use-cases/: 用例服务（每个用例对应一个业务场景，单一职责）
- cqrs/commands/: 命令处理器（写操作，委托给用例执行）
- cqrs/queries/: 查询处理器（读操作，优化查询性能）
- cqrs/events/: 事件处理器（异步处理，事件驱动）
- ports/: 输出端口（依赖倒置，定义外部服务接口）

**基础设施层组织**（参考 `docs/08-INFRASTRUCTURE_LAYER_DEVELOPMENT_GUIDE.md`）：

- adapters/repositories/: 仓储适配器（实现领域仓储接口）
- adapters/cache/: 缓存适配器（实现缓存端口）
- persistence/entities/: MikroORM实体（ORM关注，与领域模型分离）
- mappers/: 映射器（领域模型 ↔ ORM实体双向转换）
- event-sourcing/: 事件存储和快照实现
- factories/: 基础设施工厂（统一创建基础设施组件）

**接口层组织**（参考 `docs/09-INTERFACE_LAYER_DEVELOPMENT_GUIDE.md`）：

- controllers/: REST控制器（HTTP协议适配，调用用例或发送命令/查询）
- dtos/: 数据传输对象（请求验证和响应格式化）

**✅ 守卫（Guards）- 使用 @hl8/hybrid-archi 提供的通用守卫**：

- `JwtAuthGuard` - JWT认证验证
- `TenantIsolationGuard` (TenantGuard) - 租户上下文验证和设置
- `PermissionGuard` - 基于CASL的权限验证
- ⏳ rate-limit.guard.ts - API限流（saas-core特有，可选移到 hybrid-archi）

**✅ 装饰器（Decorators）- 使用 @hl8/hybrid-archi 提供的通用装饰器**：

- `@CurrentUser()` - 获取当前用户
- `@CurrentTenant()` 或 `@TenantContext()` - 获取租户上下文
- `@RequirePermissions()` - 声明式权限控制
- ⏳ @ApiPagination() - API分页（需验证是否已提供）

**✅ 中间件（Middleware）- 使用 @hl8/hybrid-archi 提供的通用中间件**：

- `LoggingMiddleware` - 请求日志记录
- `TenantContextMiddleware` - 租户上下文设置（✨ v1.1.0+ 新增）
- `PerformanceMiddleware` - 性能监控（✨ v1.1.0+ 完善）

**✅ 管道（Pipes）- 使用 @hl8/hybrid-archi 提供的通用管道**：

- `ValidationPipe` - 数据验证和转换

**✅ 异常过滤器 - 使用 @hl8/common 提供的统一异常处理**：

- `AnyExceptionFilter` - 全局异常过滤器
- 注意：不在 saas-core 中创建 filters/ 目录

## Complexity Tracking

*项目无宪章违规，此部分留空*

---

## Phase 0: Research & Technology Decisions

*请参见 [research.md](./research.md) 获取详细的技术研究和决策记录*

### 研究任务列表

**领域层研究（Domain Layer）**：

1. **实体与聚合根分离**: 如何正确实现管理者模式和指令模式
2. **MikroORM 与领域模型集成**: 如何保持领域模型纯净性同时使用 ORM

**权限和安全研究**：
3. **CASL 权限库集成**: 如何与 @hl8/hybrid-archi 的权限系统集成
4. **租户数据隔离实现**: 行级隔离和 Schema级隔离的最佳实践

**事件溯源和查询优化研究**：
5. **事件溯源与 MikroORM**: 如何在 MikroORM 环境下实现事件溯源
6. **多层级部门查询优化**: 8层以上部门嵌套的查询性能优化方案

**租户和权限管理研究**：
7. **用户多租户上下文切换**: 如何实现租户上下文的切换和管理
8. **角色权限继承机制**: 如何实现多层级角色的权限继承
9. **租户配额检查机制**: 如何高效检查和管理资源配额
10. **租户类型和配置管理**: 如何灵活管理租户配置

**应用层研究（Application Layer）**：
11. **用例为中心设计**: 如何实现以用例为中心的应用层
12. **CQRS模式实现**: 如何实现命令、查询、事件的分离处理

**基础设施层研究（Infrastructure Layer）**：
13. **适配器模式实现**: 如何使用适配器隔离外部依赖
14. **映射器模式**: 如何实现领域模型与ORM实体的双向转换

**接口层研究（Interface Layer）**：
15. **REST控制器设计**: 如何设计安全、高效的API接口
16. **安全控制实现**: 如何使用守卫、装饰器、中间件实现安全控制

**通用组件复用**：
17. **值对象复用策略**: 哪些值对象可复用 hybrid-archi，哪些需要创建
18. **异常处理复用**: 如何使用 @hl8/common 提供的统一异常处理机制
19. **常量集中管理**: 如何按领域分类管理常量，避免硬编码

---

## Phase 1: Data Model & API Contracts

*请参见以下文档获取详细的设计信息*

- **数据模型**: [data-model.md](./data-model.md)
- **API 契约**: [contracts/](./contracts/)
- **快速开始**: [quickstart.md](./quickstart.md)

---

## Phase 2: Task Breakdown

*将通过 `/speckit.tasks` 命令生成，参见 [tasks.md](./tasks.md)*

---

## Next Steps

1. ✅ **Phase 0 完成**: 技术研究和决策
2. ⏭️ **Phase 1 进行中**: 数据模型和 API 契约设计
3. ⏱️ **Phase 2 待开始**: 任务分解（使用 `/speckit.tasks` 命令）
4. ⏱️ **Phase 3 待开始**: 实施开发（使用 `/speckit.implement` 命令）

**当前状态**: 准备进入 Phase 0 研究阶段

**下一个命令**: 继续阅读 research.md, data-model.md, quickstart.md 和 contracts/ 以了解详细设计
