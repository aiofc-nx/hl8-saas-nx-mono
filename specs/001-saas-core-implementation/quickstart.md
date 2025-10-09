# 快速开始指南: SAAS Core 核心业务模块

**Feature Branch**: `001-saas-core-implementation`  
**Created**: 2025-10-08  
**Phase**: Phase 1 - Quick Start Guide  
**Status**: Draft

---

## 概述

本指南将帮助您快速了解和使用 SAAS Core 核心业务模块。包括：

1. 环境准备和依赖安装
2. 项目结构说明
3. 核心概念和使用示例
4. 常见问题解答

---

## 环境要求

### 运行时环境

- **Node.js**: 20+
- **pnpm**: 8+
- **PostgreSQL**: 16+
- **Redis**: 7+

### 开发工具（推荐）

- **IDE**: VS Code或WebStorm
- **PostgreSQL客户端**: DBeaver或pgAdmin
- **Redis客户端**: RedisInsight
- **API测试**: Postman或Insomnia

---

## 快速安装

### 1. 克隆项目

```bash
# 克隆monorepo
git clone <repository-url>
cd hl8-saas-nx-mono

# 切换到功能分支
git checkout 001-saas-core-implementation
```

### 2. 安装依赖

```bash
# 安装所有依赖（使用pnpm workspaces）
pnpm install

# 验证依赖安装
pnpm nx run saas-core:build
```

### 3. 配置环境变量

创建 `.env` 文件：

```bash
# 数据库配置
DATABASE_URL=postgresql://username:password@localhost:5432/saas_core
DATABASE_SYNC=false
DATABASE_LOGGING=true

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT配置
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=3600

# 应用配置
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# 租户配置
DEFAULT_TENANT_TYPE=FREE
TRIAL_DURATION_DAYS=30

# 邮件配置（可选）
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your-email@example.com
MAIL_PASSWORD=your-password
MAIL_FROM=noreply@hl8.com
```

### 4. 初始化数据库

```bash
# 运行数据库迁移
pnpm nx run saas-core:migration:run

# 运行种子数据（可选）
pnpm nx run saas-core:seed
```

### 5. 启动应用

```bash
# 开发模式（带热重载）
pnpm nx serve saas-core

# 生产模式
pnpm nx run saas-core:build
pnpm nx run saas-core:start:prod
```

应用将在 `http://localhost:3000` 启动。

---

## 项目结构

```
packages/saas-core/
├── src/
│   ├── domain/                 # 领域层（纯业务逻辑）
│   │   ├── tenant/             # 租户子领域
│   │   ├── user/               # 用户子领域
│   │   ├── organization/       # 组织子领域
│   │   ├── department/         # 部门子领域
│   │   ├── role/               # 角色子领域
│   │   └── permission/         # 权限子领域
│   │
│   ├── application/            # 应用层（用例编排）
│   │   ├── use-cases/          # 用例
│   │   ├── cqrs/               # CQRS处理器
│   │   └── ports/              # 输出端口
│   │
│   ├── infrastructure/         # 基础设施层（技术实现）
│   │   ├── adapters/           # 适配器
│   │   ├── persistence/        # ORM实体
│   │   ├── mappers/            # 映射器
│   │   └── event-sourcing/     # 事件存储
│   │
│   ├── interface/              # 接口层（HTTP适配）
│   │   ├── controllers/        # REST控制器
│   │   ├── dtos/               # 数据传输对象
│   │   ├── guards/             # 守卫
│   │   ├── decorators/         # 装饰器
│   │   └── middleware/         # 中间件
│   │
│   ├── constants/              # 常量管理
│   └── saas-core.module.ts     # 主模块
│
├── __tests__/                  # 测试
│   ├── integration/            # 集成测试
│   └── e2e/                    # 端到端测试
│
└── docs/                       # 文档
```

---

## 核心概念

### 1. 多租户架构

SAAS Core 采用多租户架构，所有数据自动隔离：

```typescript
// 自动租户过滤（通过中间件）
@Controller('users')
@UseGuards(JwtAuthGuard, TenantContextGuard)
export class UserController {
  // 查询当前租户的用户（自动过滤）
  @Get()
  async getUsers(@CurrentTenant() tenantId: string) {
    // tenantId 自动从JWT或请求头提取
    return this.userService.findByTenantId(tenantId);
  }
}
```

