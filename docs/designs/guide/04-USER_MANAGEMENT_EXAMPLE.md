# 用户管理模块应用示例

> **版本**: 1.0.0 | **创建日期**: 2025-01-27 | **模块**: packages/hybrid-archi

---

## 📋 目录

- [1. 模块概述](#1-模块概述)
- [2. 领域层实现](#2-领域层实现)
- [3. 应用层实现](#3-应用层实现)
- [4. 基础设施层实现](#4-基础设施层实现)
- [5. 接口层实现](#5-接口层实现)
- [6. 完整示例](#6-完整示例)

---

## 1. 模块概述

### 1.1 业务需求

用户管理模块是SAAS平台的核心基础模块，负责管理平台内的所有用户实体，包括：

- **用户注册**: 新用户注册和账户创建
- **用户认证**: 用户登录和身份验证
- **用户授权**: 用户权限管理和访问控制
- **用户信息管理**: 用户资料更新和个人信息管理
- **用户状态管理**: 用户激活、停用、删除等状态变更

### 1.2 技术架构

基于 Hybrid Architecture 的混合架构模式：

- **Clean Architecture**: 清晰的分层架构
- **DDD**: 充血模型和领域建模
- **CQRS**: 命令查询职责分离
- **Event Sourcing**: 事件溯源
- **Event-Driven Architecture**: 事件驱动架构

### 1.3 模块结构

```
packages/user-management/src/
├── domain/                    # 领域层
│   ├── entities/             # 实体
│   │   ├── user.entity.ts
│   │   └── user.aggregate.ts
│   ├── value-objects/        # 值对象
│   │   ├── email.vo.ts
│   │   ├── password.vo.ts
│   │   └── username.vo.ts
│   ├── services/             # 领域服务
│   │   └── user-domain.service.ts
│   ├── events/               # 领域事件
│   │   ├── user-created.event.ts
│   │   ├── user-updated.event.ts
│   │   └── user-activated.event.ts
│   └── enums/                # 枚举
│       └── user-status.enum.ts
├── application/              # 应用层
│   ├── commands/             # 命令
│   │   ├── create-user.command.ts
│   │   ├── update-user.command.ts
│   │   ├── activate-user.command.ts
│   │   └── handlers/         # 命令处理器
│   │       ├── create-user.handler.ts
│   │       ├── update-user.handler.ts
│   │       └── activate-user.handler.ts
│   ├── queries/              # 查询
│   │   ├── get-user.query.ts
│   │   ├── get-users.query.ts
│   │   └── handlers/         # 查询处理器
│   │       ├── get-user.handler.ts
│   │       └── get-users.handler.ts
│   └── use-cases/            # 用例
│       ├── create-user.use-case.ts
│       └── update-user.use-case.ts
├── infrastructure/           # 基础设施层
│   ├── adapters/            # 适配器
│   │   ├── user.repository.ts
│   │   └── user-cache.adapter.ts
│   ├── entities/            # 数据库实体
│   │   └── user.entity.ts
│   └── mappers/             # 映射器
│       └── user.mapper.ts
├── interface/                # 接口层
│   ├── controllers/         # 控制器
│   │   └── user.controller.ts
│   ├── resolvers/           # GraphQL解析器
│   │   └── user.resolver.ts
│   └── dto/                 # 数据传输对象
│       ├── create-user.dto.ts
│       └── user.dto.ts
└── constants.ts             # 常量定义
```

---

## 2. 领域层实现

### 2.1 实体实现

#### 2.1.1 用户实体

```typescript
// domain/entities/user.entity.ts
import { BaseEntity, EntityId } from '@hl8/hybrid-archi';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { Username } from '../value-objects/username.vo';
import { UserProfile } from '../value-objects/user-profile.vo';
import { UserStatus } from '../enums/user-status.enum';

/**
 * 用户实体
 * 
 * @description 用户聚合根，管理用户的完整生命周期
 * 包含用户基础信息、认证信息、权限信息等
 */
export class User extends BaseEntity {
  private constructor(
    private readonly _id: EntityId,
    private _email: Email,
    private _username: Username,
    private _password: Password,
    private _profile: UserProfile,
    private _status: UserStatus,
    private _tenantId?: string
  ) {
    super(_id);
  }

  // 业务方法 - 用户注册
  public register(email: Email, username: Username, password: Password, profile: UserProfile): void {
    if (this._status !== UserStatus.Pending) {
      throw new UserAlreadyRegisteredException();
    }
    
    this._email = email;
    this._username = username;
    this._password = password;
    this._profile = profile;
    this._status = UserStatus.Active;
    
    this.addDomainEvent(new UserRegisteredEvent(this._id, this._email));
  }

  // 业务方法 - 用户认证
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

  // 业务方法 - 更新用户资料
  public updateProfile(profile: UserProfile): void {
    this._profile = profile;
    this.addDomainEvent(new UserProfileUpdatedEvent(this._id, profile));
  }

  // 业务方法 - 分配租户
  public assignToTenant(tenantId: string): void {
    this._tenantId = tenantId;
    this.addDomainEvent(new UserAssignedToTenantEvent(this._id, tenantId));
  }

  // 业务方法 - 激活用户
  public activate(): void {
    if (this._status === UserStatus.Active) {
      throw new UserAlreadyActiveException();
    }
    
    this._status = UserStatus.Active;
    this.addDomainEvent(new UserActivatedEvent(this._id));
  }

  // 业务方法 - 停用用户
  public deactivate(): void {
    if (this._status === UserStatus.Inactive) {
      throw new UserAlreadyInactiveException();
    }
    
    this._status = UserStatus.Inactive;
    this.addDomainEvent(new UserDeactivatedEvent(this._id));
  }

  // 获取器方法
  public getEmail(): Email {
    return this._email;
  }

  public getUsername(): Username {
    return this._username;
  }

  public getProfile(): UserProfile {
    return this._profile;
  }

  public getStatus(): UserStatus {
    return this._status;
  }

  public getTenantId(): string | undefined {
    return this._tenantId;
  }

  // 静态工厂方法
  public static create(
    id: EntityId,
    email: Email,
    username: Username,
    password: Password,
    profile: UserProfile,
    status: UserStatus = UserStatus.Pending,
    tenantId?: string
  ): User {
    return new User(id, email, username, password, profile, status, tenantId);
  }
}
```

#### 2.1.2 用户聚合根

```typescript
// domain/entities/user.aggregate.ts
import { BaseAggregateRoot, EntityId } from '@hl8/hybrid-archi';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { Username } from '../value-objects/username.vo';
import { UserProfile } from '../value-objects/user-profile.vo';
import { UserStatus } from '../enums/user-status.enum';
import { 
  UserCreatedEvent, 
  UserActivatedEvent, 
  UserDeactivatedEvent,
  UserProfileUpdatedEvent 
} from '../events';

/**
 * 用户聚合根
 * 
 * @description 用户聚合根，管理用户聚合的一致性边界
 */
export class UserAggregate extends BaseAggregateRoot {
  private constructor(
    private readonly _id: EntityId,
    private _email: Email,
    private _username: Username,
    private _password: Password,
    private _profile: UserProfile,
    private _status: UserStatus,
    private _tenantId?: string
  ) {
    super(_id);
  }

  // 聚合业务方法 - 创建用户
  public createUser(email: Email, username: Username, password: Password, profile: UserProfile): void {
    this._email = email;
    this._username = username;
    this._password = password;
    this._profile = profile;
    this._status = UserStatus.Pending;
    
    this.addDomainEvent(new UserCreatedEvent(this._id, this._email, this._username));
  }

  // 聚合业务方法 - 激活用户
  public activateUser(): void {
    if (this._status !== UserStatus.Pending) {
      throw new UserNotPendingException();
    }
    
    this._status = UserStatus.Active;
    this.addDomainEvent(new UserActivatedEvent(this._id));
  }

  // 聚合业务方法 - 更新用户资料
  public updateUserProfile(profile: UserProfile): void {
    this._profile = profile;
    this.addDomainEvent(new UserProfileUpdatedEvent(this._id, profile));
  }

  // 获取器方法
  public getEmail(): Email {
    return this._email;
  }

  public getUsername(): Username {
    return this._username;
  }

  public getProfile(): UserProfile {
    return this._profile;
  }

  public getStatus(): UserStatus {
    return this._status;
  }

  public getTenantId(): string | undefined {
    return this._tenantId;
  }

  // 静态工厂方法
  public static create(
    id: EntityId,
    email: Email,
    username: Username,
    password: Password,
    profile: UserProfile,
    status: UserStatus = UserStatus.Pending,
    tenantId?: string
  ): UserAggregate {
    return new UserAggregate(id, email, username, password, profile, status, tenantId);
  }
}
```

### 2.2 值对象实现

#### 2.2.1 邮箱值对象

```typescript
// domain/value-objects/email.vo.ts
import { BaseValueObject } from '@hl8/hybrid-archi';

/**
 * 邮箱值对象
 * 
 * @description 邮箱地址值对象，确保邮箱格式正确
 */
export class Email extends BaseValueObject {
  private constructor(private readonly value: string) {
    super();
    this.validate();
  }

  private validate(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new InvalidEmailException('Email cannot be empty');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.value)) {
      throw new InvalidEmailException('Invalid email format');
    }
  }

  public getValue(): string {
    return this.value;
  }

  public getDomain(): string {
    return this.value.split('@')[1];
  }

  public getLocalPart(): string {
    return this.value.split('@')[0];
  }

  protected arePropertiesEqual(other: Email): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  public static create(value: string): Email {
    return new Email(value);
  }
}
```

#### 2.2.2 密码值对象

```typescript
// domain/value-objects/password.vo.ts
import { BaseValueObject } from '@hl8/hybrid-archi';
import * as crypto from 'crypto';

/**
 * 密码值对象
 * 
 * @description 密码值对象，处理密码加密和验证
 */
export class Password extends BaseValueObject {
  private constructor(
    private readonly hashedValue: string,
    private readonly salt: string
  ) {
    super();
  }

  public verify(plainPassword: string): boolean {
    const hash = this.hashPassword(plainPassword, this.salt);
    return hash === this.hashedValue;
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  protected arePropertiesEqual(other: Password): boolean {
    return this.hashedValue === other.hashedValue && this.salt === other.salt;
  }

  public static create(plainPassword: string): Password {
    const salt = crypto.randomBytes(32).toString('hex');
    const hashedValue = crypto.pbkdf2Sync(plainPassword, salt, 10000, 64, 'sha512').toString('hex');
    return new Password(hashedValue, salt);
  }
}
```

### 2.3 领域事件实现

#### 2.3.1 用户创建事件

```typescript
// domain/events/user-created.event.ts
import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';
import { Email } from '../value-objects/email.vo';
import { Username } from '../value-objects/username.vo';

/**
 * 用户创建事件
 * 
 * @description 当用户成功创建时触发
 */
export class UserCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: EntityId,
    public readonly email: Email,
    public readonly username: Username
  ) {
    super();
  }
}
```

#### 2.3.2 用户激活事件

```typescript
// domain/events/user-activated.event.ts
import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';

/**
 * 用户激活事件
 * 
 * @description 当用户成功激活时触发
 */
export class UserActivatedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: EntityId,
    public readonly timestamp: Date = new Date()
  ) {
    super();
  }
}
```

---

## 3. 应用层实现

### 3.1 命令实现

#### 3.1.1 创建用户命令

```typescript
// application/commands/create-user.command.ts
import { BaseCommand } from '@hl8/hybrid-archi';

/**
 * 创建用户命令
 * 
 * @description 创建新用户的命令
 */
export class CreateUserCommand extends BaseCommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly password: string,
    public readonly profile: UserProfileDto,
    tenantId?: string,
    userId?: string
  ) {
    super(tenantId, userId);
  }
}
```

#### 3.1.2 更新用户命令

```typescript
// application/commands/update-user.command.ts
import { BaseCommand } from '@hl8/hybrid-archi';

/**
 * 更新用户命令
 * 
 * @description 更新用户信息的命令
 */
export class UpdateUserCommand extends BaseCommand {
  constructor(
    public readonly userId: string,
    public readonly name?: string,
    public readonly email?: string,
    public readonly profile?: UserProfileDto,
    tenantId?: string,
    user?: string
  ) {
    super(tenantId, user);
  }
}
```

### 3.2 查询实现

#### 3.2.1 获取用户查询

```typescript
// application/queries/get-user.query.ts
import { BaseQuery } from '@hl8/hybrid-archi';

/**
 * 获取用户查询
 * 
 * @description 根据用户ID获取用户信息
 */
export class GetUserQuery extends BaseQuery<UserDto> {
  constructor(
    public readonly userId: string,
    tenantId?: string,
    user?: string
  ) {
    super(tenantId, user);
  }
}
```

### 3.3 用例实现

#### 3.3.1 创建用户用例

```typescript
// application/use-cases/create-user.use-case.ts
import { BaseUseCase, IUseCase } from '@hl8/hybrid-archi';
import { EntityId } from '@hl8/hybrid-archi';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { Username } from '../../domain/value-objects/username.vo';
import { UserProfile } from '../../domain/value-objects/user-profile.vo';
import { UserStatus } from '../../domain/enums/user-status.enum';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { IEventBus } from '../interfaces/event-bus.interface';

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  profile: UserProfileDto;
}

export interface CreateUserResponse {
  userId: string;
  name: string;
  email: string;
  status: UserStatus;
}

/**
 * 创建用户用例
 * 
 * @description 创建新用户的用例
 */
export class CreateUserUseCase extends BaseUseCase<CreateUserRequest, CreateUserResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus
  ) {
    super();
  }

  async executeUseCase(request: CreateUserRequest): Promise<CreateUserResponse> {
    // 1. 创建用户实体
    const user = User.create(
      EntityId.generate(),
      Email.create(request.email),
      Username.create(request.name),
      Password.create(request.password),
      UserProfile.create(request.profile),
      UserStatus.Pending
    );

    // 2. 保存用户
    await this.userRepository.save(user);

    // 3. 发布领域事件
    await this.eventBus.publishAll(user.getUncommittedEvents());

    return {
      userId: user.getId().toString(),
      name: user.getUsername().getValue(),
      email: user.getEmail().getValue(),
      status: user.getStatus()
    };
  }
}
```

### 3.4 命令处理器实现

#### 3.4.1 创建用户命令处理器

```typescript
// application/commands/handlers/create-user.handler.ts
import { ICommandHandler } from '@hl8/hybrid-archi';
import { CreateUserCommand } from '../commands/create-user.command';
import { CreateUserUseCase } from '../use-cases/create-user.use-case';

/**
 * 创建用户命令处理器
 * 
 * @description 处理创建用户命令
 */
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, string> {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase
  ) {}

  async handle(command: CreateUserCommand): Promise<string> {
    const request = {
      name: command.name,
      email: command.email,
      password: command.password,
      profile: command.profile
    };

    const response = await this.createUserUseCase.execute(request);
    return response.userId;
  }
}
```

#### 3.4.2 获取用户查询处理器

```typescript
// application/queries/handlers/get-user.handler.ts
import { IQueryHandler } from '@hl8/hybrid-archi';
import { GetUserQuery } from '../queries/get-user.query';
import { GetUserUseCase } from '../use-cases/get-user.use-case';

/**
 * 获取用户查询处理器
 * 
 * @description 处理获取用户查询
 */
export class GetUserHandler implements IQueryHandler<GetUserQuery, any> {
  constructor(
    private readonly getUserUseCase: GetUserUseCase
  ) {}

  async handle(query: GetUserQuery): Promise<any> {
    const request = {
      userId: query.userId
    };

    const response = await this.getUserUseCase.execute(request);
    return response.user;
  }
}
```

---

## 4. 基础设施层实现

### 4.1 仓储实现

#### 4.1.1 用户仓储接口

```typescript
// application/interfaces/user-repository.interface.ts
import { EntityId } from '@hl8/hybrid-archi';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { Username } from '../../domain/value-objects/username.vo';

/**
 * 用户仓储接口
 * 
 * @description 用户仓储接口定义
 */
export interface IUserRepository {
  findById(id: EntityId): Promise<User | null>;
  findByEmail(email: Email, tenantId?: string): Promise<User | null>;
  findByUsername(username: Username, tenantId?: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: EntityId): Promise<void>;
}
```

#### 4.1.2 用户仓储实现

```typescript
// infrastructure/adapters/user.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/core';
import { IUserRepository } from '../../application/interfaces/user-repository.interface';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { Username } from '../../domain/value-objects/username.vo';
import { EntityId } from '@hl8/hybrid-archi';
import { UserEntity } from '../entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';

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

  async findById(id: EntityId): Promise<User | null> {
    const entity = await this.userEntityRepository.findOne({ id: id.toString() });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByEmail(email: Email, tenantId?: string): Promise<User | null> {
    const where: any = { email: email.getValue() };
    if (tenantId) {
      where.tenantId = tenantId;
    }
    
    const entity = await this.userEntityRepository.findOne(where);
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByUsername(username: Username, tenantId?: string): Promise<User | null> {
    const where: any = { username: username.getValue() };
    if (tenantId) {
      where.tenantId = tenantId;
    }
    
    const entity = await this.userEntityRepository.findOne(where);
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async save(user: User): Promise<void> {
    const entity = this.mapper.toEntity(user);
    await this.userEntityRepository.persistAndFlush(entity);
  }

  async delete(id: EntityId): Promise<void> {
    await this.userEntityRepository.nativeDelete({ id: id.toString() });
  }
}
```

### 4.2 数据库实体实现

#### 4.2.1 用户数据库实体

```typescript
// infrastructure/entities/user.entity.ts
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

/**
 * 用户数据库实体
 * 
 * @description 用户数据库实体，用于数据持久化
 */
@Entity({ tableName: 'users' })
export class UserEntity {
  @PrimaryKey()
  id: string;

  @Property()
  email: string;

  @Property()
  username: string;

  @Property()
  password: string;

  @Property()
  salt: string;

  @Property()
  firstName: string;

  @Property()
  lastName: string;

  @Property({ nullable: true })
  avatar?: string;

  @Property({ nullable: true })
  phone?: string;

  @Property()
  timezone: string;

  @Property()
  language: string;

  @Property()
  status: string;

  @Property({ nullable: true })
  tenantId?: string;

  @Property()
  createdAt: Date;

  @Property()
  updatedAt: Date;
}
```

### 4.3 映射器实现

#### 4.3.1 用户映射器

```typescript
// infrastructure/mappers/user.mapper.ts
import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserEntity } from '../entities/user.entity';
import { EntityId } from '@hl8/hybrid-archi';
import { Email } from '../../domain/value-objects/email.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { Username } from '../../domain/value-objects/username.vo';
import { UserProfile } from '../../domain/value-objects/user-profile.vo';
import { UserStatus } from '../../domain/enums/user-status.enum';

/**
 * 用户映射器
 * 
 * @description 用户领域对象与数据库实体之间的映射
 */
@Injectable()
export class UserMapper {
  toDomain(entity: UserEntity): User {
    return User.create(
      EntityId.create(entity.id),
      Email.create(entity.email),
      Username.create(entity.username),
      new Password(entity.password, entity.salt),
      UserProfile.create({
        firstName: entity.firstName,
        lastName: entity.lastName,
        avatar: entity.avatar,
        phone: entity.phone,
        timezone: entity.timezone,
        language: entity.language
      }),
      entity.status as UserStatus,
      entity.tenantId
    );
  }

  toEntity(user: User): UserEntity {
    const entity = new UserEntity();
    entity.id = user.getId().toString();
    entity.email = user.getEmail().getValue();
    entity.username = user.getUsername().getValue();
    entity.password = user.getPassword().getHashedValue();
    entity.salt = user.getPassword().getSalt();
    entity.firstName = user.getProfile().getFirstName();
    entity.lastName = user.getProfile().getLastName();
    entity.avatar = user.getProfile().getAvatar();
    entity.phone = user.getProfile().getPhone();
    entity.timezone = user.getProfile().getTimezone();
    entity.language = user.getProfile().getLanguage();
    entity.status = user.getStatus();
    entity.tenantId = user.getTenantId();
    entity.createdAt = user.getCreatedAt();
    entity.updatedAt = user.getUpdatedAt();
    return entity;
  }
}
```

---

## 5. 接口层实现

### 5.1 控制器实现

#### 5.1.1 用户REST控制器

```typescript
// interface/controllers/user.controller.ts
import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BaseController, JwtAuthGuard, TenantIsolationGuard } from '@hl8/hybrid-archi';
import { ICommandBus, IQueryBus } from '@hl8/hybrid-archi';
import { CreateUserCommand } from '../../application/commands/create-user.command';
import { UpdateUserCommand } from '../../application/commands/update-user.command';
import { GetUserQuery } from '../../application/queries/get-user.query';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserDto } from '../dto/user.dto';

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

  @Post()
  async createUser(@Body() dto: CreateUserDto): Promise<UserDto> {
    const command = new CreateUserCommand(
      dto.name,
      dto.email,
      dto.password,
      dto.profile,
      this.getCurrentTenantId()
    );

    const userId = await this.commandBus.execute(command);
    
    const query = new GetUserQuery(userId);
    return await this.queryBus.execute(query);
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<UserDto> {
    const query = new GetUserQuery(id, this.getCurrentTenantId());
    return await this.queryBus.execute(query);
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto
  ): Promise<UserDto> {
    const command = new UpdateUserCommand(
      id,
      dto.name,
      dto.email,
      dto.profile,
      this.getCurrentTenantId()
    );

    await this.commandBus.execute(command);
    
    const query = new GetUserQuery(id, this.getCurrentTenantId());
    return await this.queryBus.execute(query);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<void> {
    // 实现删除用户逻辑
  }
}
```

### 5.2 DTO实现

#### 5.2.1 创建用户DTO

```typescript
// interface/dto/create-user.dto.ts
import { IsString, IsEmail, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

/**
 * 创建用户DTO
 * 
 * @description 创建用户的请求数据传输对象
 */
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsNotEmpty()
  profile: UserProfileDto;
}

/**
 * 用户资料DTO
 * 
 * @description 用户资料数据传输对象
 */
export class UserProfileDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;

  @IsString()
  @MaxLength(500)
  avatar?: string;

  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsNotEmpty()
  timezone: string;

  @IsString()
  @IsNotEmpty()
  language: string;
}
```

#### 5.2.2 用户DTO

```typescript
// interface/dto/user.dto.ts
/**
 * 用户DTO
 * 
 * @description 用户数据传输对象
 */
export class UserDto {
  id: string;
  name: string;
  email: string;
  profile: UserProfileDto;
  status: string;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(user: User): UserDto {
    return {
      id: user.getId().toString(),
      name: user.getUsername().getValue(),
      email: user.getEmail().getValue(),
      profile: {
        firstName: user.getProfile().getFirstName(),
        lastName: user.getProfile().getLastName(),
        avatar: user.getProfile().getAvatar(),
        phone: user.getProfile().getPhone(),
        timezone: user.getProfile().getTimezone(),
        language: user.getProfile().getLanguage()
      },
      status: user.getStatus(),
      tenantId: user.getTenantId(),
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt()
    };
  }
}
```

---

## 6. 完整示例

### 6.1 模块配置

#### 6.1.1 用户管理模块

```typescript
// user-management.module.ts
import { Module } from '@nestjs/common';
import { HybridArchitectureModule } from '@hl8/hybrid-archi';
import { UserController } from './interface/controllers/user.controller';
import { UserRepository } from './infrastructure/adapters/user.repository';
import { UserMapper } from './infrastructure/mappers/user.mapper';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { CreateUserHandler } from './application/commands/handlers/create-user.handler';
import { GetUserHandler } from './application/queries/handlers/get-user.handler';

@Module({
  imports: [
    HybridArchitectureModule.forFeature({
      entities: [UserEntity],
      repositories: [UserRepository],
      useCases: [CreateUserUseCase],
      handlers: [CreateUserHandler, GetUserHandler]
    })
  ],
  controllers: [UserController],
  providers: [
    UserRepository,
    UserMapper,
    CreateUserUseCase,
    CreateUserHandler,
    GetUserHandler
  ],
  exports: [UserRepository, CreateUserUseCase]
})
export class UserManagementModule {}
```

### 6.2 使用示例

#### 6.2.1 创建用户

```typescript
// 使用示例
const createUserDto: CreateUserDto = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    timezone: 'UTC',
    language: 'en'
  }
};

// 通过REST API创建用户
const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: JSON.stringify(createUserDto)
});

const user = await response.json();
console.log('Created user:', user);
```

#### 6.2.2 获取用户

```typescript
// 获取用户信息
const response = await fetch('/api/users/123', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
});

const user = await response.json();
console.log('User info:', user);
```

---

## 🎯 总结

用户管理模块应用示例展示了如何基于 Hybrid Architecture 实现一个完整的业务模块：

1. **领域层**: 实现了充血模型，包含实体、值对象、领域事件
2. **应用层**: 实现了CQRS模式，包含命令、查询、用例
3. **基础设施层**: 实现了仓储模式，包含数据库适配器、映射器
4. **接口层**: 实现了REST API，包含控制器、DTO

这个示例为其他业务模块的开发提供了完整的参考模板。

---

**下一步**: 查看 [最佳实践和故障排除](./05-BEST_PRACTICES_TROUBLESHOOTING.md) 了解开发过程中的最佳实践和常见问题解决方案。
