# SAAS-CORE 应用层开发指南

> **版本**: 1.0.0 | **创建日期**: 2025-01-27 | **模块**: packages/saas-core

---

## 📋 目录

- [1. 应用层设计原则](#1-应用层设计原则)
- [2. 用例为中心的第一原则](#2-用例为中心的第一原则)
- [3. 用例服务设计](#3-用例服务设计)
- [4. 命令查询分离 (CQRS)](#4-命令查询分离-cqrs)
- [5. 事件处理器设计](#5-事件处理器设计)
- [6. 请求响应对象设计](#6-请求响应对象设计)
- [7. 事务管理](#7-事务管理)
- [8. 代码示例](#8-代码示例)

---

## 1. 应用层设计原则

### 1.1 用例为中心的第一原则

应用层是 Hybrid Architecture 的协调层，负责协调领域对象完成特定的业务用例。应用层应该：

- **用例为中心**: 以业务用例为核心，每个用例对应一个应用服务
- **用例逻辑**: 应用层的关注点是用例的逻辑，即协调领域对象完成业务场景的流程
- **无业务逻辑**: 不包含具体的业务逻辑，只负责协调
- **用例驱动**: 每个应用服务对应一个或多个业务用例
- **事务边界**: 管理事务边界和一致性
- **依赖注入**: 通过依赖注入管理组件依赖

### 1.2 用例设计承诺

**用例（Use-Case）是 Clean Architecture 的重要概念**：

**用例（Use-Case）不仅仅是命名偏好，更是一种设计承诺**：

1. **设计承诺**: 使用 `XxxUseCase` 命名是对单一职责原则的承诺
2. **业务场景专注**: 每个用例类只关注一个具体的业务场景
3. **代码清晰**: 用例命名直接反映业务意图，代码更加清晰
4. **可维护性**: 单一职责使得代码更容易维护和修改
5. **可测试性**: 每个用例可以独立测试，测试更加精确

### 1.3 应用层组件结构

```text
应用层 (Application Layer) - 用例为中心
├── 用例服务 (Use Case Services) - 核心组件
│   ├── 创建租户用例 (CreateTenantUseCase)
│   ├── 激活租户用例 (ActivateTenantUseCase)
│   ├── 查询租户用例 (GetTenantUseCase)
│   └── 租户列表用例 (GetTenantListUseCase)
├── 命令处理器 (Command Handlers) - 用例实现
├── 查询处理器 (Query Handlers) - 用例实现
└── 事件处理器 (Event Handlers) - 用例实现
```

---

## 2. 用例为中心的第一原则

### 2.1 用例为中心的架构

```typescript
// ✅ 正确：用例命名体现设计承诺
export class CreateTenantUseCase {
  // 承诺：只处理创建租户的业务场景
  async execute(request: CreateTenantRequest): Promise<CreateTenantResponse> {
    // 单一职责：只关注租户创建
  }
}

export class ActivateTenantUseCase {
  // 承诺：只处理激活租户的业务场景
  async execute(request: ActivateTenantRequest): Promise<ActivateTenantResponse> {
    // 单一职责：只关注租户激活
  }
}

export class GetTenantUseCase {
  // 承诺：只处理查询租户的业务场景
  async execute(request: GetTenantRequest): Promise<GetTenantResponse> {
    // 单一职责：只关注租户查询
  }
}

// ❌ 错误：违反设计承诺
export class TenantService {
  // ❌ 违反承诺：处理多个业务场景
  async createTenant(): Promise<void> { }
  async updateTenant(): Promise<void> { }
  async deleteTenant(): Promise<void> { }
  async activateTenant(): Promise<void> { }
}
```

### 2.2 用例职责分离

**应用层职责**:

- **用例服务**: 实现具体的业务用例，协调领域对象
- **命令处理器**: 处理写操作请求，实现命令端用例
- **查询处理器**: 处理读操作请求，实现查询端用例
- **事件处理器**: 处理领域事件，实现事件驱动用例
- **应用服务**: 协调多个聚合的操作
- **事务管理**: 管理事务边界和一致性
- **依赖注入**: 通过依赖注入管理组件依赖

---

## 3. 用例服务设计

### 3.1 创建租户用例

```typescript
// src/application/use-cases/create-tenant.use-case.ts
export class CreateTenantUseCase {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly eventBus: IEventBus,
    private readonly tenantDomainService: TenantDomainService
  ) {}

  /**
   * 创建租户用例 - 单一职责：只处理创建租户的业务场景
   */
  async execute(request: CreateTenantRequest): Promise<CreateTenantResponse> {
    // 1. 验证业务规则（跨聚合验证）
    const isCodeUnique = await this.tenantDomainService.validateTenantCodeUniqueness(request.code);
    if (!isCodeUnique) {
      throw new TenantCodeAlreadyExistsException(`租户代码 ${request.code} 已存在`);
    }

    // 2. 创建聚合根
    const tenantId = TenantId.generate();
    const tenantAggregate = TenantAggregate.create(
      tenantId,
      request.code,
      request.name,
      request.type,
      request.adminId
    );

    // 3. 持久化聚合根
    await this.tenantRepository.save(tenantAggregate);

    // 4. 发布领域事件
    await this.eventBus.publishAll(tenantAggregate.getUncommittedEvents());

    // 5. 返回结果
    return new CreateTenantResponse(tenantId.getValue(), request.code, request.name);
  }
}
```

### 3.2 激活租户用例

```typescript
// src/application/use-cases/activate-tenant.use-case.ts
export class ActivateTenantUseCase {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly eventBus: IEventBus
  ) {}

  /**
   * 激活租户用例 - 单一职责：只处理激活租户的业务场景
   */
  async execute(request: ActivateTenantRequest): Promise<ActivateTenantResponse> {
    // 1. 获取聚合根
    const tenantAggregate = await this.tenantRepository.findById(request.tenantId);
    if (!tenantAggregate) {
      throw new TenantNotFoundException(`租户 ${request.tenantId} 不存在`);
    }

    // 2. 执行业务操作（委托给聚合根）
    tenantAggregate.activate();

    // 3. 持久化变更
    await this.tenantRepository.save(tenantAggregate);

    // 4. 发布领域事件
    await this.eventBus.publishAll(tenantAggregate.getUncommittedEvents());

    // 5. 返回结果
    return new ActivateTenantResponse(request.tenantId, 'ACTIVE');
  }
}
```

### 3.3 查询租户用例

```typescript
// src/application/use-cases/get-tenant.use-case.ts
export class GetTenantUseCase {
  constructor(
    private readonly tenantRepository: ITenantRepository
  ) {}

  /**
   * 查询租户用例 - 单一职责：只处理查询租户的业务场景
   */
  async execute(request: GetTenantRequest): Promise<GetTenantResponse> {
    // 1. 查询聚合根
    const tenantAggregate = await this.tenantRepository.findById(request.tenantId);
    if (!tenantAggregate) {
      throw new TenantNotFoundException(`租户 ${request.tenantId} 不存在`);
    }

    // 2. 转换为响应对象
    const tenant = tenantAggregate.getTenant();
    return new GetTenantResponse(
      tenant.getId().getValue(),
      tenant.getCode(),
      tenant.getName(),
      tenant.getType(),
      tenant.getStatus()
    );
  }
}
```

### 3.4 租户列表用例

```typescript
// src/application/use-cases/get-tenant-list.use-case.ts
export class GetTenantListUseCase {
  constructor(
    private readonly tenantRepository: ITenantRepository
  ) {}

  /**
   * 查询租户列表用例 - 单一职责：只处理查询租户列表的业务场景
   */
  async execute(request: GetTenantListRequest): Promise<GetTenantListResponse> {
    // 1. 查询聚合根列表
    const tenantAggregates = await this.tenantRepository.findAll();

    // 2. 转换为响应对象列表
    const tenants = tenantAggregates.map(aggregate => {
      const tenant = aggregate.getTenant();
      return {
        tenantId: tenant.getId().getValue(),
        code: tenant.getCode(),
        name: tenant.getName(),
        type: tenant.getType(),
        status: tenant.getStatus()
      };
    });

    // 3. 返回结果
    return new GetTenantListResponse(tenants);
  }
}
```

### 3.5 用户注册用例

```typescript
// src/application/use-cases/register-user.use-case.ts
export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus,
    private readonly userDomainService: UserDomainService
  ) {}

  /**
   * 用户注册用例 - 单一职责：只处理用户注册的业务场景
   */
  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    // 1. 验证业务规则（跨聚合验证）
    const isEmailUnique = await this.userDomainService.validateEmailUniqueness(request.email);
    if (!isEmailUnique) {
      throw new EmailAlreadyExistsException(`邮箱 ${request.email} 已存在`);
    }

    const isUsernameUnique = await this.userDomainService.validateUsernameUniqueness(request.username);
    if (!isUsernameUnique) {
      throw new UsernameAlreadyExistsException(`用户名 ${request.username} 已存在`);
    }

    // 2. 创建聚合根
    const userId = UserId.generate();
    const userProfile = UserProfile.create({
      firstName: request.firstName,
      lastName: request.lastName,
      timezone: request.timezone || 'UTC',
      locale: request.locale || 'zh-CN',
      preferences: {}
    });

    const userAggregate = UserAggregate.create(
      userId,
      request.email,
      request.username,
      request.password,
      userProfile
    );

    // 3. 持久化聚合根
    await this.userRepository.save(userAggregate);

    // 4. 发布领域事件
    await this.eventBus.publishAll(userAggregate.getUncommittedEvents());

    // 5. 返回结果
    return new RegisterUserResponse(userId.getValue(), request.email, request.username);
  }
}
```

### 3.6 用户认证用例

```typescript
// src/application/use-cases/authenticate-user.use-case.ts
export class AuthenticateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus
  ) {}

  /**
   * 用户认证用例 - 单一职责：只处理用户认证的业务场景
   */
  async execute(request: AuthenticateUserRequest): Promise<AuthenticateUserResponse> {
    // 1. 查找用户
    const userAggregate = await this.userRepository.findByEmail(request.email);
    if (!userAggregate) {
      throw new UserNotFoundException(`用户 ${request.email} 不存在`);
    }

    // 2. 执行认证（委托给聚合根）
    const isAuthenticated = userAggregate.authenticate(request.password);
    if (!isAuthenticated) {
      throw new InvalidCredentialsException('用户名或密码错误');
    }

    // 3. 持久化变更（如果有状态变更）
    await this.userRepository.save(userAggregate);

    // 4. 发布领域事件
    await this.eventBus.publishAll(userAggregate.getUncommittedEvents());

    // 5. 返回结果
    const user = userAggregate.getUser();
    return new AuthenticateUserResponse(
      user.getId().getValue(),
      user.getEmail(),
      user.getUsername(),
      user.getStatus()
    );
  }
}
```

---

## 4. 命令查询分离 (CQRS)

### 4.1 命令对象设计

```typescript
// src/application/commands/create-tenant.command.ts
export class CreateTenantCommand {
  constructor(
    public readonly code: string,
    public readonly name: string,
    public readonly type: TenantType,
    public readonly adminId: string,
    public readonly adminEmail: string,
    public readonly adminName: string
  ) {}
}

// src/application/commands/activate-tenant.command.ts
export class ActivateTenantCommand {
  constructor(public readonly tenantId: string) {}
}

// src/application/commands/suspend-tenant.command.ts
export class SuspendTenantCommand {
  constructor(
    public readonly tenantId: string,
    public readonly reason: string
  ) {}
}

// src/application/commands/register-user.command.ts
export class RegisterUserCommand {
  constructor(
    public readonly email: string,
    public readonly username: string,
    public readonly password: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly timezone?: string,
    public readonly locale?: string
  ) {}
}

// src/application/commands/authenticate-user.command.ts
export class AuthenticateUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string
  ) {}
}
```

### 4.2 查询对象设计

```typescript
// src/application/queries/get-tenant.query.ts
export class GetTenantQuery {
  constructor(public readonly tenantId: string) {}
}

// src/application/queries/get-tenant-list.query.ts
export class GetTenantListQuery {
  constructor(
    public readonly page?: number,
    public readonly limit?: number,
    public readonly status?: TenantStatus,
    public readonly type?: TenantType
  ) {}
}

// src/application/queries/get-user.query.ts
export class GetUserQuery {
  constructor(public readonly userId: string) {}
}

// src/application/queries/get-user-by-email.query.ts
export class GetUserByEmailQuery {
  constructor(public readonly email: string) {}
}

// src/application/queries/get-tenant-users.query.ts
export class GetTenantUsersQuery {
  constructor(
    public readonly tenantId: string,
    public readonly page?: number,
    public readonly limit?: number,
    public readonly status?: UserStatus
  ) {}
}
```

### 4.3 命令处理器设计

```typescript
// src/application/handlers/create-tenant.handler.ts
@CommandHandler(CreateTenantCommand)
export class CreateTenantHandler implements ICommandHandler<CreateTenantCommand> {
  constructor(private readonly createTenantUseCase: CreateTenantUseCase) {}

  async execute(command: CreateTenantCommand): Promise<void> {
    // 委托给用例服务
    const request = new CreateTenantRequest(
      command.code,
      command.name,
      command.type,
      command.adminId,
      command.adminEmail,
      command.adminName
    );
    
    await this.createTenantUseCase.execute(request);
  }
}

// src/application/handlers/activate-tenant.handler.ts
@CommandHandler(ActivateTenantCommand)
export class ActivateTenantHandler implements ICommandHandler<ActivateTenantCommand> {
  constructor(private readonly activateTenantUseCase: ActivateTenantUseCase) {}

  async execute(command: ActivateTenantCommand): Promise<void> {
    // 委托给用例服务
    const request = new ActivateTenantRequest(command.tenantId);
    await this.activateTenantUseCase.execute(request);
  }
}

// src/application/handlers/register-user.handler.ts
@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

  async execute(command: RegisterUserCommand): Promise<void> {
    // 委托给用例服务
    const request = new RegisterUserRequest(
      command.email,
      command.username,
      command.password,
      command.firstName,
      command.lastName,
      command.timezone,
      command.locale
    );
    
    await this.registerUserUseCase.execute(request);
  }
}
```

### 4.4 查询处理器设计

```typescript
// src/application/handlers/get-tenant.handler.ts
@QueryHandler(GetTenantQuery)
export class GetTenantHandler implements IQueryHandler<GetTenantQuery> {
  constructor(private readonly getTenantUseCase: GetTenantUseCase) {}

  async execute(query: GetTenantQuery): Promise<GetTenantResponse> {
    // 委托给用例服务
    const request = new GetTenantRequest(query.tenantId);
    return await this.getTenantUseCase.execute(request);
  }
}

// src/application/handlers/get-tenant-list.handler.ts
@QueryHandler(GetTenantListQuery)
export class GetTenantListHandler implements IQueryHandler<GetTenantListQuery> {
  constructor(private readonly getTenantListUseCase: GetTenantListUseCase) {}

  async execute(query: GetTenantListQuery): Promise<GetTenantListResponse> {
    // 委托给用例服务
    const request = new GetTenantListRequest(
      query.page,
      query.limit,
      query.status,
      query.type
    );
    
    return await this.getTenantListUseCase.execute(request);
  }
}

// src/application/handlers/get-user.handler.ts
@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  constructor(private readonly getUserUseCase: GetUserUseCase) {}

  async execute(query: GetUserQuery): Promise<GetUserResponse> {
    // 委托给用例服务
    const request = new GetUserRequest(query.userId);
    return await this.getUserUseCase.execute(request);
  }
}
```

---

## 5. 事件处理器设计

### 5.1 租户事件处理器

```typescript
// src/application/handlers/tenant-created.handler.ts
@EventsHandler(TenantCreatedEvent)
export class TenantCreatedHandler implements IEventHandler<TenantCreatedEvent> {
  constructor(
    private readonly emailService: IEmailService,
    private readonly notificationService: INotificationService
  ) {}

  async handle(event: TenantCreatedEvent): Promise<void> {
    // 发送欢迎邮件
    await this.emailService.sendWelcomeEmail(event.adminEmail, event.code);
    
    // 发送通知
    await this.notificationService.notifyTenantCreated(event.tenantId, event.code);
  }
}

// src/application/handlers/tenant-activated.handler.ts
@EventsHandler(TenantActivatedEvent)
export class TenantActivatedHandler implements IEventHandler<TenantActivatedEvent> {
  constructor(
    private readonly emailService: IEmailService,
    private readonly analyticsService: IAnalyticsService
  ) {}

  async handle(event: TenantActivatedEvent): Promise<void> {
    // 发送激活确认邮件
    await this.emailService.sendActivationConfirmation(event.tenantId);
    
    // 记录分析数据
    await this.analyticsService.recordTenantActivation(event.tenantId);
  }
}

// src/application/handlers/tenant-suspended.handler.ts
@EventsHandler(TenantSuspendedEvent)
export class TenantSuspendedHandler implements IEventHandler<TenantSuspendedEvent> {
  constructor(
    private readonly emailService: IEmailService,
    private readonly notificationService: INotificationService
  ) {}

  async handle(event: TenantSuspendedEvent): Promise<void> {
    // 发送暂停通知邮件
    await this.emailService.sendSuspensionNotification(event.tenantId, event.reason);
    
    // 发送通知
    await this.notificationService.notifyTenantSuspended(event.tenantId, event.reason);
  }
}
```

### 5.2 用户事件处理器

```typescript
// src/application/handlers/user-registered.handler.ts
@EventsHandler(UserRegisteredEvent)
export class UserRegisteredHandler implements IEventHandler<UserRegisteredEvent> {
  constructor(
    private readonly emailService: IEmailService,
    private readonly notificationService: INotificationService
  ) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    // 发送注册确认邮件
    await this.emailService.sendRegistrationConfirmation(event.email);
    
    // 发送通知
    await this.notificationService.notifyUserRegistered(event.userId, event.email);
  }
}

// src/application/handlers/user-activated.handler.ts
@EventsHandler(UserActivatedEvent)
export class UserActivatedHandler implements IEventHandler<UserActivatedEvent> {
  constructor(
    private readonly emailService: IEmailService,
    private readonly analyticsService: IAnalyticsService
  ) {}

  async handle(event: UserActivatedEvent): Promise<void> {
    // 发送激活确认邮件
    await this.emailService.sendActivationConfirmation(event.userId);
    
    // 记录分析数据
    await this.analyticsService.recordUserActivation(event.userId);
  }
}

// src/application/handlers/user-authenticated.handler.ts
@EventsHandler(UserAuthenticatedEvent)
export class UserAuthenticatedHandler implements IEventHandler<UserAuthenticatedEvent> {
  constructor(
    private readonly analyticsService: IAnalyticsService,
    private readonly auditService: IAuditService
  ) {}

  async handle(event: UserAuthenticatedEvent): Promise<void> {
    // 记录登录分析数据
    await this.analyticsService.recordUserLogin(event.userId);
    
    // 记录审计日志
    await this.auditService.logUserAuthentication(event.userId);
  }
}
```

---

## 6. 请求响应对象设计

### 6.1 租户相关DTO

```typescript
// src/application/dto/create-tenant.dto.ts
export class CreateTenantRequest {
  constructor(
    public readonly code: string,
    public readonly name: string,
    public readonly type: TenantType,
    public readonly adminId: string,
    public readonly adminEmail: string,
    public readonly adminName: string
  ) {}
}

export class CreateTenantResponse {
  constructor(
    public readonly tenantId: string,
    public readonly code: string,
    public readonly name: string
  ) {}
}

// src/application/dto/activate-tenant.dto.ts
export class ActivateTenantRequest {
  constructor(public readonly tenantId: string) {}
}

export class ActivateTenantResponse {
  constructor(
    public readonly tenantId: string,
    public readonly status: string
  ) {}
}

// src/application/dto/get-tenant.dto.ts
export class GetTenantRequest {
  constructor(public readonly tenantId: string) {}
}

export class GetTenantResponse {
  constructor(
    public readonly tenantId: string,
    public readonly code: string,
    public readonly name: string,
    public readonly type: TenantType,
    public readonly status: TenantStatus
  ) {}
}

// src/application/dto/get-tenant-list.dto.ts
export class GetTenantListRequest {
  constructor(
    public readonly page?: number,
    public readonly limit?: number,
    public readonly status?: TenantStatus,
    public readonly type?: TenantType
  ) {}
}

export class GetTenantListResponse {
  constructor(
    public readonly tenants: TenantSummary[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number
  ) {}
}

export class TenantSummary {
  constructor(
    public readonly tenantId: string,
    public readonly code: string,
    public readonly name: string,
    public readonly type: TenantType,
    public readonly status: TenantStatus
  ) {}
}
```

### 6.2 用户相关DTO

```typescript
// src/application/dto/register-user.dto.ts
export class RegisterUserRequest {
  constructor(
    public readonly email: string,
    public readonly username: string,
    public readonly password: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly timezone?: string,
    public readonly locale?: string
  ) {}
}

export class RegisterUserResponse {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly username: string
  ) {}
}

// src/application/dto/authenticate-user.dto.ts
export class AuthenticateUserRequest {
  constructor(
    public readonly email: string,
    public readonly password: string
  ) {}
}

export class AuthenticateUserResponse {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly username: string,
    public readonly status: UserStatus
  ) {}
}

// src/application/dto/get-user.dto.ts
export class GetUserRequest {
  constructor(public readonly userId: string) {}
}

export class GetUserResponse {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly username: string,
    public readonly profile: UserProfileDto,
    public readonly status: UserStatus,
    public readonly roles: UserRole[]
  ) {}
}

export class UserProfileDto {
  constructor(
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly avatar?: string,
    public readonly phone?: string,
    public readonly timezone: string,
    public readonly locale: string
  ) {}
}
```

---

## 7. 事务管理

### 7.1 用例事务边界

```typescript
// src/application/use-cases/create-tenant-with-user.use-case.ts
export class CreateTenantWithUserUseCase {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus,
    private readonly dataSource: DataSource
  ) {}

  /**
   * 创建租户和用户用例 - 事务边界管理
   */
  async execute(request: CreateTenantWithUserRequest): Promise<CreateTenantWithUserResponse> {
    // 使用数据库事务确保一致性
    return await this.dataSource.transaction(async (manager) => {
      try {
        // 1. 创建租户聚合根
        const tenantId = TenantId.generate();
        const tenantAggregate = TenantAggregate.create(
          tenantId,
          request.tenantCode,
          request.tenantName,
          request.tenantType,
          request.adminId
        );

        // 2. 创建用户聚合根
        const userId = UserId.generate();
        const userProfile = UserProfile.create({
          firstName: request.adminFirstName,
          lastName: request.adminLastName,
          timezone: request.timezone || 'UTC',
          locale: request.locale || 'zh-CN',
          preferences: {}
        });

        const userAggregate = UserAggregate.create(
          userId,
          request.adminEmail,
          request.adminUsername,
          request.adminPassword,
          userProfile
        );

        // 3. 将用户分配到租户
        userAggregate.assignToTenant(tenantId, UserRole.TENANT_ADMIN);

        // 4. 持久化聚合根（在同一个事务中）
        await this.tenantRepository.save(tenantAggregate);
        await this.userRepository.save(userAggregate);

        // 5. 发布领域事件（事务提交后）
        await this.eventBus.publishAll(tenantAggregate.getUncommittedEvents());
        await this.eventBus.publishAll(userAggregate.getUncommittedEvents());

        // 6. 返回结果
        return new CreateTenantWithUserResponse(
          tenantId.getValue(),
          userId.getValue(),
          request.tenantCode,
          request.adminEmail
        );

      } catch (error) {
        // 事务会自动回滚
        throw error;
      }
    });
  }
}
```

### 7.2 事件处理器事务

```typescript
// src/application/handlers/tenant-created-with-rollback.handler.ts
@EventsHandler(TenantCreatedEvent)
export class TenantCreatedWithRollbackHandler implements IEventHandler<TenantCreatedEvent> {
  constructor(
    private readonly emailService: IEmailService,
    private readonly notificationService: INotificationService,
    private readonly eventStore: IEventStore
  ) {}

  async handle(event: TenantCreatedEvent): Promise<void> {
    try {
      // 发送欢迎邮件
      await this.emailService.sendWelcomeEmail(event.adminEmail, event.code);
      
      // 发送通知
      await this.notificationService.notifyTenantCreated(event.tenantId, event.code);
      
    } catch (error) {
      // 记录失败事件，支持重试机制
      await this.eventStore.saveFailedEvent(event, error);
      throw error;
    }
  }
}
```

---

## 8. 代码示例

### 8.1 完整的应用层模块

```typescript
// src/application/application.module.ts
@Module({
  imports: [
    CqrsModule,
    // 其他必要的模块
  ],
  providers: [
    // 用例服务
    CreateTenantUseCase,
    ActivateTenantUseCase,
    GetTenantUseCase,
    GetTenantListUseCase,
    RegisterUserUseCase,
    AuthenticateUserUseCase,

    // 命令处理器
    CreateTenantHandler,
    ActivateTenantHandler,
    SuspendTenantHandler,
    RegisterUserHandler,
    AuthenticateUserHandler,

    // 查询处理器
    GetTenantHandler,
    GetTenantListHandler,
    GetUserHandler,
    GetUserByEmailHandler,
    GetTenantUsersHandler,

    // 事件处理器
    TenantCreatedHandler,
    TenantActivatedHandler,
    TenantSuspendedHandler,
    UserRegisteredHandler,
    UserActivatedHandler,
    UserAuthenticatedHandler,

    // 领域服务
    TenantDomainService,
    UserDomainService,
  ],
  exports: [
    // 导出用例服务供接口层使用
    CreateTenantUseCase,
    ActivateTenantUseCase,
    GetTenantUseCase,
    GetTenantListUseCase,
    RegisterUserUseCase,
    AuthenticateUserUseCase,
  ],
})
export class ApplicationModule {}
```

### 8.2 用例服务集成示例

```typescript
// src/application/use-cases/complete-tenant-setup.use-case.ts
export class CompleteTenantSetupUseCase {
  constructor(
    private readonly createTenantUseCase: CreateTenantUseCase,
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly activateTenantUseCase: ActivateTenantUseCase,
    private readonly dataSource: DataSource
  ) {}

  /**
   * 完整租户设置用例 - 协调多个用例服务
   */
  async execute(request: CompleteTenantSetupRequest): Promise<CompleteTenantSetupResponse> {
    return await this.dataSource.transaction(async () => {
      // 1. 创建租户
      const createTenantRequest = new CreateTenantRequest(
        request.tenantCode,
        request.tenantName,
        request.tenantType,
        request.adminId,
        request.adminEmail,
        request.adminName
      );
      
      const createTenantResponse = await this.createTenantUseCase.execute(createTenantRequest);

      // 2. 注册管理员用户
      const registerUserRequest = new RegisterUserRequest(
        request.adminEmail,
        request.adminUsername,
        request.adminPassword,
        request.adminFirstName,
        request.adminLastName,
        request.timezone,
        request.locale
      );
      
      const registerUserResponse = await this.registerUserUseCase.execute(registerUserRequest);

      // 3. 激活租户
      const activateTenantRequest = new ActivateTenantRequest(createTenantResponse.tenantId);
      await this.activateTenantUseCase.execute(activateTenantRequest);

      // 4. 返回结果
      return new CompleteTenantSetupResponse(
        createTenantResponse.tenantId,
        registerUserResponse.userId,
        createTenantResponse.code,
        registerUserResponse.email
      );
    });
  }
}
```

---

## 📚 相关文档

- [项目概述与架构设计](./01-overview-and-architecture.md)
- [技术栈选择与依赖管理](./02-tech-stack-and-dependencies.md)
- [项目结构与模块职责](./03-project-structure.md)
- [领域层开发指南](./04-domain-layer-development.md)
- [基础设施层开发指南](./06-infrastructure-layer-development.md)
- [接口层开发指南](./07-interface-layer-development.md)
- [业务功能模块开发](./08-business-modules.md)
- [测试策略与部署运维](./09-testing-and-deployment.md)
- [最佳实践与常见问题](./10-best-practices-and-faq.md)