### 2. Clean Architecture + DDD

#### 领域层（Domain Layer）

纯业务逻辑，无技术依赖：

```typescript
// domain/tenant/aggregates/tenant.aggregate.ts
export class TenantAggregate extends TenantAwareAggregateRoot {
  private _tenant: Tenant;
  private _configuration: TenantConfiguration;
  
  // 业务方法：升级租户
  public upgradeTenant(newType: TenantType): void {
    // 验证业务规则
    this.validateUpgrade(newType);
    
    // 更新内部实体
    this._tenant.updateType(newType);
    this._configuration = TenantConfiguration.fromTemplate(newType);
    
    // 发布领域事件
    this.addDomainEvent(new TenantUpgradedEvent(this._tenant.getId(), newType));
  }
}
```

#### 应用层（Application Layer）

用例编排，调用领域对象：

```typescript
// application/use-cases/tenant/upgrade-tenant.use-case.ts
@Injectable()
export class UpgradeTenantUseCase implements IUseCase<UpgradeTenantCommand, TenantDto> {
  constructor(
    private readonly tenantRepository: ITenantAggregateRepository,
    private readonly eventBus: IEventBus
  ) {}
  
  async execute(command: UpgradeTenantCommand): Promise<TenantDto> {
    // 1. 加载聚合根
    const aggregate = await this.tenantRepository.findById(command.tenantId);
    
    // 2. 执行业务操作
    aggregate.upgradeTenant(command.targetType);
    
    // 3. 保存聚合根
    await this.tenantRepository.save(aggregate);
    
    // 4. 发布领域事件
    await this.eventBus.publish(aggregate.getDomainEvents());
    
    // 5. 返回DTO
    return TenantDto.fromAggregate(aggregate);
  }
}
```

#### 接口层（Interface Layer）

HTTP协议适配：

```typescript
// interface/controllers/tenant.controller.ts
@Controller('tenants')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class TenantController {
  constructor(private readonly upgradeTenantUseCase: UpgradeTenantUseCase) {}
  
  @Post(':id/upgrade')
  @RequirePermission('tenant:upgrade')
  async upgradeTenant(
    @Param('id') id: string,
    @Body() dto: UpgradeTenantDto
  ): Promise<TenantResponseDto> {
    // 调用用例
    const result = await this.upgradeTenantUseCase.execute({
      tenantId: id,
      targetType: dto.targetType
    });
    
    // 转换为响应DTO
    return TenantResponseDto.fromDomain(result);
  }
}
```

### 3. CQRS模式

命令和查询分离：

```typescript
// 命令（写操作）
@CommandHandler(CreateTenantCommand)
export class CreateTenantCommandHandler {
  async execute(command: CreateTenantCommand): Promise<void> {
    // 创建聚合根
    const aggregate = TenantAggregate.create(...);
    
    // 保存
    await this.repository.save(aggregate);
  }
}

// 查询（读操作，优化性能）
@QueryHandler(GetTenantByIdQuery)
export class GetTenantByIdQueryHandler {
  async execute(query: GetTenantByIdQuery): Promise<TenantDto> {
    // 直接查询数据库（不加载聚合根）
    const tenant = await this.em.findOne(TenantOrmEntity, { id: query.id });
    
    return TenantDto.fromOrm(tenant);
  }
}
```

### 4. 事件驱动架构

领域事件驱动异步处理：

```typescript
// 发布事件
aggregate.addDomainEvent(new TenantCreatedEvent(tenantId));

// 事件处理器
@EventHandler(TenantCreatedEvent)
export class SendWelcomeEmailHandler {
  async handle(event: TenantCreatedEvent): Promise<void> {
    // 发送欢迎邮件
    await this.mailService.sendWelcomeEmail(event.tenantId);
  }
}
```

---

## 使用示例

### 示例1：创建租户

