# 接口层设计文档

> **文档版本**: 1.0.0  
> **创建日期**: 2025-01-27  

---

## 📋 目录

- [1. 接口层概述](#1-接口层概述)
- [2. 混合架构下的功能组件要求](#2-混合架构下的功能组件要求)
- [3. 核心组件](#3-核心组件)
- [4. REST API 设计](#4-rest-api-设计)
- [5. 安全机制](#5-安全机制)
- [6. 实现指南](#6-实现指南)
- [7. 最佳实践](#7-最佳实践)

---

## 1. 接口层概述

### 1.1 定义

接口层是系统与外部世界交互的边界，负责接收外部请求并转换为应用层的命令或查询。

### 1.2 职责

```
接口层职责
├── 1. 接收外部请求
│   ├── REST API
│   ├── GraphQL
│   ├── WebSocket
│   └── CLI
│
├── 2. 请求转换
│   ├── DTO 验证
│   ├── 转换为命令/查询
│   ├── 参数提取
│   └── 数据格式化
│
├── 3. 安全控制
│   ├── 身份认证（Authentication）
│   ├── 权限授权（Authorization）
│   ├── 租户隔离
│   └── 数据验证
│
└── 4. 响应处理
    ├── 结果转换
    ├── 错误处理
    ├── 响应格式化
    └── HTTP 状态码
```

### 1.3 特点

- **薄层**：只做转换，不包含业务逻辑
- **适配多种协议**：REST、GraphQL、WebSocket等
- **安全边界**：统一的认证授权
- **数据转换**：DTO 与领域对象的转换

---

## 2. 混合架构下的功能组件要求

### 2.1 概述

在 **Clean Architecture + DDD + CQRS + Event Sourcing + Event-Driven Architecture** 混合架构模式下，接口层作为系统的入口，需要将外部请求转换为 CQRS 命令/查询，并提供完整的安全控制和多租户支持。

### 2.2 架构模式对接口层的要求

#### 2.2.1 Clean Architecture 要求

```
Clean Architecture 对接口层的要求：
├── ✅ 适配器角色
│   └── 适配外部协议（REST、GraphQL等）到应用层
│
├── ✅ 依赖倒置
│   └── 只依赖应用层接口，不依赖具体实现
│
├── ✅ 薄接口层
│   └── 只做请求转换，不包含业务逻辑
│
└── ✅ DTO 转换
    └── 外部 DTO ↔ 应用层命令/查询
```

#### 2.2.2 DDD 要求

```
DDD 对接口层的要求：
├── ✅ 防腐层
│   └── 保护领域模型不被外部影响
│
├── ✅ DTO 设计
│   └── 不暴露领域对象，使用 DTO 传输
│
└── ✅ 上下文边界
    └── API 边界即限界上下文边界
```

#### 2.2.3 CQRS 要求

```
CQRS 对接口层的要求：
├── ✅ 命令端点 (Command Endpoints)
│   ├── POST/PUT/DELETE/PATCH 端点
│   ├── 转换 DTO 为命令对象
│   ├── 调用 CommandBus
│   └── 无返回数据（或仅返回 ID）
│
├── ✅ 查询端点 (Query Endpoints)
│   ├── GET 端点
│   ├── 转换参数为查询对象
│   ├── 调用 QueryBus
│   └── 返回查询结果
│
├── ✅ 命令查询分离
│   ├── 写端点（POST/PUT/DELETE）→ 命令
│   ├── 读端点（GET）→ 查询
│   └── HTTP 方法语义正确
│
└── ✅ 异步命令支持
    ├── 返回 202 Accepted
    ├── 提供任务查询接口
    └── WebSocket 通知完成
```

#### 2.2.4 Event Sourcing 要求

```
Event Sourcing 对接口层的要求：
├── ✅ 事件查询 API
│   ├── 获取聚合事件流
│   ├── 查询历史状态
│   └── 事件回放接口
│
├── ✅ 审计接口
│   ├── 查看操作历史
│   ├── 追溯状态变更
│   └── 合规性报告
│
└── ✅ 版本控制
    ├── 支持 ETag（乐观锁）
    ├── If-Match 头部支持
    └── 版本冲突错误响应
```

#### 2.2.5 Event-Driven Architecture 要求

```
Event-Driven Architecture 对接口层的要求：
├── ✅ WebSocket 支持
│   ├── 实时事件推送
│   ├── 订阅特定事件类型
│   ├── 租户隔离
│   └── 认证授权
│
├── ✅ Webhook 支持
│   ├── 事件 Webhook 注册
│   ├── 事件推送到外部系统
│   ├── 重试和失败处理
│   └── Webhook 签名验证
│
└── ✅ Server-Sent Events (SSE)
    ├── 单向事件流
    ├── 浏览器友好
    └── 自动重连
```

### 2.3 接口层功能组件完整清单

基于混合架构的要求，接口层必须提供以下功能组件：

#### 必需组件 (Must Have)

| 组件 | 用途 | 支持的模式 |
|------|------|-----------|
| **BaseController** | REST 控制器基类 | Clean Architecture |
| **DTO Classes** | 数据传输对象 | Clean Architecture, DDD |
| **ValidationPipe** | 数据验证管道 | DDD |

#### CQRS 特定组件

| 组件 | 用途 | 说明 |
|------|------|------|
| **Command Endpoints** | 命令端点 | POST/PUT/DELETE 操作 |
| **Query Endpoints** | 查询端点 | GET 操作 |
| **DTO to Command Mapper** | DTO 到命令映射 | 转换 DTO 为命令对象 |
| **DTO to Query Mapper** | DTO 到查询映射 | 转换参数为查询对象 |
| **CommandBus Integration** | 命令总线集成 | 调用命令总线 |
| **QueryBus Integration** | 查询总线集成 | 调用查询总线 |

#### 安全组件 (Multi-Tenancy)

| 组件 | 用途 | 说明 |
|------|------|------|
| **JwtAuthGuard** | JWT 认证守卫 | 验证用户身份 |
| **PermissionGuard** | 权限守卫 | 验证用户权限 |
| **TenantIsolationGuard** | 租户隔离守卫 | 验证和设置租户上下文 |
| **@RequirePermissions** | 权限装饰器 | 声明所需权限 |
| **@TenantContext** | 租户上下文装饰器 | 获取租户信息 |
| **@CurrentUser** | 当前用户装饰器 | 获取当前用户 |

#### Event-Driven Architecture 特定组件

| 组件 | 用途 | 说明 |
|------|------|------|
| **WebSocket Gateway** | WebSocket 网关 | 实时事件推送 |
| **Event Subscription API** | 事件订阅 API | 订阅特定事件 |
| **Webhook API** | Webhook API | 注册和管理 Webhook |
| **SSE Controller** | SSE 控制器 | Server-Sent Events |

#### Event Sourcing 特定组件

| 组件 | 用途 | 说明 |
|------|------|------|
| **Event History API** | 事件历史查询 | 查询聚合事件流 |
| **Audit API** | 审计接口 | 操作历史追溯 |
| **ETag Support** | ETag 支持 | HTTP 乐观锁 |
| **Version Conflict Handler** | 版本冲突处理 | 409 Conflict 响应 |

### 2.4 接口层组件架构图

```
┌─────────────────────────────────────────────────────────────┐
│              接口层功能组件架构                               │
└─────────────────────────────────────────────────────────────┘

External Clients (外部客户端)
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  Protocol Adapters (协议适配器)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │   REST   │  │ GraphQL  │  │WebSocket │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
└───────┼─────────────┼─────────────┼────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌─────────────────────────────────────────────────────────┐
│  Security Layer (安全层)                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │JwtAuth   │  │Permission│  │  Tenant  │             │
│  │  Guard   │  │  Guard   │  │Isolation │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
└───────┼─────────────┼─────────────┼────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌─────────────────────────────────────────────────────────┐
│  Request Processing (请求处理)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │   DTO    │  │DTO → Cmd │  │DTO → Qry │             │
│  │Validation│  │  Mapper  │  │  Mapper  │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
└───────┼─────────────┼─────────────┼────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌─────────────────────────────────────────────────────────┐
│  CQRS Integration (CQRS 集成)                            │
│  ┌──────────────────┐    ┌──────────────────┐         │
│  │   CommandBus     │    │    QueryBus      │         │
│  │   (写操作)        │    │    (读操作)       │         │
│  └────┬─────────────┘    └────┬─────────────┘         │
└───────┼──────────────────────┼────────────────────────┘
        │                      │
        ▼                      ▼
    Application Layer     Application Layer
```

### 2.5 功能组件实现检查清单

在开发接口层时，确保实现以下功能组件：

#### ✅ Clean Architecture 基础组件

- [ ] 控制器继承 `BaseController`
- [ ] 只依赖应用层接口（CommandBus、QueryBus）
- [ ] 使用 DTO 而非领域对象
- [ ] 不包含业务逻辑

#### ✅ CQRS 端点设计

- [ ] POST/PUT/DELETE 端点调用 CommandBus
- [ ] GET 端点调用 QueryBus
- [ ] 命令端点无返回数据（或仅 ID）
- [ ] 查询端点返回 DTO
- [ ] HTTP 方法语义正确

#### ✅ 安全组件（Multi-Tenancy）

- [ ] 使用 JwtAuthGuard 验证身份
- [ ] 使用 PermissionGuard 验证权限
- [ ] 使用 TenantIsolationGuard 隔离租户
- [ ] 使用 @RequirePermissions 声明权限
- [ ] 自动注入租户上下文

#### ✅ Event-Driven Architecture 组件

- [ ] 实现 WebSocket Gateway（实时推送）
- [ ] 实现事件订阅 API
- [ ] 实现 Webhook 注册和管理
- [ ] 支持 SSE（可选）

#### ✅ Event Sourcing 组件

- [ ] 实现事件历史查询 API
- [ ] 实现审计追溯 API
- [ ] 支持 ETag 头部（乐观锁）
- [ ] 处理 409 版本冲突

---

## 3. 核心组件

### 3.1 BaseController - REST 控制器基类

```typescript
/**
 * REST 控制器基类
 */
export abstract class BaseController {
  /**
   * 获取当前租户 ID
   */
  protected getTenantId(): string {
    const context = TenantContextService.getCurrentContext();
    if (!context) {
      throw new Error('Tenant context not found');
    }
    return context.tenantId;
  }

  /**
   * 获取当前用户 ID
   */
  protected getUserId(): string {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('User not found');
    }
    return user.id;
  }

  /**
   * 获取当前用户
   */
  protected getCurrentUser(): ICurrentUser | null {
    // 从请求上下文获取用户
    return RequestContext.getCurrentUser();
  }

  /**
   * 处理成功响应
   */
  protected success<T>(data: T, message = 'Success'): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date(),
    };
  }

  /**
   * 处理错误响应
   */
  protected error(message: string, code?: string): ApiErrorResponse {
    return {
      success: false,
      message,
      code,
      timestamp: new Date(),
    };
  }
}
```

### 3.2 守卫 (Guards)

#### JWT 认证守卫

```typescript
/**
 * JWT 认证守卫
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

#### 权限守卫

```typescript
/**
 * 权限守卫
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. 获取所需权限
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler()
    );

    if (!requiredPermissions) {
      return true;  // 无权限要求
    }

    // 2. 获取当前用户
    const request = context.switchToHttp().getRequest();
    const user = request['user'];

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 3. 检查权限
    const hasPermission = await this.permissionService.hasAllPermissions(
      user.id,
      requiredPermissions
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

#### 租户隔离守卫

```typescript
/**
 * 租户隔离守卫
 */
@Injectable()
export class TenantIsolationGuard implements CanActivate {
  constructor(
    private readonly tenantService: TenantContextService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request['user'];

    if (!user || !user.tenantId) {
      throw new UnauthorizedException('Tenant information not found');
    }

    // 设置租户上下文
    this.tenantService.setCurrentContext({
      tenantId: user.tenantId,
      tenantCode: user.tenantCode,
      tenantName: user.tenantName,
    });

    return true;
  }
}
```

### 3.3 装饰器 (Decorators)

#### 权限装饰器

```typescript
/**
 * 权限装饰器
 */
export const RequirePermissions = (...permissions: string[]) => {
  return SetMetadata('permissions', permissions);
};

// 使用
@Controller('users')
export class UserController {
  @Post()
  @RequirePermissions('user:create')
  async createUser(@Body() dto: CreateUserDto) {
    // ...
  }
}
```

#### 缓存装饰器

```typescript
/**
 * 缓存装饰器
 */
export const CacheTTL = (ttl: number) => {
  return SetMetadata('cache:ttl', ttl);
};

// 使用
@Controller('users')
export class UserController {
  @Get(':id')
  @CacheTTL(300)  // 5 分钟缓存
  async getUserById(@Param('id') id: string) {
    // ...
  }
}
```

### 3.4 管道 (Pipes)

#### 验证管道

```typescript
/**
 * 数据验证管道
 */
@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    if (!metadata.metatype || !this.toValidate(metadata.metatype)) {
      return value;
    }

    const object = plainToClass(metadata.metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      throw new BadRequestException('Validation failed');
    }

    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
```

---

## 4. REST API 设计

### 4.1 控制器实现

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, TenantIsolationGuard)
export class UserController extends BaseController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {
    super();
  }

  /**
   * 创建用户
   */
  @Post()
  @RequirePermissions('user:create')
  async createUser(
    @Body() dto: CreateUserDto
  ): Promise<ApiResponse<{ userId: string }>> {
    // 1. 创建命令
    const command = new CreateUserCommand(
      dto.name,
      dto.email,
      this.getTenantId(),
      this.getUserId()
    );

    // 2. 执行命令
    await this.commandBus.execute(command);

    // 3. 返回响应
    return this.success({ userId: command.commandId.toString() });
  }

  /**
   * 获取用户列表
   */
  @Get()
  @RequirePermissions('user:read')
  @CacheTTL(300)
  async getUsers(
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10
  ): Promise<ApiResponse<UserDto[]>> {
    // 1. 创建查询
    const query = new GetUsersQuery(
      status,
      this.getTenantId(),
      this.getUserId(),
      page,
      pageSize
    );

    // 2. 执行查询
    const result = await this.queryBus.execute<GetUsersQuery, UsersQueryResult>(query);

    // 3. 返回响应
    return this.success(result.getData());
  }

  /**
   * 获取单个用户
   */
  @Get(':id')
  @RequirePermissions('user:read')
  async getUserById(
    @Param('id') id: string
  ): Promise<ApiResponse<UserDto>> {
    const query = new GetUserByIdQuery(
      id,
      this.getTenantId(),
      this.getUserId()
    );

    const result = await this.queryBus.execute<GetUserByIdQuery, UserQueryResult>(query);

    return this.success(result.getData());
  }

  /**
   * 更新用户邮箱
   */
  @Patch(':id/email')
  @RequirePermissions('user:update')
  async updateUserEmail(
    @Param('id') id: string,
    @Body() dto: UpdateEmailDto
  ): Promise<ApiResponse<void>> {
    const command = new UpdateUserEmailCommand(
      id,
      dto.email,
      this.getTenantId(),
      this.getUserId()
    );

    await this.commandBus.execute(command);

    return this.success(undefined, 'Email updated successfully');
  }

  /**
   * 删除用户
   */
  @Delete(':id')
  @RequirePermissions('user:delete')
  async deleteUser(
    @Param('id') id: string
  ): Promise<ApiResponse<void>> {
    const command = new DeleteUserCommand(
      id,
      this.getTenantId(),
      this.getUserId()
    );

    await this.commandBus.execute(command);

    return this.success(undefined, 'User deleted successfully');
  }
}
```

### 4.2 DTO 设计

```typescript
/**
 * 创建用户 DTO
 */
export class CreateUserDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

/**
 * 更新邮箱 DTO
 */
export class UpdateEmailDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

/**
 * 用户响应 DTO
 */
export class UserDto {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;

  static fromAggregate(aggregate: UserAggregate): UserDto {
    return {
      id: aggregate.id.toString(),
      name: aggregate.user.name,
      email: aggregate.user.email.value,
      status: aggregate.user.status,
      createdAt: aggregate.createdAt,
      updatedAt: aggregate.updatedAt,
    };
  }
}
```

---

## 5. 安全机制

### 5.1 认证流程

```
1. 客户端发送请求（携带 JWT Token）
   ↓
2. JwtAuthGuard 验证 Token
   ↓
3. 提取用户信息到请求上下文
   ↓
4. TenantIsolationGuard 设置租户上下文
   ↓
5. PermissionGuard 检查权限
   ↓
6. 控制器处理请求
   ↓
7. 返回响应
```

### 5.2 授权策略

```typescript
/**
 * 基于角色的访问控制（RBAC）
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RoleGuard)
@RequireRoles('admin')
export class AdminController {
  // 只有 admin 角色可以访问
}

/**
 * 基于权限的访问控制（PBAC）
 */
@Controller('users')
export class UserController {
  @Post()
  @RequirePermissions('user:create', 'user:manage')
  async createUser() {
    // 需要同时具有两个权限
  }
}

/**
 * 基于属性的访问控制（ABAC）
 */
@Controller('orders')
export class OrderController {
  @Get(':id')
  @RequireAttributes({ resourceOwner: true })
  async getOrder(@Param('id') id: string) {
    // 只能访问自己的订单
  }
}
```

---

## 6. 实现指南

### 6.1 控制器实现模板

```typescript
import { 
  Controller, 
  Post, 
  Get, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards 
} from '@nestjs/common';
import { 
  BaseController,
  CommandBus,
  QueryBus,
  RequirePermissions,
  JwtAuthGuard,
  TenantIsolationGuard
} from '@hl8/hybrid-archi';

@Controller('resources')
@UseGuards(JwtAuthGuard, TenantIsolationGuard)
export class ResourceController extends BaseController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {
    super();
  }

  @Post()
  @RequirePermissions('resource:create')
  async create(@Body() dto: CreateResourceDto): Promise<ApiResponse<ResourceDto>> {
    const command = new CreateResourceCommand(
      dto.name,
      this.getTenantId(),
      this.getUserId()
    );
    
    await this.commandBus.execute(command);
    
    return this.success({ id: command.commandId.toString() });
  }

  @Get()
  @RequirePermissions('resource:read')
  async getAll(@Query() queryParams: GetResourcesQueryParams): Promise<ApiResponse<ResourceDto[]>> {
    const query = new GetResourcesQuery(
      queryParams.filter,
      this.getTenantId(),
      this.getUserId(),
      queryParams.page,
      queryParams.pageSize
    );
    
    const result = await this.queryBus.execute(query);
    
    return this.success(result.getData());
  }
}
```

---

## 7. 最佳实践

### 7.1 控制器设计最佳实践

#### ✅ DO - 应该做的

1. **保持控制器薄**

   ```typescript
   // ✅ 只做转换和路由
   @Post()
   async create(@Body() dto: CreateUserDto) {
     const command = new CreateUserCommand(dto.name, dto.email, ...);
     await this.commandBus.execute(command);
     return this.success({ id: command.commandId });
   }
   ```

2. **使用 DTO 验证**

   ```typescript
   export class CreateUserDto {
     @IsNotEmpty()
     @IsString()
     @MinLength(2)
     @MaxLength(50)
     name: string;

     @IsNotEmpty()
     @IsEmail()
     email: string;
   }
   ```

3. **统一错误处理**

   ```typescript
   @Catch()
   export class GlobalExceptionFilter implements ExceptionFilter {
     catch(exception: unknown, host: ArgumentsHost) {
       const ctx = host.switchToHttp();
       const response = ctx.getResponse();
       
       const status = exception instanceof HttpException
         ? exception.getStatus()
         : HttpStatus.INTERNAL_SERVER_ERROR;

       response.status(status).json({
         success: false,
         message: exception.message,
         timestamp: new Date().toISOString(),
       });
     }
   }
   ```

#### ❌ DON'T - 不应该做的

1. **不要在控制器中包含业务逻辑**

   ```typescript
   // ❌ 不要这样
   @Post()
   async create(@Body() dto: CreateUserDto) {
     if (dto.age < 18) {  // 业务逻辑
       throw new Error('Must be 18+');
     }
   }
   ```

2. **不要直接访问数据库**

   ```typescript
   // ❌ 不要这样
   @Get()
   async getUsers() {
     return await this.db.query('SELECT * FROM users');
   }
   ```

3. **不要绕过 CQRS**

   ```typescript
   // ❌ 不要这样
   @Post()
   async create(@Body() dto: CreateUserDto) {
     const user = new User(dto.name, dto.email);
     await this.userService.save(user);  // 绕过了命令总线
   }
   ```

---

## 📚 相关文档

- [架构概述](00-overview.md)
- [应用层设计](02-application-layer.md)
- [CQRS 模式设计](05-cqrs-pattern.md)

---

**文档维护**: HL8 架构团队  
**最后更新**: 2025-01-27
