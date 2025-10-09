# Tasks: SAAS Core 核心业务模块实现

**Input**: Design documents from `/specs/001-saas-core-implementation/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/

**Tests**: 本项目不包含测试任务（按照规范，测试是可选的，未在spec.md中明确要求）

**Organization**: 任务按用户故事分组，每个故事可独立实现和测试

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 任务所属用户故事（US1, US2, US3等）
- 包含精确的文件路径

## Path Conventions

- **Project Root**: `packages/saas-core/`
- **Domain Layer**: `packages/saas-core/src/domain/`
- **Application Layer**: `packages/saas-core/src/application/`
- **Infrastructure Layer**: `packages/saas-core/src/infrastructure/`
- **Interface Layer**: `packages/saas-core/src/interface/`

---

## Phase 1: Setup (共享基础设施)

**Purpose**: 项目初始化和基础结构搭建

- [X] T001 创建 saas-core 项目结构（按 plan.md 定义的目录结构）
- [X] T002 初始化 NestJS 项目配置（packages/saas-core/package.json）
- [X] T003 [P] 配置 TypeScript（packages/saas-core/tsconfig.json, tsconfig.lib.json, tsconfig.spec.json）
- [X] T004 [P] 配置 Jest 测试框架（packages/saas-core/jest.config.ts）
- [X] T005 [P] 配置 Nx 项目（packages/saas-core/project.json）
- [X] T006 [P] 配置 ESLint（packages/saas-core/.eslintrc.json，扩展根配置）
- [X] T007 添加依赖包（@hl8/hybrid-archi, @hl8/common, NestJS, MikroORM, CASL等）

---

## Phase 2: Foundational (阻塞前置条件)

**Purpose**: 核心基础设施，必须在任何用户故事之前完成

**⚠️ CRITICAL**: 在此阶段完成前，不能开始任何用户故事的实现

### 常量定义（按领域分类）

- [X] T008 [P] 创建租户常量（packages/saas-core/src/constants/tenant.constants.ts）
- [X] T009 [P] 创建用户常量（packages/saas-core/src/constants/user.constants.ts）
- [X] T010 [P] 创建组织常量（packages/saas-core/src/constants/organization.constants.ts）
- [X] T011 [P] 创建部门常量（packages/saas-core/src/constants/department.constants.ts）
- [X] T012 [P] 创建角色常量（packages/saas-core/src/constants/role.constants.ts）
- [X] T013 [P] 创建权限常量（packages/saas-core/src/constants/permission.constants.ts）
- [X] T014 [P] 创建通用常量（packages/saas-core/src/constants/common.constants.ts）
- [X] T015 创建常量统一导出（packages/saas-core/src/constants/index.ts）

### 值对象（复用 hybrid-archi 和创建特定值对象）

- [X] T016 [P] 创建 TenantCode 值对象（packages/saas-core/src/domain/tenant/value-objects/tenant-code.vo.ts）
- [X] T017 [P] 创建 TenantDomain 值对象（packages/saas-core/src/domain/tenant/value-objects/tenant-domain.vo.ts）
- [X] T018 [P] 创建 TenantQuota 值对象（packages/saas-core/src/domain/tenant/value-objects/tenant-quota.vo.ts）
- [X] T019 [P] 创建 OrganizationType 值对象（packages/saas-core/src/domain/organization/value-objects/organization-type.vo.ts）
- [X] T020 [P] 创建 DepartmentLevel 值对象（packages/saas-core/src/domain/department/value-objects/department-level.vo.ts）
- [X] T021 [P] 创建 DepartmentPath 值对象（packages/saas-core/src/domain/department/value-objects/department-path.vo.ts）
- [X] T022 [P] 创建 RoleLevel 值对象（packages/saas-core/src/domain/role/value-objects/role-level.vo.ts）
- [X] T023 [P] 创建 RoleName 值对象（packages/saas-core/src/domain/role/value-objects/role-name.vo.ts）
- [X] T024 [P] 创建 PermissionAction 值对象（packages/saas-core/src/domain/permission/value-objects/permission-action.vo.ts）

### 枚举定义

- [X] T025 [P] 创建 TenantType 枚举（packages/saas-core/src/domain/tenant/value-objects/tenant-type.enum.ts）
- [X] T026 [P] 创建 Gender 枚举（packages/saas-core/src/domain/user/value-objects/gender.enum.ts）
- [X] T027 [P] 创建 DepartmentStatus 枚举（packages/saas-core/src/domain/department/value-objects/department-status.enum.ts）
- [X] T028 [P] 创建 RoleStatus 枚举（packages/saas-core/src/domain/role/value-objects/role-status.enum.ts）
- [X] T029 [P] 创建 PermissionStatus 枚举（packages/saas-core/src/domain/permission/value-objects/permission-status.enum.ts）

### MikroORM 配置和基础设施

- [ ] T030 配置 MikroORM（packages/saas-core/src/infrastructure/persistence/mikro-orm.config.ts）
- [ ] T031 创建租户过滤器（packages/saas-core/src/infrastructure/persistence/filters/tenant.filter.ts）
- [ ] T032 创建事件存储基础（packages/saas-core/src/infrastructure/event-sourcing/event-store.adapter.ts）
- [ ] T033 创建快照存储基础（packages/saas-core/src/infrastructure/event-sourcing/snapshot-store.adapter.ts）

### 主模块配置

- [ ] T034 创建 SAAS Core 主模块（packages/saas-core/src/saas-core.module.ts）
- [ ] T035 创建模块导出（packages/saas-core/src/index.ts）

**Checkpoint**: 基础设施完成 - 用户故事实现现在可以并行开始

---

## Phase 3: User Story 1 - 租户管理核心功能 (Priority: P1) 🎯 MVP

**Goal**: 实现租户的创建、配置、状态管理和配额管理，支持5种租户类型

**Independent Test**:

- 创建一个免费租户，验证默认配置（5用户/100MB/1组织）
- 查看租户详情，验证信息完整
- 达到用户配额限制时被拒绝
- 升级租户类型，验证配额更新

### 领域层 - Tenant 子领域

- [ ] T036 [P] [US1] 创建 Tenant 实体（packages/saas-core/src/domain/tenant/entities/tenant.entity.ts）
- [ ] T037 [P] [US1] 创建 Tenant 实体单元测试（packages/saas-core/src/domain/tenant/entities/tenant.entity.spec.ts）
- [ ] T038 [P] [US1] 创建 TenantConfiguration 实体（packages/saas-core/src/domain/tenant/entities/tenant-configuration.entity.ts）
- [ ] T039 [P] [US1] 创建 TenantQuota 实体（packages/saas-core/src/domain/tenant/entities/tenant-quota.entity.ts）
- [ ] T040 [US1] 创建 TenantAggregate 聚合根（packages/saas-core/src/domain/tenant/aggregates/tenant.aggregate.ts）
- [ ] T041 [US1] 创建 TenantAggregate 单元测试（packages/saas-core/src/domain/tenant/aggregates/tenant.aggregate.spec.ts）
- [ ] T042 [P] [US1] 创建租户领域事件（packages/saas-core/src/domain/tenant/events/）
  - TenantCreatedEvent, TenantActivatedEvent, TenantSuspendedEvent, TenantUpgradedEvent, TenantDeletedEvent
- [ ] T043 [P] [US1] 创建租户仓储接口（packages/saas-core/src/domain/tenant/repositories/tenant-aggregate.repository.interface.ts）
- [ ] T044 [P] [US1] 创建租户配额业务规则（packages/saas-core/src/domain/tenant/rules/tenant-quota.rule.ts）
- [ ] T045 [P] [US1] 创建租户升级领域服务（packages/saas-core/src/domain/tenant/services/tenant-upgrade.service.ts）

### 应用层 - Tenant 用例

- [ ] T046 [P] [US1] 创建用例接口（packages/saas-core/src/application/use-cases/base/use-case.interface.ts）
- [ ] T047 [P] [US1] 创建创建租户用例（packages/saas-core/src/application/use-cases/tenant/create-tenant.use-case.ts）
- [ ] T048 [P] [US1] 创建创建租户用例测试（packages/saas-core/src/application/use-cases/tenant/create-tenant.use-case.spec.ts）
- [ ] T049 [P] [US1] 创建升级租户用例（packages/saas-core/src/application/use-cases/tenant/upgrade-tenant.use-case.ts）
- [ ] T050 [P] [US1] 创建激活租户用例（packages/saas-core/src/application/use-cases/tenant/activate-tenant.use-case.ts）

### CQRS - Tenant 命令和查询

- [ ] T051 [P] [US1] 创建创建租户命令（packages/saas-core/src/application/cqrs/commands/tenant/create-tenant.command.ts）
- [ ] T052 [P] [US1] 创建创建租户命令处理器（packages/saas-core/src/application/cqrs/commands/tenant/create-tenant.handler.ts）
- [ ] T053 [P] [US1] 创建升级租户命令（packages/saas-core/src/application/cqrs/commands/tenant/upgrade-tenant.command.ts）
- [ ] T054 [P] [US1] 创建升级租户命令处理器（packages/saas-core/src/application/cqrs/commands/tenant/upgrade-tenant.handler.ts）
- [ ] T055 [P] [US1] 创建获取租户查询（packages/saas-core/src/application/cqrs/queries/tenant/get-tenant.query.ts）
- [ ] T056 [P] [US1] 创建获取租户查询处理器（packages/saas-core/src/application/cqrs/queries/tenant/get-tenant.handler.ts）
- [ ] T057 [P] [US1] 创建列表租户查询（packages/saas-core/src/application/cqrs/queries/tenant/list-tenants.query.ts）
- [ ] T058 [P] [US1] 创建列表租户查询处理器（packages/saas-core/src/application/cqrs/queries/tenant/list-tenants.handler.ts）
- [ ] T059 [P] [US1] 创建租户创建事件处理器（packages/saas-core/src/application/cqrs/events/tenant/tenant-created.handler.ts）
- [ ] T060 [P] [US1] 创建租户升级事件处理器（packages/saas-core/src/application/cqrs/events/tenant/tenant-upgraded.handler.ts）

### 基础设施层 - Tenant 持久化

- [ ] T061 [P] [US1] 创建 Tenant ORM实体（packages/saas-core/src/infrastructure/persistence/entities/tenant.orm-entity.ts）
- [ ] T062 [P] [US1] 创建 TenantConfiguration ORM实体（packages/saas-core/src/infrastructure/persistence/entities/tenant-configuration.orm-entity.ts）
- [ ] T063 [US1] 创建租户映射器（packages/saas-core/src/infrastructure/mappers/tenant.mapper.ts）
- [ ] T064 [US1] 创建租户仓储适配器（packages/saas-core/src/infrastructure/adapters/repositories/tenant-aggregate.repository.ts）
- [ ] T065 [US1] 创建租户仓储适配器测试（packages/saas-core/src/infrastructure/adapters/repositories/tenant-aggregate.repository.spec.ts）
- [ ] T066 [P] [US1] 创建租户配置缓存适配器（packages/saas-core/src/infrastructure/adapters/cache/tenant-config-cache.adapter.ts）
- [ ] T067 [US1] 创建初始化数据库迁移（packages/saas-core/src/infrastructure/persistence/migrations/Migration001_InitialSchema.ts）

### 接口层 - Tenant API

- [ ] T068 [P] [US1] 创建创建租户DTO（packages/saas-core/src/interface/dtos/tenant/create-tenant.dto.ts）
- [ ] T069 [P] [US1] 创建更新租户DTO（packages/saas-core/src/interface/dtos/tenant/update-tenant.dto.ts）
- [ ] T070 [P] [US1] 创建租户响应DTO（packages/saas-core/src/interface/dtos/tenant/tenant-response.dto.ts）
- [ ] T071 [P] [US1] 创建租户列表响应DTO（packages/saas-core/src/interface/dtos/tenant/tenant-list-response.dto.ts）
- [ ] T072 [US1] 创建租户控制器（packages/saas-core/src/interface/controllers/tenant.controller.ts）
- [ ] T073 [US1] 创建租户控制器测试（packages/saas-core/src/interface/controllers/tenant.controller.spec.ts）

**Checkpoint**: User Story 1 完成 - 租户管理功能可独立测试和部署（MVP可交付）

---

## Phase 4: User Story 2 - 用户身份和认证 (Priority: P1)

**Goal**: 实现用户注册、邮箱验证、登录认证、个人信息管理

**Independent Test**:

- 注册新用户，验证邮箱验证流程
- 登录用户，验证JWT令牌生成
- 修改个人信息，验证更新成功
- 用户可创建租户并成为租户管理员

### 领域层 - User 子领域

- [ ] T074 [P] [US2] 创建 User 实体（packages/saas-core/src/domain/user/entities/user.entity.ts）
- [ ] T075 [P] [US2] 创建 User 实体单元测试（packages/saas-core/src/domain/user/entities/user.entity.spec.ts）
- [ ] T076 [P] [US2] 创建 UserProfile 实体（packages/saas-core/src/domain/user/entities/user-profile.entity.ts）
- [ ] T077 [P] [US2] 创建 UserCredentials 实体（packages/saas-core/src/domain/user/entities/user-credentials.entity.ts）
- [ ] T078 [US2] 创建 UserAggregate 聚合根（packages/saas-core/src/domain/user/aggregates/user.aggregate.ts）
- [ ] T079 [US2] 创建 UserAggregate 单元测试（packages/saas-core/src/domain/user/aggregates/user.aggregate.spec.ts）
- [ ] T080 [P] [US2] 创建用户领域事件（packages/saas-core/src/domain/user/events/）
  - UserRegisteredEvent, UserActivatedEvent, UserDisabledEvent, UserPasswordChangedEvent, UserLoginEvent
- [ ] T081 [P] [US2] 创建用户仓储接口（packages/saas-core/src/domain/user/repositories/user-aggregate.repository.interface.ts）

### 应用层 - User 用例

- [ ] T082 [P] [US2] 创建注册用户用例（packages/saas-core/src/application/use-cases/user/register-user.use-case.ts）
- [ ] T083 [P] [US2] 创建激活用户用例（packages/saas-core/src/application/use-cases/user/activate-user.use-case.ts）
- [ ] T084 [P] [US2] 创建用户登录用例（packages/saas-core/src/application/use-cases/user/login-user.use-case.ts）
- [ ] T085 [P] [US2] 创建修改密码用例（packages/saas-core/src/application/use-cases/user/change-password.use-case.ts）
- [ ] T086 [P] [US2] 创建更新用户信息用例（packages/saas-core/src/application/use-cases/user/update-profile.use-case.ts）

### CQRS - User 命令和查询

- [ ] T087 [P] [US2] 创建注册用户命令及处理器（packages/saas-core/src/application/cqrs/commands/user/register-user.*）
- [ ] T088 [P] [US2] 创建激活用户命令及处理器（packages/saas-core/src/application/cqrs/commands/user/activate-user.*）
- [ ] T089 [P] [US2] 创建用户登录命令及处理器（packages/saas-core/src/application/cqrs/commands/user/login-user.*）
- [ ] T090 [P] [US2] 创建获取用户查询及处理器（packages/saas-core/src/application/cqrs/queries/user/get-user.*）
- [ ] T091 [P] [US2] 创建用户注册事件处理器（packages/saas-core/src/application/cqrs/events/user/user-registered.handler.ts）
- [ ] T092 [P] [US2] 创建用户登录事件处理器（packages/saas-core/src/application/cqrs/events/user/user-login.handler.ts）

### 基础设施层 - User 持久化

- [ ] T093 [P] [US2] 创建 User ORM实体（packages/saas-core/src/infrastructure/persistence/entities/user.orm-entity.ts）
- [ ] T094 [P] [US2] 创建 UserProfile ORM实体（packages/saas-core/src/infrastructure/persistence/entities/user-profile.orm-entity.ts）
- [ ] T095 [P] [US2] 创建 UserCredentials ORM实体（packages/saas-core/src/infrastructure/persistence/entities/user-credentials.orm-entity.ts）
- [ ] T096 [US2] 创建用户映射器（packages/saas-core/src/infrastructure/mappers/user.mapper.ts）
- [ ] T097 [US2] 创建用户仓储适配器（packages/saas-core/src/infrastructure/adapters/repositories/user-aggregate.repository.ts）
- [ ] T098 [P] [US2] 创建邮件适配器（packages/saas-core/src/infrastructure/adapters/email/email.adapter.ts）

### 接口层 - User API

- [ ] T099 [P] [US2] 创建注册用户DTO（packages/saas-core/src/interface/dtos/user/register-user.dto.ts）
- [ ] T100 [P] [US2] 创建登录用户DTO（packages/saas-core/src/interface/dtos/user/login-user.dto.ts）
- [ ] T101 [P] [US2] 创建用户响应DTO（packages/saas-core/src/interface/dtos/user/user-response.dto.ts）
- [ ] T102 [P] [US2] 创建更新用户DTO（packages/saas-core/src/interface/dtos/user/update-user.dto.ts）
- [ ] T103 [US2] 创建用户控制器（packages/saas-core/src/interface/controllers/user.controller.ts）
- [ ] T104 [US2] 创建用户控制器测试（packages/saas-core/src/interface/controllers/user.controller.spec.ts）

**Checkpoint**: User Story 2 完成 - 用户身份和认证功能可独立测试

---

## Phase 5: User Story 3 - 组织架构管理 (Priority: P2)

**Goal**: 实现组织和部门的创建、层级管理、成员分配

**Independent Test**:

- 在已有租户基础上创建组织
- 创建多级部门结构（至少3级）
- 分配用户到组织和部门
- 验证部门层级关系正确

### 领域层 - Organization 子领域

- [ ] T105 [P] [US3] 创建 Organization 实体（packages/saas-core/src/domain/organization/entities/organization.entity.ts）
- [ ] T106 [P] [US3] 创建 Organization 实体测试（packages/saas-core/src/domain/organization/entities/organization.entity.spec.ts）
- [ ] T107 [P] [US3] 创建 OrganizationMember 实体（packages/saas-core/src/domain/organization/entities/organization-member.entity.ts）
- [ ] T108 [US3] 创建 OrganizationAggregate 聚合根（packages/saas-core/src/domain/organization/aggregates/organization.aggregate.ts）
- [ ] T109 [US3] 创建 OrganizationAggregate 测试（packages/saas-core/src/domain/organization/aggregates/organization.aggregate.spec.ts）
- [ ] T110 [P] [US3] 创建组织领域事件（packages/saas-core/src/domain/organization/events/）
- [ ] T111 [P] [US3] 创建组织仓储接口（packages/saas-core/src/domain/organization/repositories/organization-aggregate.repository.interface.ts）

### 领域层 - Department 子领域

- [ ] T112 [P] [US3] 创建 Department 实体（packages/saas-core/src/domain/department/entities/department.entity.ts）
- [ ] T113 [P] [US3] 创建 Department 实体测试（packages/saas-core/src/domain/department/entities/department.entity.spec.ts）
- [ ] T114 [P] [US3] 创建 DepartmentClosure 实体（packages/saas-core/src/domain/department/entities/department-closure.entity.ts）
- [ ] T115 [P] [US3] 创建 DepartmentMember 实体（packages/saas-core/src/domain/department/entities/department-member.entity.ts）
- [ ] T116 [US3] 创建 DepartmentAggregate 聚合根（packages/saas-core/src/domain/department/aggregates/department.aggregate.ts）
- [ ] T117 [US3] 创建 DepartmentAggregate 测试（packages/saas-core/src/domain/department/aggregates/department.aggregate.spec.ts）
- [ ] T118 [P] [US3] 创建部门领域事件（packages/saas-core/src/domain/department/events/）
- [ ] T119 [P] [US3] 创建部门仓储接口（packages/saas-core/src/domain/department/repositories/department-aggregate.repository.interface.ts）
- [ ] T120 [P] [US3] 创建部门层级管理服务（packages/saas-core/src/domain/department/services/department-hierarchy.service.ts）

### 应用层 - Organization 用例

- [ ] T121 [P] [US3] 创建创建组织用例（packages/saas-core/src/application/use-cases/organization/create-organization.use-case.ts）
- [ ] T122 [P] [US3] 创建分配用户到组织用例（packages/saas-core/src/application/use-cases/organization/assign-user.use-case.ts）
- [ ] T123 [P] [US3] 创建移除组织成员用例（packages/saas-core/src/application/use-cases/organization/remove-member.use-case.ts）

### 应用层 - Department 用例

- [ ] T124 [P] [US3] 创建创建部门用例（packages/saas-core/src/application/use-cases/department/create-department.use-case.ts）
- [ ] T125 [P] [US3] 创建移动部门用例（packages/saas-core/src/application/use-cases/department/move-department.use-case.ts）
- [ ] T126 [P] [US3] 创建分配用户到部门用例（packages/saas-core/src/application/use-cases/department/assign-user.use-case.ts）

### CQRS - Organization & Department

- [ ] T127 [P] [US3] 创建组织命令及处理器（packages/saas-core/src/application/cqrs/commands/organization/）
- [ ] T128 [P] [US3] 创建组织查询及处理器（packages/saas-core/src/application/cqrs/queries/organization/）
- [ ] T129 [P] [US3] 创建部门命令及处理器（packages/saas-core/src/application/cqrs/commands/department/）
- [ ] T130 [P] [US3] 创建部门查询及处理器（packages/saas-core/src/application/cqrs/queries/department/）

### 基础设施层 - Organization & Department 持久化

- [ ] T131 [P] [US3] 创建 Organization ORM实体（packages/saas-core/src/infrastructure/persistence/entities/organization.orm-entity.ts）
- [ ] T132 [P] [US3] 创建 Department ORM实体（packages/saas-core/src/infrastructure/persistence/entities/department.orm-entity.ts）
- [ ] T133 [P] [US3] 创建 DepartmentClosure ORM实体（packages/saas-core/src/infrastructure/persistence/entities/department-closure.orm-entity.ts）
- [ ] T134 [US3] 创建组织映射器（packages/saas-core/src/infrastructure/mappers/organization.mapper.ts）
- [ ] T135 [US3] 创建部门映射器（packages/saas-core/src/infrastructure/mappers/department.mapper.ts）
- [ ] T136 [US3] 创建组织仓储适配器（packages/saas-core/src/infrastructure/adapters/repositories/organization-aggregate.repository.ts）
- [ ] T137 [US3] 创建部门仓储适配器（packages/saas-core/src/infrastructure/adapters/repositories/department-aggregate.repository.ts）

### 接口层 - Organization & Department API

- [ ] T138 [P] [US3] 创建组织DTOs（packages/saas-core/src/interface/dtos/organization/）
- [ ] T139 [P] [US3] 创建部门DTOs（packages/saas-core/src/interface/dtos/department/）
- [ ] T140 [US3] 创建组织控制器（packages/saas-core/src/interface/controllers/organization.controller.ts）
- [ ] T141 [US3] 创建部门控制器（packages/saas-core/src/interface/controllers/department.controller.ts）

**Checkpoint**: User Story 3 完成 - 组织架构管理功能可独立测试

---

## Phase 6: User Story 4 - 角色和权限管理 (Priority: P2)

**Goal**: 实现角色定义、权限分配、权限验证

**Independent Test**:

- 创建角色（如部门经理）
- 为角色分配权限
- 将角色赋予用户
- 验证用户执行操作时的权限检查

### 领域层 - Role 子领域

- [ ] T142 [P] [US4] 创建 Role 实体（packages/saas-core/src/domain/role/entities/role.entity.ts）
- [ ] T143 [P] [US4] 创建 Role 实体测试（packages/saas-core/src/domain/role/entities/role.entity.spec.ts）
- [ ] T144 [P] [US4] 创建 RolePermission 实体（packages/saas-core/src/domain/role/entities/role-permission.entity.ts）
- [ ] T145 [US4] 创建 RoleAggregate 聚合根（packages/saas-core/src/domain/role/aggregates/role.aggregate.ts）
- [ ] T146 [US4] 创建 RoleAggregate 测试（packages/saas-core/src/domain/role/aggregates/role.aggregate.spec.ts）
- [ ] T147 [P] [US4] 创建角色领域事件（packages/saas-core/src/domain/role/events/）
- [ ] T148 [P] [US4] 创建角色仓储接口（packages/saas-core/src/domain/role/repositories/role-aggregate.repository.interface.ts）

### 领域层 - Permission 子领域

- [ ] T149 [P] [US4] 创建 Permission 实体（packages/saas-core/src/domain/permission/entities/permission.entity.ts）
- [ ] T150 [P] [US4] 创建 Permission 实体测试（packages/saas-core/src/domain/permission/entities/permission.entity.spec.ts）
- [ ] T151 [US4] 创建 PermissionAggregate 聚合根（packages/saas-core/src/domain/permission/aggregates/permission.aggregate.ts）
- [ ] T152 [P] [US4] 创建权限领域事件（packages/saas-core/src/domain/permission/events/）
- [ ] T153 [P] [US4] 创建权限仓储接口（packages/saas-core/src/domain/permission/repositories/permission-aggregate.repository.interface.ts）
- [ ] T154 [P] [US4] 创建权限继承服务（packages/saas-core/src/domain/permission/services/permission-inheritance.service.ts）

### 应用层 - Role & Permission 用例

- [ ] T155 [P] [US4] 创建创建角色用例（packages/saas-core/src/application/use-cases/role/create-role.use-case.ts）
- [ ] T156 [P] [US4] 创建分配权限用例（packages/saas-core/src/application/use-cases/role/assign-permission.use-case.ts）
- [ ] T157 [P] [US4] 创建分配角色给用户用例（packages/saas-core/src/application/use-cases/user/assign-role.use-case.ts）
- [ ] T158 [P] [US4] 创建验证权限用例（packages/saas-core/src/application/use-cases/permission/check-permission.use-case.ts）

### CQRS - Role & Permission

- [ ] T159 [P] [US4] 创建角色命令及处理器（packages/saas-core/src/application/cqrs/commands/role/）
- [ ] T160 [P] [US4] 创建角色查询及处理器（packages/saas-core/src/application/cqrs/queries/role/）
- [ ] T161 [P] [US4] 创建权限查询及处理器（packages/saas-core/src/application/cqrs/queries/permission/）

### 基础设施层 - Role & Permission 持久化

- [ ] T162 [P] [US4] 创建 Role ORM实体（packages/saas-core/src/infrastructure/persistence/entities/role.orm-entity.ts）
- [ ] T163 [P] [US4] 创建 Permission ORM实体（packages/saas-core/src/infrastructure/persistence/entities/permission.orm-entity.ts）
- [ ] T164 [P] [US4] 创建 RolePermission ORM实体（packages/saas-core/src/infrastructure/persistence/entities/role-permission.orm-entity.ts）
- [ ] T165 [US4] 创建角色映射器（packages/saas-core/src/infrastructure/mappers/role.mapper.ts）
- [ ] T166 [US4] 创建权限映射器（packages/saas-core/src/infrastructure/mappers/permission.mapper.ts）
- [ ] T167 [US4] 创建角色仓储适配器（packages/saas-core/src/infrastructure/adapters/repositories/role-aggregate.repository.ts）
- [ ] T168 [US4] 创建权限仓储适配器（packages/saas-core/src/infrastructure/adapters/repositories/permission-aggregate.repository.ts）
- [ ] T169 [P] [US4] 创建权限缓存适配器（packages/saas-core/src/infrastructure/adapters/cache/permission-cache.adapter.ts）

### 接口层 - Role & Permission API

- [ ] T170 [P] [US4] 创建角色DTOs（packages/saas-core/src/interface/dtos/role/）
- [ ] T171 [P] [US4] 创建权限DTOs（packages/saas-core/src/interface/dtos/permission/）
- [ ] T172 [US4] 创建角色控制器（packages/saas-core/src/interface/controllers/role.controller.ts）
- [ ] T173 [US4] 创建权限控制器（packages/saas-core/src/interface/controllers/permission.controller.ts）

**Checkpoint**: User Story 4 完成 - 角色和权限管理功能可独立测试

---

## Phase 7: User Story 5 - 数据隔离和安全 (Priority: P2)

**Goal**: 实现严格的租户数据隔离和安全策略

**Independent Test**:

- 创建多个租户，验证数据互相隔离
- 租户A用户无法访问租户B的数据
- 跨租户切换时，只显示当前租户数据
- 审计日志记录所有敏感操作

### 基础设施层 - 多租户和安全

- [ ] T174 [US5] 增强租户过滤器（packages/saas-core/src/infrastructure/persistence/filters/tenant.filter.ts，添加验证和异常处理）
- [ ] T175 [P] [US5] 创建数据隔离验证中间件（packages/saas-core/src/infrastructure/security/tenant-isolation.middleware.ts）
- [ ] T176 [P] [US5] 创建审计日志服务（packages/saas-core/src/infrastructure/security/audit-log.service.ts）
- [ ] T177 [P] [US5] 创建数据脱敏服务（packages/saas-core/src/infrastructure/security/data-masking.service.ts）

### 应用层 - 租户上下文切换

- [ ] T178 [P] [US5] 创建切换租户用例（packages/saas-core/src/application/use-cases/user/switch-tenant.use-case.ts）
- [ ] T179 [P] [US5] 创建验证租户访问用例（packages/saas-core/src/application/use-cases/tenant/verify-access.use-case.ts）

### 接口层 - 安全控制

- [ ] T180 [P] [US5] 增强TenantContext装饰器（确保从@hl8/hybrid-archi正确导入和使用）
- [ ] T181 [P] [US5] 创建租户切换API（在user.controller.ts中添加切换租户端点）

**Checkpoint**: User Story 5 完成 - 数据隔离和安全功能可独立测试

---

## Phase 8: User Story 6 - 租户升级和配置管理 (Priority: P3)

**Goal**: 实现租户升级申请、审核、执行流程，支持定制化配置

**Independent Test**:

- 免费租户申请升级到基础租户
- 平台管理员审核并执行升级
- 验证新配置生效，现有数据保留
- 企业租户申请定制配置

### 应用层 - 租户升级

- [ ] T182 [P] [US6] 创建申请升级用例（packages/saas-core/src/application/use-cases/tenant/request-upgrade.use-case.ts）
- [ ] T183 [P] [US6] 创建审核升级用例（packages/saas-core/src/application/use-cases/tenant/approve-upgrade.use-case.ts）
- [ ] T184 [P] [US6] 创建执行升级用例（packages/saas-core/src/application/use-cases/tenant/execute-upgrade.use-case.ts）
- [ ] T185 [P] [US6] 创建降级租户用例（packages/saas-core/src/application/use-cases/tenant/downgrade-tenant.use-case.ts）
- [ ] T186 [P] [US6] 创建定制配置用例（packages/saas-core/src/application/use-cases/tenant/customize-config.use-case.ts）

### 领域层 - 升级工作流

- [ ] T187 [P] [US6] 创建 TenantUpgradeRequest 实体（packages/saas-core/src/domain/tenant/entities/tenant-upgrade-request.entity.ts）
- [ ] T188 [P] [US6] 创建升级验证规则（packages/saas-core/src/domain/tenant/rules/upgrade-validation.rule.ts）
- [ ] T189 [P] [US6] 增强租户升级领域事件（添加 TenantUpgradeRequestedEvent, TenantUpgradeApprovedEvent）

### CQRS - 租户升级

- [ ] T190 [P] [US6] 创建升级申请命令及处理器（packages/saas-core/src/application/cqrs/commands/tenant/request-upgrade.*）
- [ ] T191 [P] [US6] 创建审核升级命令及处理器（packages/saas-core/src/application/cqrs/commands/tenant/approve-upgrade.*）
- [ ] T192 [P] [US6] 创建执行升级命令及处理器（packages/saas-core/src/application/cqrs/commands/tenant/execute-upgrade.*）

### 基础设施层 - 升级持久化

- [ ] T193 [P] [US6] 创建 TenantUpgradeRequest ORM实体（packages/saas-core/src/infrastructure/persistence/entities/tenant-upgrade-request.orm-entity.ts）
- [ ] T194 [US6] 扩展租户映射器（支持升级请求映射）

### 接口层 - 升级API

- [ ] T195 [P] [US6] 创建升级申请DTO（packages/saas-core/src/interface/dtos/tenant/upgrade-request.dto.ts）
- [ ] T196 [P] [US6] 创建升级审核DTO（packages/saas-core/src/interface/dtos/tenant/upgrade-approval.dto.ts）
- [ ] T197 [US6] 扩展租户控制器（添加升级相关端点）

**Checkpoint**: User Story 6 完成 - 租户升级和配置管理功能可独立测试

---

## Phase 9: User Story 7 - 平台监控和运营 (Priority: P3)

**Goal**: 实现平台监控仪表板、租户统计、告警规则

**Independent Test**:

- 访问监控仪表板，查看平台统计
- 筛选即将到期的试用租户
- 设置告警规则，验证通知触发
- 查看租户资源使用趋势

### 应用层 - 监控和统计

- [ ] T198 [P] [US7] 创建获取平台统计用例（packages/saas-core/src/application/use-cases/monitoring/get-platform-stats.use-case.ts）
- [ ] T199 [P] [US7] 创建获取租户列表用例（packages/saas-core/src/application/use-cases/monitoring/list-tenants-by-status.use-case.ts）
- [ ] T200 [P] [US7] 创建获取资源使用报告用例（packages/saas-core/src/application/use-cases/monitoring/get-resource-usage.use-case.ts）
- [ ] T201 [P] [US7] 创建设置告警规则用例（packages/saas-core/src/application/use-cases/monitoring/set-alert-rule.use-case.ts）

### 领域层 - 监控实体

- [ ] T202 [P] [US7] 创建 PlatformStats 值对象（packages/saas-core/src/domain/monitoring/value-objects/platform-stats.vo.ts）
- [ ] T203 [P] [US7] 创建 ResourceUsage 值对象（packages/saas-core/src/domain/monitoring/value-objects/resource-usage.vo.ts）
- [ ] T204 [P] [US7] 创建 AlertRule 实体（packages/saas-core/src/domain/monitoring/entities/alert-rule.entity.ts）

### CQRS - 监控查询

- [ ] T205 [P] [US7] 创建平台统计查询及处理器（packages/saas-core/src/application/cqrs/queries/monitoring/get-platform-stats.*）
- [ ] T206 [P] [US7] 创建租户列表查询及处理器（packages/saas-core/src/application/cqrs/queries/monitoring/list-tenants.*）
- [ ] T207 [P] [US7] 创建资源使用查询及处理器（packages/saas-core/src/application/cqrs/queries/monitoring/get-resource-usage.*）

### 基础设施层 - 监控服务

- [ ] T208 [P] [US7] 创建统计计算服务（packages/saas-core/src/infrastructure/monitoring/stats-calculator.service.ts）
- [ ] T209 [P] [US7] 创建告警通知服务（packages/saas-core/src/infrastructure/monitoring/alert-notification.service.ts）
- [ ] T210 [P] [US7] 创建性能指标收集器（packages/saas-core/src/infrastructure/monitoring/metrics-collector.service.ts）

### 接口层 - 监控API

- [ ] T211 [P] [US7] 创建平台统计响应DTO（packages/saas-core/src/interface/dtos/monitoring/platform-stats-response.dto.ts）
- [ ] T212 [P] [US7] 创建资源使用响应DTO（packages/saas-core/src/interface/dtos/monitoring/resource-usage-response.dto.ts）
- [ ] T213 [US7] 创建监控控制器（packages/saas-core/src/interface/controllers/monitoring.controller.ts）

**Checkpoint**: User Story 7 完成 - 平台监控和运营功能可独立测试

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: 跨用户故事的优化和完善

- [ ] T214 [P] 添加完整的TSDoc注释（所有公共API、类、方法）
- [ ] T215 [P] 创建项目README（packages/saas-core/README.md）
- [ ] T216 [P] 创建API使用文档（packages/saas-core/docs/README.md）
- [ ] T217 [P] 创建MikroORM与CASL集成文档（packages/saas-core/docs/mikroorm-casl-integration.md）
- [ ] T218 代码审查和重构（清理冗余代码、统一命名）
- [ ] T219 性能优化（添加索引、优化查询）
- [ ] T220 安全加固（验证所有输入、添加速率限制）
- [ ] T221 [P] 创建集成测试套件（packages/saas-core/**tests**/integration/）
- [ ] T222 [P] 创建E2E测试套件（packages/saas-core/**tests**/e2e/）
- [ ] T223 运行完整测试并确保覆盖率达标（≥80%）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 - 立即开始
- **Foundational (Phase 2)**: 依赖 Setup 完成 - **阻塞所有用户故事**
- **User Stories (Phase 3-9)**: 所有依赖 Foundational 完成
  - User Story 1 (P1): 租户管理 - 可在 Foundational 后立即开始
  - User Story 2 (P1): 用户管理 - 可在 Foundational 后立即开始（与US1并行）
  - User Story 3 (P2): 组织架构 - 依赖 US1（需要租户）和 US2（需要用户）
  - User Story 4 (P2): 角色权限 - 依赖 US2（需要用户）
  - User Story 5 (P2): 数据隔离 - 依赖 US1（租户上下文）
  - User Story 6 (P3): 租户升级 - 依赖 US1（租户管理）
  - User Story 7 (P3): 平台监控 - 依赖所有核心功能
- **Polish (Phase 10)**: 依赖所需用户故事完成

### User Story Dependencies

```
Setup → Foundational → ┬─ US1 (租户管理) ─────────┬─→ US6 (租户升级)
                       ├─ US2 (用户管理) ────┬────┼─→ US4 (角色权限)
                       │                      │    │
                       └─ US1 + US2 ─────────┼─→ US3 (组织架构)
                                              │
                                              └─→ US5 (数据隔离) ─→ US7 (平台监控)