```bash
# API请求
POST /api/v1/tenants
Content-Type: application/json
Authorization: Bearer <token>

{
  "code": "demo001",
  "name": "演示租户",
  "type": "FREE",
  "domain": "demo001.hl8.com"
}

# 响应
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "code": "demo001",
  "name": "演示租户",
  "type": "FREE",
  "status": "TRIAL",
  "domain": "demo001.hl8.com",
  "createdAt": "2025-10-08T10:00:00Z",
  "updatedAt": "2025-10-08T10:00:00Z",
  "trialEndsAt": "2025-11-07T10:00:00Z"
}
```

### 示例2：用户注册和登录

```bash
# 1. 注册
POST /api/v1/users/register
Content-Type: application/json

{
  "username": "zhangsan",
  "email": "zhangsan@example.com",
  "password": "SecurePassword123!",
  "phoneNumber": "+8613800138000"
}

# 响应
{
  "id": "650e8400-e29b-41d4-a716-446655440000",
  "username": "zhangsan",
  "email": "zhangsan@example.com",
  "status": "PENDING",
  "emailVerified": false,
  "message": "注册成功，请查收邮箱验证邮件"
}

# 2. 验证邮箱
POST /api/v1/users/650e8400-e29b-41d4-a716-446655440000/verify-email
Content-Type: application/json

{
  "verificationCode": "123456"
}

# 3. 登录
POST /api/v1/users/login
Content-Type: application/json

{
  "username": "zhangsan",
  "password": "SecurePassword123!"
}

# 响应
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "650e8400-e29b-41d4-a716-446655440000",
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "status": "ACTIVE"
  }
}
```

### 示例3：创建组织和部门

```bash
# 1. 创建组织
POST /api/v1/organizations
Content-Type: application/json
Authorization: Bearer <token>
X-Tenant-Id: <tenant-id>

{
  "code": "tech-committee",
  "name": "技术委员会",
  "type": "PROFESSIONAL_COMMITTEE"
}

# 2. 创建一级部门（根部门）
POST /api/v1/departments
Content-Type: application/json
Authorization: Bearer <token>
X-Tenant-Id: <tenant-id>

{
  "organizationId": "<org-id>",
  "code": "tech-dept",
  "name": "技术部",
  "parentId": null
}

# 响应
{
  "id": "750e8400-e29b-41d4-a716-446655440000",
  "code": "tech-dept",
  "name": "技术部",
  "fullName": "技术部",
  "level": 1,
  "path": "/750e8400-e29b-41d4-a716-446655440000"
}

# 3. 创建二级部门
POST /api/v1/departments
Content-Type: application/json
Authorization: Bearer <token>
X-Tenant-Id: <tenant-id>

{
  "organizationId": "<org-id>",
  "code": "frontend-team",
  "name": "前端组",
  "parentId": "750e8400-e29b-41d4-a716-446655440000"
}

# 响应
{
  "id": "850e8400-e29b-41d4-a716-446655440000",
  "code": "frontend-team",
  "name": "前端组",
  "fullName": "技术部/前端组",
  "level": 2,
  "path": "/750e8400-e29b-41d4-a716-446655440000/850e8400-e29b-41d4-a716-446655440000"
}
```

### 示例4：角色和权限管理

```bash
# 1. 创建角色
POST /api/v1/roles
Content-Type: application/json
Authorization: Bearer <token>
X-Tenant-Id: <tenant-id>

{
  "code": "dept-manager",
  "name": "部门经理",
  "level": "DEPARTMENT",
  "description": "部门管理角色，可管理部门用户和信息"
}

# 2. 为角色授予权限
POST /api/v1/roles/<role-id>/permissions
Content-Type: application/json
Authorization: Bearer <token>
X-Tenant-Id: <tenant-id>

{
  "permissionIds": [
    "dept:read",
    "dept:update",
    "user:read",
    "user:update"
  ]
}

# 3. 将角色分配给用户
POST /api/v1/roles/<role-id>/assign
Content-Type: application/json
Authorization: Bearer <token>
X-Tenant-Id: <tenant-id>

{
  "userId": "<user-id>",
  "scope": "DEPARTMENT",
  "scopeId": "<dept-id>"
}

# 4. 查询用户有效权限
GET /api/v1/users/<user-id>/permissions
Authorization: Bearer <token>
X-Tenant-Id: <tenant-id>

# 响应
{
  "userId": "<user-id>",
  "permissions": [
    {
      "code": "dept:read",
      "name": "查看部门信息",
      "resource": "department",
      "action": "READ"
    },
    {
      "code": "dept:update",
      "name": "编辑部门信息",
      "resource": "department",
      "action": "UPDATE"
    },
    ...
  ]
}
```

