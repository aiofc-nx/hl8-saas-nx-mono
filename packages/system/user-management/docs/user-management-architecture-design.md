# 用户管理模块架构设计

> **版本**: 1.0.0 | **创建日期**: 2025-01-27 | **基于架构**: Hybrid Architecture (Clean Architecture + DDD + CQRS + ES + EDA)

---

## 📋 目录

- [1. 模块概述](#1-模块概述)
- [2. 架构设计](#2-架构设计)
- [3. 领域模型设计](#3-领域模型设计)
- [4. 应用层设计](#4-应用层设计)
- [5. 接口层设计](#5-接口层设计)
- [6. 基础设施层设计](#6-基础设施层设计)
- [7. 项目结构](#7-项目结构)
- [8. 实现计划](#8-实现计划)
- [9. 验证方案](#9-验证方案)

---

## 1. 模块概述

### 1.1 模块定位

用户管理模块是 SAAS 平台的核心基础模块，基于`@hl8/hybrid-archi`架构，负责管理平台内的所有用户实体，包括用户注册、认证、授权、个人信息管理等功能。

### 1.2 设计目标

- **架构一致性**: 严格遵循 Hybrid Architecture 设计原则
- **业务完整性**: 支持完整的用户生命周期管理
- **多租户支持**: 完整的租户隔离和权限控制
- **可扩展性**: 支持未来业务需求的扩展
- **性能优化**: 支持高并发用户操作

### 1.3 技术约束

- 基于现有的`@hl8/hybrid-archi`架构
- 遵循 DDD 充血模型设计
- 使用 CQRS 模式分离命令和查询
- 支持事件驱动架构
- 集成多租户支持

---

## 2. 架构设计

### 2.1 分层架构

```
┌─────────────────────────────────────────┐
│            Interface Layer              │
│  ┌─────────────┐ ┌─────────────┐        │
│  │   REST API  │ │  GraphQL    │        │
│  │ Controllers │ │ Resolvers   │        │
│  └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│           Application Layer              │
│  ┌─────────────┐ ┌─────────────┐        │
│  │   Commands  │ │   Queries   │        │
│  │   Handlers  │ │   Handlers  │        │
│  └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│             Domain Layer                │
│  ┌─────────────┐ ┌─────────────┐        │
│  │   Entities  │ │  Services   │        │
│  │ Aggregates  │ │   Events    │        │
│  └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│         Infrastructure Layer            │
│  ┌─────────────┐ ┌─────────────┐        │
│  │ Repositories │ │   External  │        │
│  │   Adapters  │ │  Services   │        │
│  └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────┘
```

### 2.2 模块依赖关系

```mermaid
graph TD
    A[User Management Module] --> B[Hybrid Architecture]
    A --> C[Multi-tenancy]
    A --> D[Authentication]
    A --> E[Authorization]
    A --> F[Event System]
    A --> G[Cache System]
    A --> H[Database]
```

### 2.3 核心依赖

```typescript
// 核心依赖
"@hl8/hybrid-archi": "workspace:*"
"@hl8/multi-tenancy": "workspace:*"
"@hl8/cache": "workspace:*"
"@hl8/logger": "workspace:*"
"@hl8/common": "workspace:*"

// 外部依赖
"@nestjs/common": "^10.0.0"
"@nestjs/core": "^10.0.0"
"uuid": "^9.0.0"
"bcrypt": "^5.1.0"
"class-validator": "^0.14.0"
"class-transformer": "^0.5.1"
```

---

## 3. 领域模型设计

### 3.1 聚合根设计

#### 3.1.1 User 聚合根

```typescript
/**
 * 用户聚合根
 *
 * @description 用户聚合根，管理用户的完整生命周期
 * 包含用户基础信息、认证信息、权限信息等
 */
export class User extends BaseAggregateRoot<UserId> {
  private constructor(
    private readonly _id: UserId,
    private _email: Email,
    private _username: Username,
    private _password: Password,
    private _profile: UserProfile,
    private _status: UserStatus,
    private _tenantId?: TenantId
  ) {
    super(_id);
  }

  // 业务方法
  public register(email: Email, username: Username, password: Password): void {
    if (this._status !== UserStatus.Pending) {
      throw new UserAlreadyRegisteredException();
    }

    this._email = email;
    this._username = username;
    this._password = password;
    this._status = UserStatus.Active;

    this.addDomainEvent(new UserRegisteredEvent(this._id, this._email));
  }

  public authenticate(password: Password): boolean {
    if (this._status !== UserStatus.Active) {
      throw new UserNotActiveException();
    }

    const isValid = this._password.verify(password);
    if (isValid) {
      this.addDomainEvent(new UserAuthenticatedEvent(this._id));
    }

    return isValid;
  }

  public updateProfile(profile: UserProfile): void {
    this._profile = profile;
    this.addDomainEvent(new UserProfileUpdatedEvent(this._id, profile));
  }

  public assignToTenant(tenantId: TenantId): void {
    this._tenantId = tenantId;
    this.addDomainEvent(new UserAssignedToTenantEvent(this._id, tenantId));
  }
}
```

#### 3.1.2 UserProfile 值对象

```typescript
/**
 * 用户配置文件值对象
 *
 * @description 用户配置文件，包含用户的个人信息和偏好设置
 */
export class UserProfile extends BaseValueObject {
  constructor(
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly avatar?: string,
    public readonly phone?: string,
    public readonly timezone: string = 'UTC',
    public readonly language: string = 'zh-CN',
    public readonly preferences: UserPreferences = new UserPreferences()
  ) {
    super();
    this.validate();
  }

  private validate(): void {
    if (!this.firstName || this.firstName.trim().length === 0) {
      throw new InvalidUserProfileException('First name is required');
    }
    if (!this.lastName || this.lastName.trim().length === 0) {
      throw new InvalidUserProfileException('Last name is required');
    }
  }

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
```

### 3.2 值对象设计

#### 3.2.1 UserId 值对象

```typescript
/**
 * 用户ID值对象
 *
 * @description 用户唯一标识符，基于UUID
 */
export class UserId extends EntityId {
  constructor(value: string) {
    super(value);
    this.validate();
  }

  private validate(): void {
    if (!this.isValidUUID(this.value)) {
      throw new InvalidUserIdException(this.value);
    }
  }

  public static generate(): UserId {
    return new UserId(uuidv4());
  }
}
```

#### 3.2.2 Email 值对象

```typescript
/**
 * 邮箱值对象
 *
 * @description 用户邮箱地址，包含验证逻辑
 */
export class Email extends BaseValueObject {
  constructor(public readonly value: string) {
    super();
    this.validate();
  }

  private validate(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.value)) {
      throw new InvalidEmailException(this.value);
    }
  }

  public getDomain(): string {
    return this.value.split('@')[1];
  }
}
```

#### 3.2.3 Password 值对象

```typescript
/**
 * 密码值对象
 *
 * @description 用户密码，包含加密和验证逻辑
 */
export class Password extends BaseValueObject {
  private constructor(private readonly hashedValue: string) {
    super();
  }

  public static create(plainPassword: string): Password {
    const saltRounds = 12;
    const hashedValue = bcrypt.hashSync(plainPassword, saltRounds);
    return new Password(hashedValue);
  }

  public static fromHash(hashedValue: string): Password {
    return new Password(hashedValue);
  }

  public verify(plainPassword: string): boolean {
    return bcrypt.compareSync(plainPassword, this.hashedValue);
  }

  public getHashedValue(): string {
    return this.hashedValue;
  }
}
```

### 3.3 领域服务

#### 3.3.1 UserDomainService

```typescript
/**
 * 用户领域服务
 *
 * @description 处理用户相关的复杂业务逻辑
 */
export class UserDomainService implements IDomainService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly emailService: IEmailService
  ) {}

  public async isEmailUnique(
    email: Email,
    tenantId?: TenantId
  ): Promise<boolean> {
    const existingUser = await this.userRepository.findByEmail(email, tenantId);
    return existingUser === null;
  }

  public async isUsernameUnique(
    username: Username,
    tenantId?: TenantId
  ): Promise<boolean> {
    const existingUser = await this.userRepository.findByUsername(
      username,
      tenantId
    );
    return existingUser === null;
  }

  public async validateUserRegistration(
    email: Email,
    username: Username,
    tenantId?: TenantId
  ): Promise<void> {
    if (!(await this.isEmailUnique(email, tenantId))) {
      throw new EmailAlreadyExistsException(email.value);
    }

    if (!(await this.isUsernameUnique(username, tenantId))) {
      throw new UsernameAlreadyExistsException(username.value);
    }
  }
}
```

### 3.4 领域事件

#### 3.4.1 用户注册事件

```typescript
/**
 * 用户注册事件
 *
 * @description 当用户成功注册时触发
 */
export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly email: Email,
    public readonly tenantId?: TenantId
  ) {
    super();
  }
}
```

#### 3.4.2 用户认证事件

```typescript
/**
 * 用户认证事件
 *
 * @description 当用户成功认证时触发
 */
export class UserAuthenticatedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly timestamp: Date = new Date()
  ) {
    super();
  }
}
```

---

## 4. 应用层设计

### 4.1 命令处理器

#### 4.1.1 用户注册命令处理器

```typescript
/**
 * 用户注册命令处理器
 *
 * @description 处理用户注册命令
 */
@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler
  implements ICommandHandler<RegisterUserCommand>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userDomainService: UserDomainService,
    private readonly eventBus: IEventBus
  ) {}

  async execute(command: RegisterUserCommand): Promise<UserId> {
    // 验证用户注册信息
    await this.userDomainService.validateUserRegistration(
      command.email,
      command.username,
      command.tenantId
    );

    // 创建用户实体
    const user = User.create(
      UserId.generate(),
      command.email,
      command.username,
      Password.create(command.password),
      UserProfile.create(command.profile),
      UserStatus.Pending,
      command.tenantId
    );

    // 注册用户
    user.register(
      command.email,
      command.username,
      Password.create(command.password)
    );

    // 保存用户
    await this.userRepository.save(user);

    // 发布领域事件
    await this.eventBus.publishAll(user.getUncommittedEvents());

    return user.getId();
  }
}
```

### 4.2 查询处理器

#### 4.2.1 获取用户查询处理器

```typescript
/**
 * 获取用户查询处理器
 *
 * @description 处理获取用户信息的查询
 */
@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(query: GetUserQuery): Promise<UserDto> {
    const user = await this.userRepository.findById(query.userId);

    if (!user) {
      throw new UserNotFoundException(query.userId.value);
    }

    return UserDto.fromEntity(user);
  }
}
```

### 4.3 事件处理器

#### 4.3.1 用户注册事件处理器

```typescript
/**
 * 用户注册事件处理器
 *
 * @description 处理用户注册成功后的后续操作
 */
@EventsHandler(UserRegisteredEvent)
export class UserRegisteredHandler
  implements IEventHandler<UserRegisteredEvent>
{
  constructor(
    private readonly emailService: IEmailService,
    private readonly notificationService: INotificationService
  ) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    // 发送欢迎邮件
    await this.emailService.sendWelcomeEmail(event.email);

    // 发送通知
    await this.notificationService.notifyUserRegistration(event.userId);
  }
}
```

---

## 5. 接口层设计

### 5.1 REST API 控制器

#### 5.1.1 用户控制器

```typescript
/**
 * 用户REST API控制器
 *
 * @description 提供用户管理的REST API接口
 */
@Controller('users')
@UseGuards(JwtAuthGuard, TenantIsolationGuard)
export class UserController extends BaseController {
  constructor(
    private readonly commandBus: ICommandBus,
    private readonly queryBus: IQueryBus
  ) {
    super();
  }

  @Post('register')
  @RequirePermissions('user:create')
  async register(@Body() dto: RegisterUserDto): Promise<UserDto> {
    const command = new RegisterUserCommand(
      Email.create(dto.email),
      Username.create(dto.username),
      dto.password,
      UserProfile.create(dto.profile),
      this.getCurrentTenantId()
    );

    const userId = await this.commandBus.execute(command);

    const query = new GetUserQuery(userId);
    return await this.queryBus.execute(query);
  }

  @Post('authenticate')
  async authenticate(@Body() dto: AuthenticateUserDto): Promise<AuthResultDto> {
    const command = new AuthenticateUserCommand(
      Email.create(dto.email),
      dto.password,
      this.getCurrentTenantId()
    );

    const isAuthenticated = await this.commandBus.execute(command);

    return new AuthResultDto(isAuthenticated);
  }

  @Get(':id')
  @RequirePermissions('user:read')
  async getUser(@Param('id') id: string): Promise<UserDto> {
    const query = new GetUserQuery(UserId.create(id));
    return await this.queryBus.execute(query);
  }

  @Put(':id/profile')
  @RequirePermissions('user:update')
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateUserProfileDto
  ): Promise<UserDto> {
    const command = new UpdateUserProfileCommand(
      UserId.create(id),
      UserProfile.create(dto.profile)
    );

    await this.commandBus.execute(command);

    const query = new GetUserQuery(UserId.create(id));
    return await this.queryBus.execute(query);
  }
}
```

### 5.2 GraphQL 解析器

#### 5.2.1 用户 GraphQL 解析器

```typescript
/**
 * 用户GraphQL解析器
 *
 * @description 提供用户管理的GraphQL接口
 */
@Resolver(() => User)
export class UserResolver extends BaseResolver {
  constructor(
    private readonly commandBus: ICommandBus,
    private readonly queryBus: IQueryBus
  ) {
    super();
  }

  @Mutation(() => User)
  @RequirePermissions('user:create')
  async registerUser(@Args('input') input: RegisterUserInput): Promise<User> {
    const command = new RegisterUserCommand(
      Email.create(input.email),
      Username.create(input.username),
      input.password,
      UserProfile.create(input.profile),
      this.getCurrentTenantId()
    );

    const userId = await this.commandBus.execute(command);

    const query = new GetUserQuery(userId);
    return await this.queryBus.execute(query);
  }

  @Query(() => User)
  @RequirePermissions('user:read')
  async user(@Args('id') id: string): Promise<User> {
    const query = new GetUserQuery(UserId.create(id));
    return await this.queryBus.execute(query);
  }
}
```

---

## 6. 基础设施层设计

### 6.1 仓储实现

#### 6.1.1 用户仓储实现

```typescript
/**
 * 用户仓储实现
 *
 * @description 基于MikroORM的用户仓储实现
 */
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userEntityRepository: EntityRepository<UserEntity>,
    private readonly mapper: UserMapper
  ) {}

  async findById(id: UserId): Promise<User | null> {
    const entity = await this.userEntityRepository.findOne({ id: id.value });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByEmail(email: Email, tenantId?: TenantId): Promise<User | null> {
    const where: any = { email: email.value };
    if (tenantId) {
      where.tenantId = tenantId.value;
    }

    const entity = await this.userEntityRepository.findOne(where);
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async save(user: User): Promise<void> {
    const entity = this.mapper.toEntity(user);
    await this.userEntityRepository.persistAndFlush(entity);
  }
}
```

### 6.2 外部服务适配器

#### 6.2.1 邮件服务适配器

```typescript
/**
 * 邮件服务适配器
 *
 * @description 邮件服务的外部适配器实现
 */
@Injectable()
export class EmailServiceAdapter implements IEmailService {
  constructor(
    private readonly emailClient: EmailClient,
    private readonly templateEngine: TemplateEngine
  ) {}

  async sendWelcomeEmail(email: Email): Promise<void> {
    const template = await this.templateEngine.render('welcome-email', {
      email: email.value,
    });

    await this.emailClient.send({
      to: email.value,
      subject: '欢迎注册',
      html: template,
    });
  }
}
```

---

## 7. 项目结构

```
packages/user-management/
├── src/
│   ├── domain/                    # 领域层
│   │   ├── entities/             # 实体
│   │   │   ├── user.entity.ts
│   │   │   └── user-profile.entity.ts
│   │   ├── value-objects/        # 值对象
│   │   │   ├── user-id.vo.ts
│   │   │   ├── email.vo.ts
│   │   │   ├── username.vo.ts
│   │   │   ├── password.vo.ts
│   │   │   └── user-preferences.vo.ts
│   │   ├── aggregates/           # 聚合根
│   │   │   └── user.aggregate.ts
│   │   ├── services/             # 领域服务
│   │   │   └── user-domain.service.ts
│   │   ├── events/               # 领域事件
│   │   │   ├── user-registered.event.ts
│   │   │   ├── user-authenticated.event.ts
│   │   │   └── user-profile-updated.event.ts
│   │   ├── repositories/         # 仓储接口
│   │   │   └── user.repository.interface.ts
│   │   └── exceptions/           # 领域异常
│   │       ├── user-not-found.exception.ts
│   │       ├── email-already-exists.exception.ts
│   │       └── username-already-exists.exception.ts
│   ├── application/              # 应用层
│   │   ├── commands/             # 命令
│   │   │   ├── register-user.command.ts
│   │   │   ├── authenticate-user.command.ts
│   │   │   └── update-user-profile.command.ts
│   │   ├── queries/              # 查询
│   │   │   ├── get-user.query.ts
│   │   │   └── get-user-list.query.ts
│   │   ├── handlers/             # 处理器
│   │   │   ├── commands/
│   │   │   │   ├── register-user.handler.ts
│   │   │   │   ├── authenticate-user.handler.ts
│   │   │   │   └── update-user-profile.handler.ts
│   │   │   ├── queries/
│   │   │   │   ├── get-user.handler.ts
│   │   │   │   └── get-user-list.handler.ts
│   │   │   └── events/
│   │   │       ├── user-registered.handler.ts
│   │   │       └── user-authenticated.handler.ts
│   │   └── dto/                  # 数据传输对象
│   │       ├── user.dto.ts
│   │       ├── register-user.dto.ts
│   │       └── update-user-profile.dto.ts
│   ├── infrastructure/          # 基础设施层
│   │   ├── repositories/         # 仓储实现
│   │   │   └── user.repository.ts
│   │   ├── entities/             # 数据库实体
│   │   │   └── user.entity.ts
│   │   ├── mappers/             # 数据映射器
│   │   │   └── user.mapper.ts
│   │   └── services/             # 外部服务适配器
│   │       ├── email.service.ts
│   │       └── notification.service.ts
│   ├── interface/                # 接口层
│   │   ├── controllers/          # REST控制器
│   │   │   └── user.controller.ts
│   │   ├── resolvers/            # GraphQL解析器
│   │   │   └── user.resolver.ts
│   │   ├── guards/               # 守卫
│   │   │   └── user-permission.guard.ts
│   │   └── pipes/                # 管道
│   │       └── user-validation.pipe.ts
│   ├── types/                    # 类型定义
│   │   ├── user.types.ts
│   │   └── user-management.types.ts
│   └── tests/                    # 测试
│       ├── unit/                 # 单元测试
│       ├── integration/         # 集成测试
│       └── e2e/                  # 端到端测试
├── docs/                        # 文档
│   └── user-management-architecture-design.md
├── package.json
├── project.json
├── tsconfig.json
└── README.md
```

---

## 8. 实现计划

### 8.1 第一阶段：核心领域模型 (1-2 天)

- [ ] 实现 User 聚合根
- [ ] 实现 UserProfile 值对象
- [ ] 实现 UserId、Email、Username、Password 值对象
- [ ] 实现 UserDomainService
- [ ] 实现领域事件
- [ ] 编写单元测试

### 8.2 第二阶段：应用层实现 (2-3 天)

- [ ] 实现命令处理器
- [ ] 实现查询处理器
- [ ] 实现事件处理器
- [ ] 编写应用层测试

### 8.3 第三阶段：接口层实现 (2-3 天)

- [ ] 实现 REST API 控制器
- [ ] 实现 GraphQL 解析器
- [ ] 实现 DTO 和验证
- [ ] 编写接口层测试

### 8.4 第四阶段：基础设施层实现 (2-3 天)

- [ ] 实现用户仓储
- [ ] 实现外部服务适配器
- [ ] 实现数据映射器
- [ ] 编写基础设施层测试

### 8.5 第五阶段：集成测试 (1-2 天)

- [ ] 端到端测试
- [ ] 性能测试
- [ ] 安全测试
- [ ] 文档完善

---

## 9. 验证方案

### 9.1 架构验证

#### 9.1.1 分层架构验证

- ✅ 领域层不依赖任何其他层
- ✅ 应用层只依赖领域层
- ✅ 接口层依赖应用层和领域层
- ✅ 基础设施层实现领域层接口

#### 9.1.2 DDD 模式验证

- ✅ 聚合根设计合理
- ✅ 值对象不可变
- ✅ 领域服务处理复杂业务逻辑
- ✅ 领域事件正确发布

#### 9.1.3 CQRS 模式验证

- ✅ 命令和查询分离
- ✅ 命令处理器处理写操作
- ✅ 查询处理器处理读操作
- ✅ 事件处理器处理副作用

### 9.2 功能验证

#### 9.2.1 用户注册流程

1. 用户提交注册信息
2. 验证邮箱和用户名唯一性
3. 创建用户实体
4. 发布用户注册事件
5. 发送欢迎邮件

#### 9.2.2 用户认证流程

1. 用户提交认证信息
2. 验证用户存在性
3. 验证密码正确性
4. 发布用户认证事件
5. 返回认证结果

#### 9.2.3 用户信息管理流程

1. 用户提交更新信息
2. 验证用户权限
3. 更新用户信息
4. 发布用户信息更新事件
5. 返回更新结果

### 9.3 性能验证

#### 9.3.1 并发测试

- 1000 个并发用户注册
- 1000 个并发用户认证
- 1000 个并发用户信息查询

#### 9.3.2 响应时间测试

- 用户注册响应时间 < 500ms
- 用户认证响应时间 < 200ms
- 用户信息查询响应时间 < 100ms

### 9.4 安全验证

#### 9.4.1 认证安全

- 密码使用 bcrypt 加密
- 认证令牌使用 JWT
- 会话管理安全

#### 9.4.2 授权安全

- 基于角色的权限控制
- 租户级别的数据隔离
- 细粒度的权限验证

---

## 🎯 总结

用户管理模块设计方案基于现有的 Hybrid Architecture 架构，严格遵循 Clean Architecture、DDD、CQRS 等设计原则，确保：

1. **架构一致性**: 与现有架构完美集成
2. **业务完整性**: 覆盖用户管理的完整生命周期
3. **技术先进性**: 使用最新的架构模式和设计原则
4. **可维护性**: 清晰的代码结构和职责分离
5. **可扩展性**: 支持未来业务需求的扩展

通过这个设计方案，我们可以验证现有架构的合理性，并为后续的业务模块开发提供参考模板。