```

### Within Each User Story

1. 领域层（实体 → 聚合根 → 事件 → 仓储接口）
2. 应用层（用例 → CQRS命令/查询）
3. 基础设施层（ORM实体 → 映射器 → 仓储实现）
4. 接口层（DTOs → 控制器）

### Parallel Opportunities

- **Phase 1 Setup**: T003-T006 可并行
- **Phase 2 Foundational**:
  - 常量定义（T008-T015）可并行
  - 值对象创建（T016-T024）可并行
  - 枚举定义（T025-T029）可并行
- **User Story 1 & 2**: 可并行开发（不同团队成员）
- **同一故事内**: 标记 [P] 的任务可并行（不同文件）

---

## Parallel Example: User Story 1 (租户管理)

```bash
# 领域层实体（可并行创建）
Task T036: "创建 Tenant 实体"
Task T038: "创建 TenantConfiguration 实体"
Task T039: "创建 TenantQuota 实体"

# 应用层用例（可并行创建）
Task T047: "创建创建租户用例"
Task T049: "创建升级租户用例"
Task T050: "创建激活租户用例"

# DTOs（可并行创建）
Task T068: "创建创建租户DTO"
Task T069: "创建更新租户DTO"
Task T070: "创建租户响应DTO"
```

---

## Implementation Strategy

### MVP First (仅 User Story 1 + User Story 2)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational（**关键阶段**）
3. 完成 Phase 3: User Story 1（租户管理）
4. 完成 Phase 4: User Story 2（用户管理）
5. **STOP and VALIDATE**: 测试租户和用户功能独立工作
6. 准备部署/演示（MVP可交付）

### Incremental Delivery

1. Setup + Foundational → 基础就绪
2. - User Story 1 → 测试 → 部署（租户管理MVP）
3. - User Story 2 → 测试 → 部署（用户认证MVP）
4. - User Story 3 → 测试 → 部署（组织架构功能）
5. - User Story 4 → 测试 → 部署（权限管理功能）
6. - User Story 5 → 测试 → 部署（安全加固）
7. - User Story 6 & 7 → 测试 → 部署（商业功能）
8. 每个故事独立增加价值，不破坏之前的功能

### Parallel Team Strategy

多开发人员场景：

1. 团队共同完成 Setup + Foundational
2. Foundational 完成后：
   - 开发者 A: User Story 1（租户管理）
   - 开发者 B: User Story 2（用户管理）
   - 开发者 C: 协助 Foundational 测试和文档
3. US1 + US2 完成后：
   - 开发者 A: User Story 3（组织架构）
   - 开发者 B: User Story 4（角色权限）
   - 开发者 C: User Story 5（数据隔离）
4. 故事独立完成和集成

---

## Notes

- **[P] 任务**: 不同文件，无依赖，可并行
- **[Story] 标签**: 映射任务到特定用户故事，便于追溯
- **每个用户故事独立可完成和测试**: 增量交付，持续验证
- **提交策略**: 每完成一个任务或逻辑组提交
- **在每个 Checkpoint 停止验证**: 确保故事独立工作
- **避免**: 模糊任务、同文件冲突、破坏独立性的跨故事依赖

---

## Summary

- **总任务数**: 223个任务
- **用户故事分布**:
  - Setup: 7个任务
  - Foundational: 27个任务（**关键阶段**）
  - US1 (租户管理): 38个任务
  - US2 (用户管理): 31个任务
  - US3 (组织架构): 37个任务
  - US4 (角色权限): 32个任务
  - US5 (数据隔离): 8个任务
  - US6 (租户升级): 16个任务
  - US7 (平台监控): 16个任务
  - Polish: 11个任务
- **并行机会**: 约60%的任务可并行（标记[P]）
- **独立测试标准**: 每个用户故事都有明确的独立测试标准
- **MVP建议范围**: Setup + Foundational + US1 + US2（约103个任务）

---

## 生成信息

- **生成时间**: 2025-10-09
- **基于文档**: plan.md, spec.md, data-model.md, contracts/
- **架构模式**: Clean Architecture + DDD + CQRS + ES + EDA
- **技术栈**: NestJS 11+, TypeScript 5+, MikroORM, PostgreSQL, Redis
- **依赖**: @hl8/hybrid-archi, @hl8/common
- **项目位置**: packages/saas-core/