---

## 测试

### 单元测试

```bash
# 运行所有单元测试
pnpm nx test saas-core

# 运行特定子领域的单元测试
pnpm nx test saas-core --testPathPattern=tenant

# 测试覆盖率
pnpm nx test saas-core --coverage
```

### 集成测试

```bash
# 运行集成测试
pnpm nx run saas-core:test:integration

# 运行特定集成测试
pnpm nx run saas-core:test:integration --testNamePattern="Tenant Management"
```

### 端到端测试

```bash
# 运行e2e测试
pnpm nx run saas-core:test:e2e

# 指定环境运行
NODE_ENV=staging pnpm nx run saas-core:test:e2e
```

---

## 开发工具

### 查看API文档

```bash
# 启动应用后访问Swagger UI
open http://localhost:3000/api/docs
```

### 生成数据库迁移

```bash
# 创建迁移文件
pnpm nx run saas-core:migration:create --name=AddNewColumn

# 运行迁移
pnpm nx run saas-core:migration:run

# 回滚迁移
pnpm nx run saas-core:migration:revert
```

### 代码检查和格式化

```bash
# ESLint检查
pnpm nx lint saas-core

# 自动修复
pnpm nx lint saas-core --fix

# Prettier格式化
pnpm nx format saas-core
```

---

## 常见问题

### Q1: 如何切换租户上下文？

A: 租户上下文通过JWT自动管理，也可以通过`X-Tenant-Id`请求头手动指定：

```bash
# 方式1：JWT中包含tenantId（推荐）
Authorization: Bearer <token-with-tenant-id>

# 方式2：请求头指定（用于跨租户操作，需要特殊权限）
X-Tenant-Id: <tenant-id>
```

### Q2: 如何验证权限？

A: 使用`@RequirePermission`装饰器：

```typescript
@Post(':id')
@RequirePermission('tenant:update')
async updateTenant(...) {
  // 只有拥有 'tenant:update' 权限的用户才能执行
}
```

### Q3: 如何处理配额限制？

A: 配额检查自动进行，超出限制时抛出异常：

```typescript
// 系统会自动检查配额
await this.userService.create(data);

// 如果超出配额，抛出异常
// GeneralBadRequestException: '已达到用户数配额限制（5/5）'
```

### Q4: 如何查询部门层级？

A: 使用闭包表查询（高性能，无需递归）：

```bash
# 查询所有子部门
GET /api/v1/departments/<dept-id>/children?includeDescendants=true

# 查询所有祖先部门
GET /api/v1/departments/<dept-id>/ancestors
```

### Q5: 如何启用事件溯源？

A: 事件溯源默认启用关键操作，查询事件流：

```bash
# 查询租户事件流
GET /api/v1/event-store/streams/tenant-<tenant-id>

# 响应
{
  "streamId": "tenant-550e8400-e29b-41d4-a716-446655440000",
  "events": [
    {
      "eventId": "1",
      "eventType": "TenantCreatedEvent",
      "timestamp": "2025-10-08T10:00:00Z",
      "data": {...}
    },
    {
      "eventId": "2",
      "eventType": "TenantUpgradedEvent",
      "timestamp": "2025-10-09T10:00:00Z",
      "data": {...}
    }
  ]
}
```

---

## 下一步

- 阅读 [data-model.md](./data-model.md) 了解详细的数据模型设计
- 查看 [contracts/](./contracts/) 了解完整的API契约
- 参考 [research.md](./research.md) 了解技术决策和架构设计
- 访问 `docs/` 目录查看各层开发指南

---

## 支持和反馈

- **问题反馈**: 请在项目Issues中提交
- **技术文档**: `docs/` 目录
- **API文档**: `http://localhost:3000/api/docs`
- **团队联系**: <support@hl8.com>
