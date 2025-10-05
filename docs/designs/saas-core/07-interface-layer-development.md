# SAAS-CORE 接口层开发指南

> **版本**: 1.0.0 | **创建日期**: 2025-01-27 | **模块**: packages/saas-core

---

## 📋 目录

- [1. 接口层设计原则](#1-接口层设计原则)
- [2. 控制器系统](#2-控制器系统)
- [3. API接口系统](#3-api接口系统)
- [4. 验证器系统](#4-验证器系统)
- [5. 转换器系统](#5-转换器系统)
- [6. 中间件系统](#6-中间件系统)
- [7. 装饰器系统](#7-装饰器系统)
- [8. 代码示例](#8-代码示例)

---

## 1. 接口层设计原则

### 1.1 协议适配支持

接口层是 Hybrid Architecture 的用户交互层，负责处理外部请求和响应。接口层应该：

- **协议适配**: 适配不同的通信协议（HTTP、GraphQL、WebSocket等）
- **请求处理**: 处理用户请求并转换为应用层可理解的格式
- **响应格式化**: 将应用层结果格式化为用户可理解的响应
- **安全控制**: 提供认证、授权、输入验证等安全功能

### 1.2 命令查询分离支持

**接口分离**:

- **命令接口**: 处理写操作，返回命令执行结果
- **查询接口**: 处理读操作，返回查询结果
- **事件接口**: 处理事件订阅和推送

### 1.3 多协议支持

**协议适配**:

- **REST API**: 支持标准的RESTful接口
- **GraphQL**: 支持灵活的查询和变更
- **WebSocket**: 支持实时通信和事件推送
- **CLI**: 支持命令行工具和脚本

### 1.4 多租户支持

**租户隔离**:

- **租户识别**: 从请求中识别租户信息
- **数据隔离**: 确保租户数据的安全隔离
- **权限控制**: 基于租户的权限验证

---

## 2. 控制器系统

### 2.1 REST控制器

```typescript
// src/interfaces/rest/controllers/tenant.controller.ts
@Controller('tenants')
@ApiTags('租户管理')
export class TenantController {
  constructor(
    private readonly createTenantUseCase: CreateTenantUseCase,
    private readonly activateTenantUseCase: ActivateTenantUseCase,
    private readonly getTenantUseCase: GetTenantUseCase,
    private readonly getTenantListUseCase: GetTenantListUseCase
  ) {}

  @Post()
  @ApiOperation({ summary: '创建租户' })
  @ApiResponse({ status: 201, description: '租户创建成功' })
  async createTenant(@Body() createTenantDto: CreateTenantDto): Promise<CreateTenantResponseDto> {
    const request = new CreateTenantRequest(
      createTenantDto.code,
      createTenantDto.name,
      createTenantDto.type,
      createTenantDto.adminId,
      createTenantDto.adminEmail,
      createTenantDto.adminName
    );

    const response = await this.createTenantUseCase.execute(request);
    
    return {
      tenantId: response.tenantId,
      code: response.code,
      name: response.name
    };
  }

  @Post(':id/activate')
  @ApiOperation({ summary: '激活租户' })
  @ApiResponse({ status: 200, description: '租户激活成功' })
  async activateTenant(@Param('id') tenantId: string): Promise<ActivateTenantResponseDto> {
    const request = new ActivateTenantRequest(tenantId);
    const response = await this.activateTenantUseCase.execute(request);
    
    return {
      tenantId: response.tenantId,
      status: response.status
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取租户信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTenant(@Param('id') tenantId: string): Promise<GetTenantResponseDto> {
    const request = new GetTenantRequest(tenantId);
    const response = await this.getTenantUseCase.execute(request);
    
    return {
      tenantId: response.tenantId,
      code: response.code,
      name: response.name,
      type: response.type,
      status: response.status
    };
  }

  @Get()
  @ApiOperation({ summary: '获取租户列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTenantList(@Query() query: GetTenantListQueryDto): Promise<GetTenantListResponseDto> {
    const request = new GetTenantListRequest(
      query.page,
      query.limit,
      query.status,
      query.type
    );

    const response = await this.getTenantListUseCase.execute(request);
    
    return {
      tenants: response.tenants,
      total: response.total,
      page: response.page,
      limit: response.limit
    };
  }
}
```

### 2.2 用户控制器

```typescript
// src/interfaces/rest/controllers/user.controller.ts
@Controller('users')
@ApiTags('用户管理')
export class UserController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase
  ) {}

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '用户注册成功' })
  async registerUser(@Body() registerUserDto: RegisterUserDto): Promise<RegisterUserResponseDto> {
    const request = new RegisterUserRequest(
      registerUserDto.email,
      registerUserDto.username,
      registerUserDto.password,
      registerUserDto.firstName,
      registerUserDto.lastName,
      registerUserDto.timezone,
      registerUserDto.locale
    );

    const response = await this.registerUserUseCase.execute(request);
    
    return {
      userId: response.userId,
      email: response.email,
      username: response.username
    };
  }

  @Post('authenticate')
  @ApiOperation({ summary: '用户认证' })
  @ApiResponse({ status: 200, description: '认证成功' })
  async authenticateUser(@Body() authenticateUserDto: AuthenticateUserDto): Promise<AuthenticateUserResponseDto> {
    const request = new AuthenticateUserRequest(
      authenticateUserDto.email,
      authenticateUserDto.password
    );

    const response = await this.authenticateUserUseCase.execute(request);
    
    return {
      userId: response.userId,
      email: response.email,
      username: response.username,
      status: response.status
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUser(@Param('id') userId: string): Promise<GetUserResponseDto> {
    const request = new GetUserRequest(userId);
    const response = await this.getUserUseCase.execute(request);
    
    return {
      userId: response.userId,
      email: response.email,
      username: response.username,
      profile: response.profile,
      status: response.status,
      roles: response.roles
    };
  }
}
```

---

## 3. API接口系统

### 3.1 版本控制

```typescript
// src/interfaces/rest/controllers/v1/tenant.controller.ts
@Controller({
  path: 'tenants',
  version: '1'
})
@ApiTags('租户管理 V1')
export class TenantV1Controller {
  // V1版本的租户管理接口
}

// src/interfaces/rest/controllers/v2/tenant.controller.ts
@Controller({
  path: 'tenants',
  version: '2'
})
@ApiTags('租户管理 V2')
export class TenantV2Controller {
  // V2版本的租户管理接口，可能包含新的功能
}
```

### 3.2 文档生成

```typescript
// src/interfaces/rest/config/swagger.config.ts
export const swaggerConfig = {
  title: 'SAAS-CORE API',
  description: 'SAAS平台核心业务领域模块API文档',
  version: '1.0.0',
  tags: [
    { name: '租户管理', description: '租户相关操作' },
    { name: '用户管理', description: '用户相关操作' },
    { name: '组织管理', description: '组织相关操作' },
    { name: '部门管理', description: '部门相关操作' }
  ],
  servers: [
    { url: 'http://localhost:3000', description: '开发环境' },
    { url: 'https://api.example.com', description: '生产环境' }
  ]
};
```

---

## 4. 验证器系统

### 4.1 DTO验证

```typescript
// src/interfaces/rest/dto/create-tenant.dto.ts
export class CreateTenantDto {
  @ApiProperty({ description: '租户代码', example: 'acme-corp' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 20)
  @Matches(/^[a-zA-Z][a-zA-Z0-9_-]*$/, { message: '租户代码必须以字母开头，只能包含字母、数字、下划线和连字符' })
  code: string;

  @ApiProperty({ description: '租户名称', example: 'Acme Corporation' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: '租户类型', enum: TenantType, example: TenantType.BASIC })
  @IsEnum(TenantType)
  type: TenantType;

  @ApiProperty({ description: '管理员ID', example: 'user-123' })
  @IsString()
  @IsNotEmpty()
  adminId: string;

  @ApiProperty({ description: '管理员邮箱', example: 'admin@acme.com' })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ description: '管理员姓名', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  adminName: string;
}
```

### 4.2 自定义验证器

```typescript
// src/interfaces/rest/validators/tenant-code.validator.ts
@ValidatorConstraint({ name: 'tenantCodeUnique', async: true })
export class TenantCodeUniqueValidator implements ValidatorConstraintInterface {
  constructor(private readonly tenantDomainService: TenantDomainService) {}

  async validate(code: string): Promise<boolean> {
    const isUnique = await this.tenantDomainService.validateTenantCodeUniqueness(code);
    return isUnique;
  }

  defaultMessage(): string {
    return '租户代码已存在';
  }
}

// 使用自定义验证器
export class CreateTenantDto {
  @ApiProperty({ description: '租户代码' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 20)
  @Validate(TenantCodeUniqueValidator)
  code: string;
}
```

---

## 5. 转换器系统

### 5.1 数据转换器

```typescript
// src/interfaces/rest/transformers/tenant.transformer.ts
export class TenantTransformer {
  static toResponseDto(aggregate: TenantAggregate): TenantResponseDto {
    const tenant = aggregate.getTenant();
    
    return {
      tenantId: tenant.getId().getValue(),
      code: tenant.getCode(),
      name: tenant.getName(),
      type: tenant.getType(),
      status: tenant.getStatus(),
      adminId: tenant.getAdminId(),
      config: tenant.getConfig().toJSON(),
      resourceLimits: tenant.getResourceLimits().toJSON(),
      createdAt: tenant.getCreatedAt(),
      updatedAt: tenant.getUpdatedAt()
    };
  }

  static toCreateRequest(dto: CreateTenantDto): CreateTenantRequest {
    return new CreateTenantRequest(
      dto.code,
      dto.name,
      dto.type,
      dto.adminId,
      dto.adminEmail,
      dto.adminName
    );
  }
}
```

### 5.2 用户转换器

```typescript
// src/interfaces/rest/transformers/user.transformer.ts
export class UserTransformer {
  static toResponseDto(aggregate: UserAggregate): UserResponseDto {
    const user = aggregate.getUser();
    
    return {
      userId: user.getId().getValue(),
      tenantId: user.getTenantId()?.getValue(),
      email: user.getEmail(),
      username: user.getUsername(),
      profile: {
        firstName: user.getProfile().firstName,
        lastName: user.getProfile().lastName,
        avatar: user.getProfile().avatar,
        phone: user.getProfile().phone,
        timezone: user.getProfile().timezone,
        locale: user.getProfile().locale
      },
      status: user.getStatus(),
      roles: user.getRoles(),
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt()
    };
  }

  static toRegisterRequest(dto: RegisterUserDto): RegisterUserRequest {
    return new RegisterUserRequest(
      dto.email,
      dto.username,
      dto.password,
      dto.firstName,
      dto.lastName,
      dto.timezone,
      dto.locale
    );
  }
}
```

---

## 6. 中间件系统

### 6.1 认证中间件

```typescript
// src/interfaces/rest/middleware/auth.middleware.ts
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const token = this.extractTokenFromHeader(req);
    
    if (!token) {
      throw new UnauthorizedException('缺少访问令牌');
    }

    try {
      const payload = this.jwtService.verify(token);
      req['user'] = payload;
      next();
    } catch (error) {
      throw new UnauthorizedException('无效的访问令牌');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

### 6.2 租户识别中间件

```typescript
// src/interfaces/rest/middleware/tenant.middleware.ts
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = this.extractTenantId(req);
    
    if (tenantId) {
      const tenant = await this.tenantService.findById(tenantId);
      if (tenant) {
        req['tenant'] = tenant;
      } else {
        throw new NotFoundException('租户不存在');
      }
    }

    next();
  }

  private extractTenantId(request: Request): string | undefined {
    // 从多种来源提取租户ID
    return request.headers['x-tenant-id'] as string ||
           request.query['tenantId'] as string ||
           request.params['tenantId'] as string;
  }
}
```

---

## 7. 装饰器系统

### 7.1 权限装饰器

```typescript
// src/interfaces/rest/decorators/permissions.decorator.ts
export const Permissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

// src/interfaces/rest/decorators/roles.decorator.ts
export const Roles = (...roles: string[]) =>
  SetMetadata('roles', roles);

// 使用示例
@Controller('tenants')
export class TenantController {
  @Post()
  @Roles('PLATFORM_ADMIN')
  @Permissions('tenant:create')
  async createTenant(@Body() createTenantDto: CreateTenantDto) {
    // 创建租户逻辑
  }
}
```

### 7.2 缓存装饰器

```typescript
// src/interfaces/rest/decorators/cache.decorator.ts
export const Cache = (key: string, ttl: number = 300) =>
  SetMetadata('cache', { key, ttl });

// 使用示例
@Controller('tenants')
export class TenantController {
  @Get(':id')
  @Cache('tenant', 600) // 缓存10分钟
  async getTenant(@Param('id') tenantId: string) {
    // 获取租户逻辑
  }
}
```

---

## 8. 代码示例

### 8.1 完整的接口层模块

```typescript
// src/interfaces/interface.module.ts
@Module({
  imports: [
    ApplicationModule,
    // 其他必要的模块
  ],
  controllers: [
    // REST控制器
    TenantController,
    UserController,
    OrganizationController,
    DepartmentController,
    
    // GraphQL解析器
    TenantResolver,
    UserResolver,
    
    // WebSocket处理器
    TenantWebSocketHandler,
    UserWebSocketHandler,
  ],
  providers: [
    // 验证器
    TenantCodeUniqueValidator,
    
    // 转换器
    TenantTransformer,
    UserTransformer,
    
    // 中间件
    AuthMiddleware,
    TenantMiddleware,
    
    // 装饰器
    PermissionsGuard,
    CacheInterceptor,
  ],
})
export class InterfaceModule {}
```

---

## 📚 相关文档

- [项目概述与架构设计](./01-overview-and-architecture.md)
- [技术栈选择与依赖管理](./02-tech-stack-and-dependencies.md)
- [项目结构与模块职责](./03-project-structure.md)
- [领域层开发指南](./04-domain-layer-development.md)
- [应用层开发指南](./05-application-layer-development.md)
- [基础设施层开发指南](./06-infrastructure-layer-development.md)
- [业务功能模块开发](./08-business-modules.md)
- [测试策略与部署运维](./09-testing-and-deployment.md)
- [最佳实践与常见问题](./10-best-practices-and-faq.md)
