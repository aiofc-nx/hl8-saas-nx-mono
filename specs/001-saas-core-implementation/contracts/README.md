# API 契约文档

本目录包含 SAAS Core 核心业务模块的 API 契约定义（OpenAPI 3.0.3 规范）。

## 文件列表

1. **_common.openapi.yaml** - 通用组件定义（错误响应、分页、认证等）
2. **tenant.openapi.yaml** - 租户管理 API
3. **user.openapi.yaml** - 用户管理 API
4. **organization.openapi.yaml** - 组织管理 API
5. **department.openapi.yaml** - 部门管理 API
6. **role.openapi.yaml** - 角色管理 API
7. **permission.openapi.yaml** - 权限管理 API

## API 设计原则

### RESTful 风格

所有API遵循REST设计原则：

- **资源路径**: 使用名词复数形式，如 `/tenants`, `/users`
- **HTTP方法**: GET（查询）、POST（创建）、PATCH（部分更新）、DELETE（删除）
- **状态码**: 正确使用HTTP状态码（2xx成功、4xx客户端错误、5xx服务端错误）
- **响应格式**: 统一使用JSON格式

### 多租户支持

所有API（除平台级API外）都需要租户上下文：

- **认证**: Bearer Token（JWT）
- **租户识别**: 从JWT中提取tenantId或通过`X-Tenant-Id`请求头
- **数据隔离**: 自动过滤租户数据

### 统一错误响应

所有错误响应遵循RFC7807标准（Problem Details for HTTP APIs）：

```json
{
  "type": "https://docs.hl8.com/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "租户代码只能包含小写字母和数字",
  "instance": "/api/v1/tenants",
  "timestamp": "2025-10-08T10:00:00Z",
  "metadata": {
    "field": "code",
    "value": "INVALID"
  }
}
```

### 分页查询

所有列表查询支持分页：

**请求参数**:

- `page`: 页码（从1开始，默认1）
- `pageSize`: 每页大小（默认20，最大100）
- `sortBy`: 排序字段
- `sortOrder`: 排序方向（asc/desc）

**响应格式**:

```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

### 版本控制

API版本通过URL前缀控制：

- v1: `/api/v1/...`
- v2: `/api/v2/...`（未来）

## 使用工具

### Swagger UI

使用Swagger UI查看和测试API：

```bash
# 安装swagger-ui-express
pnpm add swagger-ui-express

# 在NestJS中集成
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('SAAS Core API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

访问 `http://localhost:3000/api/docs` 查看API文档。

### OpenAPI Validator

验证OpenAPI规范：

```bash
# 安装openapi-cli
npm install -g @redocly/cli

# 验证OpenAPI文件
redocly lint tenant.openapi.yaml
```

## API 端点总览

### 租户管理

- `POST /api/v1/tenants` - 创建租户
- `GET /api/v1/tenants` - 查询租户列表
- `GET /api/v1/tenants/:id` - 查询租户详情
- `PATCH /api/v1/tenants/:id` - 更新租户信息
- `DELETE /api/v1/tenants/:id` - 删除租户
- `POST /api/v1/tenants/:id/activate` - 激活租户
- `POST /api/v1/tenants/:id/suspend` - 暂停租户
- `POST /api/v1/tenants/:id/upgrade` - 升级租户
- `GET /api/v1/tenants/:id/configuration` - 查询租户配置
- `PATCH /api/v1/tenants/:id/configuration` - 更新租户配置
- `GET /api/v1/tenants/:id/usage` - 查询资源使用情况

### 用户管理

- `POST /api/v1/users/register` - 用户注册
- `POST /api/v1/users/login` - 用户登录
- `POST /api/v1/users/logout` - 用户登出
- `GET /api/v1/users` - 查询用户列表
- `GET /api/v1/users/:id` - 查询用户详情
- `PATCH /api/v1/users/:id` - 更新用户信息
- `DELETE /api/v1/users/:id` - 删除用户
- `POST /api/v1/users/:id/verify-email` - 验证邮箱
- `POST /api/v1/users/:id/disable` - 禁用用户
- `POST /api/v1/users/:id/lock` - 锁定用户
- `POST /api/v1/users/:id/unlock` - 解锁用户
- `POST /api/v1/users/:id/change-password` - 修改密码

### 组织管理

- `POST /api/v1/organizations` - 创建组织
- `GET /api/v1/organizations` - 查询组织列表
- `GET /api/v1/organizations/:id` - 查询组织详情
- `PATCH /api/v1/organizations/:id` - 更新组织信息
- `DELETE /api/v1/organizations/:id` - 删除组织
- `POST /api/v1/organizations/:id/members` - 添加组织成员
- `DELETE /api/v1/organizations/:id/members/:userId` - 移除组织成员
- `GET /api/v1/organizations/:id/members` - 查询组织成员

### 部门管理

- `POST /api/v1/departments` - 创建部门
- `GET /api/v1/departments` - 查询部门列表
- `GET /api/v1/departments/:id` - 查询部门详情
- `PATCH /api/v1/departments/:id` - 更新部门信息
- `DELETE /api/v1/departments/:id` - 删除部门
- `POST /api/v1/departments/:id/move` - 移动部门
- `GET /api/v1/departments/:id/children` - 查询子部门
- `GET /api/v1/departments/:id/ancestors` - 查询祖先部门
- `POST /api/v1/departments/:id/members` - 添加部门成员
- `DELETE /api/v1/departments/:id/members/:userId` - 移除部门成员

### 角色管理

- `POST /api/v1/roles` - 创建角色
- `GET /api/v1/roles` - 查询角色列表
- `GET /api/v1/roles/:id` - 查询角色详情
- `PATCH /api/v1/roles/:id` - 更新角色信息
- `DELETE /api/v1/roles/:id` - 删除角色
- `POST /api/v1/roles/:id/permissions` - 为角色授予权限
- `DELETE /api/v1/roles/:id/permissions/:permissionId` - 撤销角色权限
- `GET /api/v1/roles/:id/permissions` - 查询角色权限
- `POST /api/v1/roles/:id/assign` - 将角色分配给用户

### 权限管理

- `GET /api/v1/permissions` - 查询权限列表
- `GET /api/v1/permissions/:id` - 查询权限详情
- `GET /api/v1/users/:userId/permissions` - 查询用户有效权限
- `POST /api/v1/permissions/check` - 批量检查权限

## 参考资料

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [RFC7807 - Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc7807)
- [REST API Best Practices](https://restfulapi.net/)
- [NestJS OpenAPI](https://docs.nestjs.com/openapi/introduction)
